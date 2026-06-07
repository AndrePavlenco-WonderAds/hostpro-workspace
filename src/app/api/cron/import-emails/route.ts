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
  type AirbnbConfirmation,
  type AirbnbPayout,
} from "@/lib/gmail/parsers/airbnb";
import {
  bulkAppendImportLog,
  hasMessageBeenLogged,
  type ImportLogEntry,
  type ImportLogStatus,
} from "@/lib/gmail/import-log";
import { getAllEntries } from "@/lib/pnl-store";

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
    dryRun,
  };

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
            const outcome = processMessageInMemory(msg, kind, existingByKey, existingByHmCode);
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

  // Dedup: prefer HM code match (precise — survives stayWindow changes
  // when guests extend their stay), then fall back to property+stayWindow
  // for CSV-imported entries that haven't been backfilled yet.
  const hmCode =
    "confirmationCode" in parsed && parsed.confirmationCode
      ? parsed.confirmationCode
      : undefined;
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
