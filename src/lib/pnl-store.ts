// Vercel Blob-backed persistence for the P&L data.
//
// Storage shape: single JSON file `data/pnl.json` at the root of the Hobby
// Blob store (`hostpro-data`, public access — pathname is never exposed to
// the browser, only server actions know it). On first read we seed from
// SEED_ENTRIES (mirrors Andre's Google Sheet).
//
// v0.5.2 — dropped `unstable_cache` because mutations were sometimes
// taking a full request cycle to surface back. Blob reads are cheap (single
// HTTP fetch, same region as the function) so caching on top buys little
// for a single-user admin app and complicates read-your-own-writes.

import "server-only";
import { list, put, del } from "@vercel/blob";
import { SEED_ENTRIES } from "./pnl-seed";
import type { PropertySlug } from "./properties";
import type {
  PnLEntry,
  EntryKind,
  DespesaEntry,
  EntradaEntry,
  FuncionarioEntry,
  LavandariaEntry,
  Person,
} from "./pnl-types";

const BLOB_PREFIX = "data/pnl";
const BLOB_BASENAME = "data/pnl.json";

// ---------- low-level Blob I/O ----------
//
// Vercel Blob's public CDN serves every blob URL with a hard-coded 60-second
// cache (Cache-Control: max-age=60) that ignores query-string cache-busting
// AND request `Cache-Control: no-cache` headers — confirmed empirically on
// 2026-06-01. Setting `cacheControlMaxAge: 0` on `put` only affects the
// browser cache header, not the CDN.
//
// Workaround: every write goes to a NEW URL via `addRandomSuffix: true`.
// `list()` returns metadata via the authenticated API (no CDN cache), so we
// always pick the latest blob by `uploadedAt`. Old blobs are deleted after
// the write succeeds so the store doesn't grow.

async function readBlob(): Promise<PnLEntry[] | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const { blobs } = await list({ prefix: BLOB_PREFIX });
  if (blobs.length === 0) return null;
  // Pick the most recently uploaded — that's the source of truth.
  const newest = blobs.reduce((a, b) =>
    new Date(a.uploadedAt).getTime() > new Date(b.uploadedAt).getTime() ? a : b,
  );
  const res = await fetch(newest.url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Blob fetch failed: ${res.status}`);
  return (await res.json()) as PnLEntry[];
}

async function writeBlob(entries: PnLEntry[]): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN missing — Vercel Blob não está ligado.");
  }
  // Snapshot existing blobs so we can delete them after the new write lands.
  const { blobs: existing } = await list({ prefix: BLOB_PREFIX });

  // Write to a new randomly-suffixed URL — the CDN has never seen it, so
  // immediate reads return the new content.
  await put(BLOB_BASENAME, JSON.stringify(entries), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: true,
    cacheControlMaxAge: 0,
  });

  // Garbage-collect the old versions. Don't block the response on this — we
  // still want it to await so the next list() returns clean results, but if
  // del fails (transient network) we shouldn't fail the whole mutation.
  if (existing.length > 0) {
    try {
      await del(existing.map((b) => b.url));
    } catch {
      // best-effort
    }
  }
}

// ---------- reads ----------

export async function getAllEntries(): Promise<PnLEntry[]> {
  const stored = await readBlob();
  if (stored) return stored;
  // First time touching the store — seed it so all readers see the same
  // baseline going forward.
  try {
    await writeBlob(SEED_ENTRIES);
  } catch {
    // No-token / build-time path: just return the seed in memory.
  }
  return SEED_ENTRIES;
}

export async function getEntries(slug: PropertySlug): Promise<PnLEntry[]> {
  const all = await getAllEntries();
  return all.filter((e) => e.property === slug);
}

// ---------- mutations ----------

export type NewEntryInput =
  | (Omit<DespesaEntry, "id"> & { id?: string })
  | (Omit<EntradaEntry, "id"> & { id?: string })
  | (Omit<FuncionarioEntry, "id"> & { id?: string })
  | (Omit<LavandariaEntry, "id"> & { id?: string });

function nextId(existing: PnLEntry[], kind: EntryKind): string {
  const prefix =
    kind === "entrada"
      ? "ent"
      : kind === "despesa"
        ? "exp"
        : kind === "funcionario"
          ? "fnc"
          : "lvd";
  let max = 0;
  for (const e of existing) {
    const m = e.id.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export async function addEntry(input: NewEntryInput): Promise<PnLEntry> {
  const all = (await readBlob()) ?? [...SEED_ENTRIES];
  const id = input.id ?? nextId(all, input.kind);
  const entry = { ...input, id } as PnLEntry;
  await writeBlob([...all, entry]);
  return entry;
}

export async function deleteEntry(id: string): Promise<void> {
  const all = (await readBlob()) ?? [...SEED_ENTRIES];
  await writeBlob(all.filter((e) => e.id !== id));
}

/** Bulk delete by HM code — used by the cron when an Airbnb cancellation
 *  email is received. Returns the ids that were actually removed. */
export async function deleteEntriesByHmCodes(hmCodes: Iterable<string>): Promise<string[]> {
  const set = new Set(hmCodes);
  if (set.size === 0) return [];
  const all = (await readBlob()) ?? [...SEED_ENTRIES];
  const removed: string[] = [];
  const keep: PnLEntry[] = [];
  for (const e of all) {
    if (e.kind === "entrada" && e.hmCode && set.has(e.hmCode)) {
      removed.push(e.id);
      continue;
    }
    keep.push(e);
  }
  if (removed.length === 0) return [];
  await writeBlob(keep);
  return removed;
}

export async function updateEntry(
  id: string,
  patch: Partial<PnLEntry>,
): Promise<void> {
  const all = (await readBlob()) ?? [...SEED_ENTRIES];
  const next = all.map((e) =>
    e.id === id ? ({ ...e, ...patch } as PnLEntry) : e,
  );
  await writeBlob(next);
}

export type { Person, PnLEntry, EntryKind };
