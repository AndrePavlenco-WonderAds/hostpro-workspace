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
  | "skipped"         // dedupe: already in pnl by hmCode or property+stayWindow
  | "cancelled"       // a "Canceled: Reservation HM…" email exists for this HM
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
  kind: "airbnb-confirmation" | "airbnb-payout" | "airbnb-cancellation" | "booking-confirmation" | "booking-statement" | "unknown";
  status: ImportLogStatus;
  parsed?: unknown;       // structured parser output
  pnlEntryId?: string;    // when status is created/updated/cancelled (deleted)
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
  await bulkAppendImportLog([entry]);
}

/** Batch version — single read + single write regardless of how many new
 *  entries are being recorded. The cron processes 30-45 emails per run; if
 *  each one did its own read-modify-write of the blob, the function timed
 *  out before finishing. With this, the whole run is one blob write. */
export async function bulkAppendImportLog(
  newOnes: Array<Omit<ImportLogEntry, "id" | "ts"> & { ts?: string }>,
): Promise<void> {
  if (newOnes.length === 0) return;
  const full: ImportLogEntry[] = newOnes.map((e) => ({
    id: crypto.randomUUID(),
    ts: e.ts ?? new Date().toISOString(),
    ...e,
  }));
  const { entries } = await readLatest();
  // Dedup by messageId — for each new entry, drop any older row that
  // matched the same Gmail message id. Then append the new rows.
  const newIds = new Set(full.map((e) => e.messageId));
  const filtered = entries.filter((e) => !newIds.has(e.messageId));
  const next = [...filtered, ...full];
  const trimmed = next.length > LOG_LIMIT ? next.slice(next.length - LOG_LIMIT) : next;
  await writeBlob(trimmed);
}

/** Read the full log once and return the set of Gmail messageIds seen so
 *  far — used by the cron to dedupe in-memory instead of doing one Blob
 *  `list()` per email reference. (The previous `hasMessageBeenLogged`
 *  helper was removed in v0.10.3 to prevent anyone re-introducing the
 *  per-email loop — that pattern was the single biggest contributor to
 *  the 2026-06-11 Hobby ops cap blowup: 40 emails × 2 label loops = 80
 *  `list()` ops per cron run. If you need a single-message check, build
 *  one Set from `getAllLoggedMessageIds()` and reuse it.) */
export async function getAllLoggedMessageIds(): Promise<Set<string>> {
  const { entries } = await readLatest();
  return new Set(entries.map((e) => e.messageId));
}
