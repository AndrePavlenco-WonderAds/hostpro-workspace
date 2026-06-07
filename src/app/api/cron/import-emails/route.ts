// Vercel Cron handler — runs once a day at 06:00 UTC (Hobby plan limit;
// manual trigger via the button in /admin/email-import-log for on-demand).
//
// For each labelled-but-not-processed message in Gmail:
//   1. fetch full message
//   2. run the matching parser (prefers HTML-stripped body; Airbnb plain
//      body is tabular and unparseable)
//   3. dedupe check — if the property + stayWindow already exists in the
//      pnl blob, skip with status `skipped-duplicate` so we don't double
//      up against the historical CSV imports
//   4. (DRY-RUN MODE) only write to the import log; do NOT touch pnl blob
//   5. apply Gmail label `hostpro/processado` or `hostpro/falhou`

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
  appendImportLog,
  hasMessageBeenLogged,
  type ImportLogEntry,
  type ImportLogStatus,
} from "@/lib/gmail/import-log";
import { getAllEntries } from "@/lib/pnl-store";

const LABELS = {
  airbnbConf: "hostpro/airbnb-conf",
  airbnbPayout: "hostpro/airbnb-payout",
  processado: "hostpro/processado",
  falhou: "hostpro/falhou",
} as const;

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
  // `?retry=true` reprocesses messages that the previous parser version
  // marked `hostpro/falhou`. Used by the manual trigger button so we can
  // iterate on the regex without manually clearing Gmail labels.
  const retry = url.searchParams.get("retry") === "true";

  const dryRun = process.env.IMPORT_LIVE !== "true";
  const gmail = new GmailClient(refreshToken);

  // Snapshot the existing pnl entries once per cron run for fast dedupe.
  // Key by `${property}|${stayWindow}` — same shape both the CSV imports
  // and this cron would produce for an entrada.
  const existingEntries = await getAllEntries();
  const existingByKey = new Set<string>();
  for (const e of existingEntries) {
    if (e.kind !== "entrada") continue;
    if (!e.stayWindow) continue;
    existingByKey.add(`${e.property}|${e.stayWindow}`);
  }

  const processadoId = await gmail.ensureLabel(LABELS.processado);
  const falhouId = await gmail.ensureLabel(LABELS.falhou);

  const results = {
    scanned: 0,
    processed: 0,
    failed: 0,
    skipped: 0,
    skippedDuplicate: 0,
    dryRun,
  };

  for (const [labelName, kind] of [
    [LABELS.airbnbConf, "airbnb-confirmation"],
    [LABELS.airbnbPayout, "airbnb-payout"],
  ] as const) {
    // In retry mode we ignore both the processado and falhou guards so
    // every labelled message gets re-parsed against the latest regex.
    const q = retry
      ? `label:${labelName}`
      : `label:${labelName} -label:${LABELS.processado} -label:${LABELS.falhou}`;
    const messages = await gmail.listMessages(q, 50);
    results.scanned += messages.length;

    for (const ref of messages) {
      try {
        // Idempotency guard — but only when we're NOT in retry mode (in
        // retry mode the operator explicitly wants every labelled message
        // reprocessed against the latest regex).
        if (!retry && (await hasMessageBeenLogged(ref.id))) {
          results.skipped++;
          await gmail.modifyMessage(ref.id, [processadoId], []);
          continue;
        }

        const msg = await gmail.getMessage(ref.id);
        const outcome = await processMessage(msg, kind, dryRun, existingByKey);
        if (outcome.status === "parse-failed") {
          // Add falhou + clear processado so the next non-retry run skips it.
          await gmail.modifyMessage(ref.id, [falhouId], [processadoId]);
          results.failed++;
        } else {
          // Add processado + clear falhou so a parser that now succeeds
          // doesn't leave the message in a misleading state.
          await gmail.modifyMessage(ref.id, [processadoId], [falhouId]);
          if (outcome.status === "skipped") results.skippedDuplicate++;
          else results.processed++;
        }
      } catch (e) {
        const err = e as Error;
        await appendImportLog({
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
    }
  }

  return NextResponse.json(results);
}

async function processMessage(
  msg: GmailMessage,
  kind: ImportLogEntry["kind"],
  dryRun: boolean,
  existingByKey: Set<string>,
): Promise<{ status: ImportLogStatus }> {
  const subject = getHeader(msg, "Subject") ?? "";
  const from = getHeader(msg, "From") ?? "";
  const receivedDate = new Date(Number(msg.internalDate)).toISOString();

  // Prefer the HTML-stripped body. The Airbnb plain body is tabular and
  // can't be parsed without a column-aware tokenizer.
  const html = extractHtmlBody(msg);
  const plain = extractPlainBody(msg);
  const body = html ? htmlToText(html) : plain;
  const emailYear = new Date(Number(msg.internalDate)).getUTCFullYear();

  let parsed: AirbnbConfirmation | AirbnbPayout | null = null;
  if (kind === "airbnb-confirmation") {
    parsed = parseAirbnbConfirmation(subject, body, emailYear);
  } else if (kind === "airbnb-payout") {
    parsed = parseAirbnbPayout(subject, body, receivedDate.slice(0, 10));
  }

  if (!parsed) {
    await appendImportLog({
      messageId: msg.id,
      emailSubject: subject,
      emailFrom: from,
      emailDate: receivedDate,
      kind,
      status: "parse-failed",
    });
    return { status: "parse-failed" };
  }

  // Listing classification — distinguish (a) maps to a HostPro AL,
  // (b) intentionally NOT a HostPro AL (e.g. brother's apartment that
  // also ends up in this inbox), (c) something new we haven't mapped yet.
  const classification = parsed.classification;
  if (classification?.kind === "ignored") {
    await appendImportLog({
      messageId: msg.id,
      emailSubject: subject,
      emailFrom: from,
      emailDate: receivedDate,
      kind,
      status: "ignored",
      parsed,
    });
    return { status: "ignored" };
  }

  const property = parsed.property ?? null;
  if (!property) {
    await appendImportLog({
      messageId: msg.id,
      emailSubject: subject,
      emailFrom: from,
      emailDate: receivedDate,
      kind,
      status: "unknown-listing",
      parsed,
    });
    return { status: "unknown-listing" };
  }

  // Dedupe against the historical CSV imports. We key by property +
  // stayWindow because that's the same shape produced both by the CSV
  // import scripts and by this parser.
  const stayWindowVal =
    "stayWindow" in parsed && parsed.stayWindow ? parsed.stayWindow : undefined;
  if (stayWindowVal && existingByKey.has(`${property}|${stayWindowVal}`)) {
    await appendImportLog({
      messageId: msg.id,
      emailSubject: subject,
      emailFrom: from,
      emailDate: receivedDate,
      kind,
      status: "skipped",
      parsed,
    });
    return { status: "skipped" };
  }

  // Dry-run for both confirmations and payouts until Andre flips IMPORT_LIVE.
  await appendImportLog({
    messageId: msg.id,
    emailSubject: subject,
    emailFrom: from,
    emailDate: receivedDate,
    kind,
    status: "dry-run",
    parsed,
  });
  return { status: "dry-run" };
}
