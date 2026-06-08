// Vercel Cron handler — runs once a day at 06:00 UTC (Hobby plan limit;
// manual trigger via the button in /admin/email-import-log for on-demand).
//
// Performance notes:
//   - Vercel Hobby gives serverless functions up to 60 seconds. The first
//     version did read-modify-write of the import-log blob PER email (45
//     emails × ~2.5 s/op ≈ 110 s) and timed out at ~24. Refactored to:
//       1. accumulate ImportLogEntry objects in memory
//       2. one bulk blob write at the end (1 read + 1 write per cron run)
//       3. parallelise Gmail fetches in chunks of 5 (concurrency cap so we
//          don't hit Gmail rate limits)
//   - With these changes a full retry over 45 emails completes in ~12 s.

import { NextResponse } from "next/server";
import {
  GmailClient,
  extractHtmlBody,
  extractPlainBody,
  getHeader,
  htmlToText,
  type GmailMessage,
} from "@/lib/gmail/client";
import {
  parseAirbnbConfirmation,
  parseAirbnbPayout,
  parseAirbnbCancellation,
  type AirbnbConfirmation,
  type AirbnbPayout,
} from "@/lib/gmail/parsers/airbnb";
import {
  bulkAppendImportLog,
  hasMessageBeenLogged,
  type ImportLogEntry,
  type ImportLogStatus,
} from "@/lib/gmail/import-log";
import { getAllEntries, deleteEntriesByHmCodes } from "@/lib/pnl-store";

export const maxDuration = 60;        // Hobby plan max

const LABELS = {
  airbnbConf: "hostpro/airbnb-conf",
  airbnbPayout: "hostpro/airbnb-payout",
  processado: "hostpro/processado",
  falhou: "hostpro/falhou",
} as const;

const FETCH_CONCURRENCY = 5;

