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
import { list, put } from "@vercel/blob";
import { SEED_ENTRIES } from "./pnl-seed";
import type { PropertySlug } from "./properties";
import type {
  PnLEntry,
  EntryKind,
  DespesaEntry,
  EntradaEntry,
  FuncionarioEntry,
  Person,
} from "./pnl-types";

const BLOB_PATH = "data/pnl.json";

// ---------- low-level Blob I/O ----------

async function readBlob(): Promise<PnLEntry[] | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const { blobs } = await list({ prefix: "data/" });
  const match = blobs.find((b) => b.pathname === BLOB_PATH);
  if (!match) return null;
  const res = await fetch(match.url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Blob fetch failed: ${res.status}`);
  return (await res.json()) as PnLEntry[];
}

async function writeBlob(entries: PnLEntry[]): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN missing — Vercel Blob não está ligado.");
  }
  await put(BLOB_PATH, JSON.stringify(entries), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
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
  | (Omit<FuncionarioEntry, "id"> & { id?: string });

function nextId(existing: PnLEntry[], kind: EntryKind): string {
  const prefix = kind === "entrada" ? "ent" : kind === "despesa" ? "exp" : "fnc";
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
