// Vercel Blob-backed persistence for the marketing content-idea board.
//
// Mirrors the storage discipline of `pnl-store.ts`:
//   • single JSON file `data/marketing.json` (random-suffixed on every write
//     to dodge the Blob CDN's 60s cache — `list()` reads metadata fresh).
//   • every mutation does ONE `list()` inside `readBlob` and passes the
//     snapshot to `writeBlob` so we never spend a redundant advanced op.
//     (Hobby ops cap lesson — see memory feedback-hostpro-blob-ops-budget.)
//   • uploaded images live under a SEPARATE prefix so the GC of the JSON
//     blob never touches them.

import "server-only";
import { list, put, del, type ListBlobResult } from "@vercel/blob";
import { unstable_cache } from "next/cache";
import type { ContentIdea } from "./marketing-types";

const BLOB_PREFIX = "data/marketing";
const BLOB_BASENAME = "data/marketing.json";
const UPLOAD_PREFIX = "marketing-uploads";

type ExistingBlobs = ListBlobResult["blobs"];

async function readBlob(): Promise<{ ideas: ContentIdea[]; existing: ExistingBlobs } | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const { blobs } = await list({ prefix: BLOB_PREFIX });
  if (blobs.length === 0) return null;
  const newest = blobs.reduce((a, b) =>
    new Date(a.uploadedAt).getTime() > new Date(b.uploadedAt).getTime() ? a : b,
  );
  const res = await fetch(newest.url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Blob fetch failed: ${res.status}`);
  return { ideas: (await res.json()) as ContentIdea[], existing: blobs };
}

async function writeBlob(ideas: ContentIdea[], existing?: ExistingBlobs): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN missing — Vercel Blob não está ligado.");
  }
  const toGc = existing ?? (await list({ prefix: BLOB_PREFIX })).blobs;
  await put(BLOB_BASENAME, JSON.stringify(ideas), {
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

async function _readAllUncached(): Promise<ContentIdea[]> {
  const stored = await readBlob();
  return stored?.ideas ?? [];
}

export const getAllIdeas = unstable_cache(_readAllUncached, ["hostpro-marketing-v1"], {
  tags: ["hostpro-marketing"],
  revalidate: 300,
});

// ---------- mutations ----------

function nextId(existing: ContentIdea[]): string {
  let max = 0;
  for (const i of existing) {
    const m = i.id.match(/^idea-(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `idea-${String(max + 1).padStart(3, "0")}`;
}

export async function addIdea(input: Omit<ContentIdea, "id">): Promise<ContentIdea> {
  const stored = await readBlob();
  const all = stored?.ideas ?? [];
  const idea: ContentIdea = { ...input, id: nextId(all) };
  await writeBlob([...all, idea], stored?.existing);
  return idea;
}

export async function updateIdea(id: string, patch: Partial<ContentIdea>): Promise<void> {
  const stored = await readBlob();
  const all = stored?.ideas ?? [];
  await writeBlob(
    all.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    stored?.existing,
  );
}

export async function deleteIdea(id: string): Promise<void> {
  const stored = await readBlob();
  const all = stored?.ideas ?? [];
  const removed = all.find((i) => i.id === id);
  await writeBlob(all.filter((i) => i.id !== id), stored?.existing);
  // Best-effort: drop the uploaded image too so the store doesn't leak blobs.
  if (removed?.imageUrl) {
    try {
      await del(removed.imageUrl);
    } catch {
      // best-effort
    }
  }
}

/** Upload an image for an idea and return its public Blob URL. Kept separate
 *  from the JSON store (own prefix) so JSON GC never deletes images. */
export async function uploadIdeaImage(file: File): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN missing — Vercel Blob não está ligado.");
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_") || "imagem";
  const { url } = await put(`${UPLOAD_PREFIX}/${safeName}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type || "application/octet-stream",
  });
  return url;
}
