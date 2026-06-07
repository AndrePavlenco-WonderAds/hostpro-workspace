// Audit log for every email the cron tries to process. Stored in its own
// blob (`data/gmail-import-log.json`) so the pnl blob stays focused. Append
// + truncate to the last `LOG_LIMIT` entries — admin UI shows newest first.

import "server-only";
import { list, put, del } from "@vercel/blob";

const PREFIX = "data/gmail-import-log";
const BASENAME = "data/gmail-import-log.json";
const LOG_LIMIT = 500;

export type ImportLogStatus =
  | "dry-run"         // parsed OK, but write to pnl blob skipped (initial mode)
  | "created"         // new pnl entry written
  | "updated"         // existing pnl entry patched (e.g. payout flipped recebido=true)
  | "skipped"         // dedupe: already in pnl by property+stayWindow
  | "ignored"         // listing is intentionally not a HostPro AL (e.g. brother's apartment)
  | "unknown-listing" // parsed OK but listing didn't match any known mapping
  | "parse-failed"    // regex didn't match — likely template drift
  | "error";          // unexpected exception

export type ImportLogEntry = {
  id: string;             // uuid
  ts: string;             // ISO timestamp
  messageId: string;      // Gmail message id
  emailSubject: string;
  emailFrom: string;
  emailDate: string;      // ISO — Gmail's internalDate
  kind: "airbnb-confirmation" | "airbnb-payout" | "booking-confirmation" | "booking-statement" | "unknown";
  status: ImportLogStatus;
  parsed?: unknown;       // structured parser output
  pnlEntryId?: string;    // when status is created/updated
  error?: string;         // message
};

async function readLatest(): Promise<{ entries: ImportLogEntry[]; existing: { url: string }[] }> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { entries: [], existing: [] };
  const { blobs } = await list({ prefix: PREFIX });
  if (blobs.length === 0) return { entries: [], existing: [] };
  const newest = blobs.reduce((a, b) =>
    new Date(a.uploadedAt).getTime() > new Date(b.uploadedAt).getTime() ? a : b,
  );
  const res = await fetch(newest.url, { cache: "no-store" });
  if (!res.ok) return { entries: [], existing: blobs };
  const entries = (await res.json()) as ImportLogEntry[];
  return { entries, existing: blobs };
}

async function writeBlob(entries: ImportLogEntry[]): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN missing");
  }
  const { blobs: existing } = await list({ prefix: PREFIX });
  await put(BASENAME, JSON.stringify(entries), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: true,
    cacheControlMaxAge: 0,
  });
  if (existing.length > 0) {
    try { await del(existing.map((b) => b.url)); } catch { /* best-effort */ }
  }
}

export async function readImportLog(limit = 100): Promise<ImportLogEntry[]> {
  const { entries } = await readLatest();
  // Most-recent first.
  return [...entries].reverse().slice(0, limit);
}

export async function appendImportLog(entry: Omit<ImportLogEntry, "id" | "ts"> & { ts?: string }): Promise<void> {
  const full: ImportLogEntry = {
    id: crypto.randomUUID(),
    ts: entry.ts ?? new Date().toISOString(),
    ...entry,
  };
  const { entries } = await readLatest();
  // One row per Gmail message — re-parsing the same email (e.g. via the
  // "Retry todos" button after a parser deploy) REPLACES the prior log
  // entry instead of stacking. Without this, repeated retries inflate the
  // log so the stat tiles bounce between refreshes.
  const filtered = entries.filter((e) => e.messageId !== full.messageId);
  const next = [...filtered, full];
  const trimmed = next.length > LOG_LIMIT ? next.slice(next.length - LOG_LIMIT) : next;
  await writeBlob(trimmed);
}

/** True when the cron has already processed this Gmail message in any
 *  status — used as an extra guard before the Gmail label kicks in. */
export async function hasMessageBeenLogged(messageId: string): Promise<boolean> {
  const { entries } = await readLatest();
  return entries.some((e) => e.messageId === messageId);
}
