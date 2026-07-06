import "server-only";
import { list, put, del, type ListBlobResult } from "@vercel/blob";
import { unstable_cache } from "next/cache";
import { randomUUID } from "node:crypto";
import type { Prospect } from "./types";

// Blob store para os prospects (auditorias de listings). Mesmo padrão
// ops-safe do pnl-store: uma única `list()` partilhada entre leitura e
// escrita, escrita para URL random-suffixed, GC do anterior.

const BLOB_PREFIX = "data/prospects";
const BLOB_BASENAME = "data/prospects.json";

type ExistingBlobs = ListBlobResult["blobs"];

async function readBlob(): Promise<{ items: Prospect[]; existing: ExistingBlobs } | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const { blobs } = await list({ prefix: BLOB_PREFIX });
  if (blobs.length === 0) return null;
  const newest = blobs.reduce((a, b) =>
    new Date(a.uploadedAt).getTime() > new Date(b.uploadedAt).getTime() ? a : b,
  );
  const res = await fetch(newest.url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Blob fetch failed: ${res.status}`);
  return { items: (await res.json()) as Prospect[], existing: blobs };
}

async function writeBlob(items: Prospect[], existing?: ExistingBlobs): Promise<void> {
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
      // best-effort
    }
  }
}

async function _readAllUncached(): Promise<Prospect[]> {
  const stored = await readBlob();
  return stored?.items ?? [];
}

export const getAllProspects = unstable_cache(_readAllUncached, ["hostpro-prospects-v1"], {
  tags: ["hostpro-prospects"],
  revalidate: 300,
});

export async function getProspect(id: string): Promise<Prospect | undefined> {
  return (await getAllProspects()).find((p) => p.id === id);
}

export async function getProspectByToken(token: string): Promise<Prospect | undefined> {
  return (await getAllProspects()).find((p) => p.publicToken === token);
}

export function newProspectIds(): { id: string; publicToken: string } {
  // id curto para o URL interno; token longo e não-adivinhável para o público.
  return { id: randomUUID().slice(0, 8), publicToken: randomUUID().replace(/-/g, "") };
}

export async function addProspect(prospect: Prospect): Promise<Prospect> {
  const stored = await readBlob();
  const all = stored?.items ?? [];
  await writeBlob([prospect, ...all], stored?.existing);
  return prospect;
}

export async function updateProspect(
  id: string,
  patch: Partial<Prospect>,
): Promise<void> {
  const stored = await readBlob();
  const all = stored?.items ?? [];
  await writeBlob(
    all.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    stored?.existing,
  );
}

export async function deleteProspect(id: string): Promise<void> {
  const stored = await readBlob();
  const all = stored?.items ?? [];
  await writeBlob(all.filter((p) => p.id !== id), stored?.existing);
}
