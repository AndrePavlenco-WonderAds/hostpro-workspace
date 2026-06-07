// Vercel Cron handler — runs every 30 minutes (see vercel.json).
//
// For each labelled-but-not-processed message in Gmail:
//   1. fetch full message
//   2. run the matching parser
//   3. (DRY-RUN MODE) only write to the import log; do NOT touch pnl blob
//   4. apply Gmail label `hostpro/processado` or `hostpro/falhou`
//
// Live mode kicks in once we set IMPORT_LIVE=true in the env. Until then the
// operator reviews everything in /admin/email-import-log and only flips the
// switch when the parsers are catching everything cleanly.

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
} from "@/lib/gmail/import-log";

const LABELS = {
  airbnbConf: "hostpro/airbnb-conf",
  airbnbPayout: "hostpro/airbnb-payout",
  processado: "hostpro/processado",
  falhou: "hostpro/falhou",
} as const;

/** Vercel sets `Authorization: Bearer <CRON_SECRET>` automatically when a
 *  Cron job invokes a route, provided we've defined CRON_SECRET in env.
 *  Reject anything else so the endpoint isn't a public Gmail importer. */
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

  const dryRun = process.env.IMPORT_LIVE !== "true";
  const gmail = new GmailClient(refreshToken);

  // Materialise the label ids we'll add/remove. Read-only call is fine if
  // the labels already exist; if not (Andre hasn't created the filters yet),
  // we still want to be able to mark messages processed afterwards.
  const processadoId = await gmail.ensureLabel(LABELS.processado);
  const falhouId = await gmail.ensureLabel(LABELS.falhou);

  const results = {
    scanned: 0,
    processed: 0,
    failed: 0,
    skipped: 0,
    dryRun,
  };

  for (const [labelName, kind] of [
    [LABELS.airbnbConf, "airbnb-confirmation"],
    [LABELS.airbnbPayout, "airbnb-payout"],
  ] as const) {
    const q = `label:${labelName} -label:${LABELS.processado} -label:${LABELS.falhou}`;
    const messages = await gmail.listMessages(q, 25);
    results.scanned += messages.length;

    for (const ref of messages) {
      try {
        // Belt-and-suspenders idempotency check.
        if (await hasMessageBeenLogged(ref.id)) {
          results.skipped++;
          await gmail.modifyMessage(ref.id, [processadoId], []);
          continue;
        }

        const msg = await gmail.getMessage(ref.id);
        const outcome = await processMessage(msg, kind, dryRun);
        if (outcome.status === "parse-failed") {
          await gmail.modifyMessage(ref.id, [falhouId], []);
          results.failed++;
        } else {
          await gmail.modifyMessage(ref.id, [processadoId], []);
          results.processed++;
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
): Promise<{ status: ImportLogEntry["status"] }> {
  const subject = getHeader(msg, "Subject") ?? "";
  const from = getHeader(msg, "From") ?? "";
  const receivedDate = new Date(Number(msg.internalDate)).toISOString();
  const html = extractHtmlBody(msg);
  const plain = extractPlainBody(msg) || htmlToText(html);

  let parsed: AirbnbConfirmation | AirbnbPayout | null = null;
  if (kind === "airbnb-confirmation") {
    parsed = parseAirbnbConfirmation(subject, plain);
  } else if (kind === "airbnb-payout") {
    parsed = parseAirbnbPayout(subject, plain, receivedDate.slice(0, 10));
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

  // Listing recognition — separate failure mode so Andre can fix the
  // listing-map without re-running the parser.
  const property =
    "property" in parsed && parsed.property ? parsed.property : null;
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

  if (dryRun) {
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

  // TODO (live mode): wire `parsed` into pnl-store via addEntry/updateEntry.
  // We deliberately leave this for a follow-up — after Andre has validated
  // ~10 dry-run rows in /admin/email-import-log, the logic to upsert into
  // the pnl blob is a 30-line change.
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
