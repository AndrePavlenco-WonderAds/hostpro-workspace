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
//
// v0.10.2 — Hobby plan operations budget (Blob `list`/`del` are "advanced"
// ops, the most expensive bucket). Mutations used to do 4 ops each:
//   readBlob (list+fetch) → writeBlob (list+put+del)
// The two `list()` calls return the same blobs (server-action mutations
// are serialized). We now do a single `list()` inside `readBlob` and pass
// the snapshot to `writeBlob`, dropping every mutation to 3 ops.
//
// v0.10.3 — reversed the v0.5.2 decision because the cost model changed
// (Hobby ops cap is small, page-load list() ops add up fast during dev).
// `getAllEntries` is now cached for 5 minutes with tag `hostpro-pnl`;
// every mutation in `pnl-actions.ts` calls `revalidateTag('hostpro-pnl')`
// AFTER the write, so read-your-own-writes work correctly. The cache is
// per-store-instance, so rapid page refreshes during a dev session
// collapse to a single Blob op instead of one per refresh.

import "server-only";
import { list, put, del, type ListBlobResult } from "@vercel/blob";
import { unstable_cache } from "next/cache";
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

type ExistingBlobs = ListBlobResult["blobs"];

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

async function readBlob(): Promise<{ entries: PnLEntry[]; existing: ExistingBlobs } | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const { blobs } = await list({ prefix: BLOB_PREFIX });
  if (blobs.length === 0) return null;
  // Pick the most recently uploaded — that's the source of truth.
  const newest = blobs.reduce((a, b) =>
    new Date(a.uploadedAt).getTime() > new Date(b.uploadedAt).getTime() ? a : b,
  );
  const res = await fetch(newest.url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Blob fetch failed: ${res.status}`);
  return { entries: (await res.json()) as PnLEntry[], existing: blobs };
}

async function writeBlob(entries: PnLEntry[], existing?: ExistingBlobs): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN missing — Vercel Blob não está ligado.");
  }
  // Snapshot existing blobs so we can delete them after the new write lands.
  // Mutations pass through the snapshot they already loaded via `readBlob`
  // so we don't do a redundant `list()` (v0.10.2). Standalone writers (e.g.
  // the first-time seed) still take the hit.
  const toGc = existing ?? (await list({ prefix: BLOB_PREFIX })).blobs;

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
  if (toGc.length > 0) {
    try {
      await del(toGc.map((b) => b.url));
    } catch {
      // best-effort
    }
  }
}

// ---------- reads ----------

// Internal — does the actual Blob read. Wrapped by `getAllEntries` below.
// Split out so the cache layer wraps only the pure read path: the
// "seed on first touch" write is a side effect that we DON'T want
// memoized (we want it to run exactly once on first store creation,
// not be skipped by a stale cache hit).
async function _readAllEntriesUncached(): Promise<PnLEntry[]> {
  const stored = await readBlob();
  if (stored) return stored.entries;
  // First time touching the store — seed it so all readers see the same
  // baseline going forward. No `existing` to pass through (the store is
  // empty), so writeBlob takes its own snapshot — once, ever.
  try {
    await writeBlob(SEED_ENTRIES);
  } catch {
    // No-token / build-time path: just return the seed in memory.
  }
  return SEED_ENTRIES;
}

// Cache key prefix is intentionally version-suffixed so a deploy that
// changes the entry shape invalidates the cache automatically (the prefix
// is part of the cache key — change it, you get a fresh entry).
// v0.10.4 bump: FuncionarioEntry gained `cleaningDate` — old cached
// reads wouldn't expose it.
export const getAllEntries = unstable_cache(
  _readAllEntriesUncached,
  ["hostpro-pnl-v2"],
  {
    tags: ["hostpro-pnl"],
    // 5-minute revalidation as the safety floor — even if a mutation
    // forgets to call revalidateTag (shouldn't happen, all paths in
    // pnl-actions.ts do), stale reads expire on their own.
    revalidate: 300,
  },
);

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
  const stored = await readBlob();
  const all = stored?.entries ?? [...SEED_ENTRIES];
  const id = input.id ?? nextId(all, input.kind);
  const entry = { ...input, id } as PnLEntry;
  await writeBlob([...all, entry], stored?.existing);
  return entry;
}

export async function deleteEntry(id: string): Promise<void> {
  const stored = await readBlob();
  const all = stored?.entries ?? [...SEED_ENTRIES];
  await writeBlob(all.filter((e) => e.id !== id), stored?.existing);
}

export async function updateEntry(
  id: string,
  patch: Partial<PnLEntry>,
): Promise<void> {
  const stored = await readBlob();
  const all = stored?.entries ?? [...SEED_ENTRIES];
  const next = all.map((e) =>
    e.id === id ? ({ ...e, ...patch } as PnLEntry) : e,
  );
  await writeBlob(next, stored?.existing);
}

export type { Person, PnLEntry, EntryKind };