function authorized(req: Request): boolean {
  const auth = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return auth === `Bearer ${expected}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!refreshToken) {
    return NextResponse.json(
      { error: "GOOGLE_OAUTH_REFRESH_TOKEN missing — visit /admin/connect-gmail." },
      { status: 412 },
    );
  }

  const url = new URL(req.url);
  const retry = url.searchParams.get("retry") === "true";
  const dryRun = process.env.IMPORT_LIVE !== "true";
  const gmail = new GmailClient(refreshToken);

  // Snapshot pnl entries once per cron run for dedup. We key two ways:
  //   (a) HM confirmation code — strongest signal, but only present on
  //       entries that came through this importer or were backfilled.
  //   (b) property + stayWindow — fallback for CSV-imported entries that
  //       don't carry an HM code yet.
  const existingEntries = await getAllEntries();
  const existingByHmCode = new Map<string, string>();   // hmCode → entry id
  const existingByKey = new Map<string, string>();      // "property|stayWindow" → entry id
  for (const e of existingEntries) {
    if (e.kind !== "entrada") continue;
    if (e.hmCode) existingByHmCode.set(e.hmCode, e.id);
    if (e.stayWindow) existingByKey.set(`${e.property}|${e.stayWindow}`, e.id);
  }

  const processadoId = await gmail.ensureLabel(LABELS.processado);
  const falhouId = await gmail.ensureLabel(LABELS.falhou);

  const logBatch: Array<Omit<ImportLogEntry, "id" | "ts">> = [];
  const results = {
    scanned: 0,
    processed: 0,
    failed: 0,
    skipped: 0,
    skippedDuplicate: 0,
    ignored: 0,
    cancelled: 0,
    dryRun,
  };

  // ---------- Pass 0 — cancellations ----------
  //
  // Cancellation emails don't share a Gmail label with the confirmations
  // (different subject pattern), so the cron searches for them on every
  // run. Their HM codes feed the downstream passes so that a confirmation
  // for a cancelled HM never produces a pnl entry, and an existing pnl
  // entry with that hmCode is deleted in LIVE mode.
  const cancelledHmCodes = new Set<string>();
  const cancellationRefs = await gmail.listMessages(
    `from:noreply@airbnb.com subject:"Canceled: Reservation"`,
    100,
  );
  for (const ref of cancellationRefs) {
    try {
      const msg = await gmail.getMessage(ref.id);
      const subject = getHeader(msg, "Subject") ?? "";
      const from = getHeader(msg, "From") ?? "";
      const receivedDate = new Date(Number(msg.internalDate)).toISOString();
      const parsed = parseAirbnbCancellation(subject, receivedDate);
      if (!parsed) continue;
      cancelledHmCodes.add(parsed.hmCode);

      const existingId = existingByHmCode.get(parsed.hmCode);
      logBatch.push({
        messageId: ref.id,
        emailSubject: subject,
        emailFrom: from,
        emailDate: receivedDate,
        kind: "airbnb-cancellation",
        status: "cancelled",
        parsed: { ...parsed, matchedEntryId: existingId },
        pnlEntryId: existingId,
      });
      results.cancelled++;
    } catch (e) {
      // Cancellation parsing is best-effort; don't fail the whole run.
      console.warn("cancellation parse error", (e as Error).message);
    }
  }

  // Actually delete in LIVE mode. Single bulk write to pnl blob.
  if (!dryRun && cancelledHmCodes.size > 0) {
    const removed = await deleteEntriesByHmCodes(cancelledHmCodes);
    for (const id of removed) {
      // Also drop these from the snapshot so the rest of the run reflects
      // the now-mutated state.
      for (const [k, v] of existingByHmCode) if (v === id) existingByHmCode.delete(k);
      for (const [k, v] of existingByKey) if (v === id) existingByKey.delete(k);
    }
  }

  for (const [labelName, kind] of [
    [LABELS.airbnbConf, "airbnb-confirmation"],
    [LABELS.airbnbPayout, "airbnb-payout"],
  ] as const) {
    const q = retry
      ? `label:${labelName}`
      : `label:${labelName} -label:${LABELS.processado} -label:${LABELS.falhou}`;
    const refs = await gmail.listMessages(q, 100);
    results.scanned += refs.length;

    // Process in concurrent chunks so 30 emails don't take 30× one fetch.
    for (let i = 0; i < refs.length; i += FETCH_CONCURRENCY) {
      const chunk = refs.slice(i, i + FETCH_CONCURRENCY);
      await Promise.all(
        chunk.map(async (ref) => {
          try {
            if (!retry && (await hasMessageBeenLogged(ref.id))) {
              results.skipped++;
              await gmail.modifyMessage(ref.id, [processadoId], []);
              return;
            }
            const msg = await gmail.getMessage(ref.id);
            const outcome = processMessageInMemory(msg, kind, existingByKey, existingByHmCode, cancelledHmCodes);
            logBatch.push(outcome.logEntry);

            if (outcome.status === "parse-failed") {
              await gmail.modifyMessage(ref.id, [falhouId], [processadoId]);
              results.failed++;
            } else {
              await gmail.modifyMessage(ref.id, [processadoId], [falhouId]);
              if (outcome.status === "skipped") results.skippedDuplicate++;
              else if (outcome.status === "ignored") results.ignored++;
              else results.processed++;
            }
          } catch (e) {
            const err = e as Error;
            logBatch.push({
              messageId: ref.id,
              emailSubject: "",
              emailFrom: "",
              emailDate: new Date().toISOString(),
              kind,
              status: "error",
              error: err.message,
            });
            try { await gmail.modifyMessage(ref.id, [falhouId], []); }
            catch { /* best-effort */ }
            results.failed++;
          }
        }),
      );
    }
  }

  // One blob write for the whole run — see top-of-file comment.
  await bulkAppendImportLog(logBatch);

  return NextResponse.json({ ...results, logged: logBatch.length });
}

function processMessageInMemory(
  msg: GmailMessage,
  kind: ImportLogEntry["kind"],
  existingByKey: Map<string, string>,
  existingByHmCode: Map<string, string>,
  cancelledHmCodes: Set<string>,
): { status: ImportLogStatus; logEntry: Omit<ImportLogEntry, "id" | "ts"> } {
  const subject = getHeader(msg, "Subject") ?? "";
  const from = getHeader(msg, "From") ?? "";
  const receivedDate = new Date(Number(msg.internalDate)).toISOString();

  const html = extractHtmlBody(msg);
  const plain = extractPlainBody(msg);
  const body = html ? htmlToText(html) : plain;
  const emailYear = new Date(Number(msg.internalDate)).getUTCFullYear();

  let parsed: AirbnbConfirmation | AirbnbPayout | null = null;
  if (kind === "airbnb-confirmation") {
    parsed = parseAirbnbConfirmation(subject, body, emailYear, plain);
  } else if (kind === "airbnb-payout") {
    parsed = parseAirbnbPayout(subject, body, receivedDate.slice(0, 10), plain);
  }

  const baseLog = {
    messageId: msg.id,
    emailSubject: subject,
    emailFrom: from,
    emailDate: receivedDate,
    kind,
  };

  if (!parsed) {
    return { status: "parse-failed", logEntry: { ...baseLog, status: "parse-failed" } };
  }

  const classification = parsed.classification;
  if (classification?.kind === "ignored") {
    return {
      status: "ignored",
      logEntry: { ...baseLog, status: "ignored", parsed },
    };
  }

  const property = parsed.property ?? null;
  if (!property) {
    return {
      status: "unknown-listing",
      logEntry: { ...baseLog, status: "unknown-listing", parsed },
    };
  }

  const hmCode =
    "confirmationCode" in parsed && parsed.confirmationCode
      ? parsed.confirmationCode
      : undefined;

  // If a cancellation email exists for this HM, the confirmation/payout
  // must never produce an entrada — log as cancelled so it's clear in the
  // log why we skipped it.
  if (hmCode && cancelledHmCodes.has(hmCode)) {
    return { status: "cancelled", logEntry: { ...baseLog, status: "cancelled", parsed } };
  }

  // Dedup: prefer HM code match (precise — survives stayWindow changes
  // when guests extend their stay), then fall back to property+stayWindow
  // for CSV-imported entries that haven't been backfilled yet.
  if (hmCode && existingByHmCode.has(hmCode)) {
    return { status: "skipped", logEntry: { ...baseLog, status: "skipped", parsed } };
  }

  const stayWindowVal =
    "stayWindow" in parsed && parsed.stayWindow ? parsed.stayWindow : undefined;
  if (stayWindowVal && existingByKey.has(`${property}|${stayWindowVal}`)) {
    return { status: "skipped", logEntry: { ...baseLog, status: "skipped", parsed } };
  }

  return { status: "dry-run", logEntry: { ...baseLog, status: "dry-run", parsed } };
}
