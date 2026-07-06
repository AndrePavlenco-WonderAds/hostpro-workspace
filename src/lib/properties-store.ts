// Vercel Blob-backed persistence for the list of alojamentos.
//
// Same design as `pnl-store.ts`: a single JSON file `data/properties.json`
// in the `hostpro-data` store, seeded from SEED_PROPERTIES on first touch,
// read through `unstable_cache` (tag `hostpro-properties`) and written to a
// fresh random-suffixed URL to dodge the Blob CDN's 60s cache. Reads reuse a
// single `list()` snapshot between readBlob→writeBlob so a mutation costs 3
// advanced ops, never more (the Hobby ops cap is the thing that bites — see
// the blob-ops memory).
//
// Uploaded photos live under their OWN prefix (`properties/uploads/…`) so the
// JSON garbage-collector never deletes an image.

import "server-only";
import { list, put, del, type ListBlobResult } from "@vercel/blob";
import { unstable_cache } from "next/cache";
import { SEED_PROPERTIES, slugify, type Property } from "./properties";

const BLOB_PREFIX = "data/properties";
const BLOB_BASENAME = "data/properties.json";
const UPLOAD_PREFIX = "properties/uploads";

type ExistingBlobs = ListBlobResult["blobs"];

// ---------- low-level Blob I/O ----------

async function readBlob(): Promise<{ items: Property[]; existing: ExistingBlobs } | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const { blobs } = await list({ prefix: BLOB_PREFIX });
  if (blobs.length === 0) return null;
  const newest = blobs.reduce((a, b) =>
    new Date(a.uploadedAt).getTime() > new Date(b.uploadedAt).getTime() ? a : b,
  );
  const res = await fetch(newest.url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Blob fetch failed: ${res.status}`);
  return { items: (await res.json()) as Property[], existing: blobs };
}

async function writeBlob(items: Property[], existing?: ExistingBlobs): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN missing — Vercel Blob não está ligado.");
  }
  const toGc = existing ?? (await list({ prefix: BLOB_PREFIX })).blobs;
  await put(BLOB_BASENAME, JSON.stringify(items), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: true,
    cacheControlMaxAge: 0,
  });
  if (toGc.length > 0) {
    try {
      await del(toGc.map((b) => b.url));
    } catch {
      // best-effort GC
    }
  }
}

// ---------- reads ----------

async function _readAllUncached(): Promise<Property[]> {
  const stored = await readBlob();
  if (stored) return stored.items;
  try {
    await writeBlob(SEED_PROPERTIES);
  } catch {
    // No-token / build-time path: return the seed in memory.
  }
  return SEED_PROPERTIES;
}

// Version-suffixed cache key so a shape change (new Property field) forces a
// fresh read after deploy. Bump the suffix when the Property type changes.
export const getAllProperties = unstable_cache(_readAllUncached, ["hostpro-properties-v1"], {
  tags: ["hostpro-properties"],
  revalidate: 300,
});

export async function getProperty(slug: string): Promise<Property | undefined> {
  const all = await getAllProperties();
  return all.find((p) => p.slug === slug);
}

// ---------- mutations ----------

export type NewPropertyInput = Omit<Property, "slug"> & { slug?: string };

// Slugs that would collide with sibling routes under /alojamentos/*.
const RESERVED_SLUGS = new Set(["novo"]);

/** Ensure the generated slug is unique against what's already stored AND
 *  doesn't shadow a real route (e.g. `/alojamentos/novo`, the create form). */
function uniqueSlug(base: string, taken: Set<string>): string {
  const root = base || "alojamento";
  if (!taken.has(root) && !RESERVED_SLUGS.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}

export async function addProperty(input: NewPropertyInput): Promise<Property> {
  const stored = await readBlob();
  const all = stored?.items ?? [...SEED_PROPERTIES];
  const taken = new Set(all.map((p) => p.slug));
  const slug = uniqueSlug(input.slug ? slugify(input.slug) : slugify(input.name), taken);
  const property: Property = { ...input, slug };
  await writeBlob([...all, property], stored?.existing);
  return property;
}

export async function updateProperty(
  slug: string,
  patch: Partial<Omit<Property, "slug">>,
): Promise<void> {
  const stored = await readBlob();
  const all = stored?.items ?? [...SEED_PROPERTIES];
  const next = all.map((p) => (p.slug === slug ? { ...p, ...patch } : p));
  await writeBlob(next, stored?.existing);
}

export async function deleteProperty(slug: string): Promise<void> {
  const stored = await readBlob();
  const all = stored?.items ?? [...SEED_PROPERTIES];
  await writeBlob(all.filter((p) => p.slug !== slug), stored?.existing);
}

/** Upload a property photo and return its public Blob URL. Own prefix so the
 *  JSON GC never touches it. Mirrors `uploadIdeaImage` in marketing-store. */
export async function uploadPropertyPhoto(file: File): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN missing — Vercel Blob não está ligado.");
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_") || "foto";
  const { url } = await put(`${UPLOAD_PREFIX}/${safeName}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type || "application/octet-stream",
  });
  return url;
}
