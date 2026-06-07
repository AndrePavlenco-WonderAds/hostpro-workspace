// One-off correction: Andre confirmed (2026-06-07) that the 26/05 €60,68
// "Aguas Maio Cash" line was for BOTH T2s, not SE2 alone. Split it.
//
// Replaces `cm-dsp-010` (€60,68 SE2) with two €30,34 entries: SE2 + SE5.
// Idempotent — if already split, exits without writing.

import { list, put, del } from "@vercel/blob";

const BLOB_PREFIX = "data/pnl";
const BLOB_BASENAME = "data/pnl.json";

const OLD_ID = "cm-dsp-010";
const SE2_ID = "cm-dsp-010a";
const SE5_ID = "cm-dsp-010b";

const SE2_ENTRY = {
  id: SE2_ID,
  property: "sweet-escape-2",
  date: "2026-05-26",
  kind: "despesa",
  amount: 30.34,
  description: "Águas Maio (cash, T2s)",
  person: "André",
  outOfAccount: true,
};

const SE5_ENTRY = {
  id: SE5_ID,
  property: "sweet-escape-5",
  date: "2026-05-26",
  kind: "despesa",
  amount: 30.34,
  description: "Águas Maio (cash, T2s)",
  person: "André",
  outOfAccount: true,
};

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN missing");
  }

  const { blobs } = await list({ prefix: BLOB_PREFIX });
  if (blobs.length === 0) throw new Error("Blob empty");
  const newest = blobs.reduce((a, b) =>
    new Date(a.uploadedAt).getTime() > new Date(b.uploadedAt).getTime() ? a : b,
  );
  const res = await fetch(newest.url, { cache: "no-store" });
  const entries = await res.json();

  const ids = new Set(entries.map((e) => e.id));
  const hasOld = ids.has(OLD_ID);
  const hasSplit = ids.has(SE2_ID) && ids.has(SE5_ID);

  if (!hasOld && hasSplit) {
    console.log("Already split — nothing to do.");
    return;
  }

  const without = entries.filter((e) => e.id !== OLD_ID);
  const merged = [...without, SE2_ENTRY, SE5_ENTRY];

  console.log(
    `Splitting ${OLD_ID} (€60,68 SE2) → ${SE2_ID} (€30,34 SE2) + ${SE5_ID} (€30,34 SE5)`,
  );
  console.log(`Entries: ${entries.length} → ${merged.length}`);

  await put(BLOB_BASENAME, JSON.stringify(merged), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: true,
    cacheControlMaxAge: 0,
  });

  try { await del(blobs.map((b) => b.url)); }
  catch (e) { console.warn("Garbage-collect failed (non-fatal):", e?.message); }

  console.log("Done.");
}

main().catch((err) => { console.error(err); process.exit(1); });
