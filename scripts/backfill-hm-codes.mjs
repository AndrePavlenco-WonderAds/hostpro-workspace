// Backfill the Airbnb HM confirmation code on the entradas imported from
// the SE2/SE5 Airbnb statement CSVs (see import-bookings-2026.mjs). With
// hmCode set, the Gmail import cron can dedupe confirmations/payouts
// without having to fall back on the stayWindow heuristic (which fails
// when guests extend their stay and the dates change).
//
// Idempotent — entries that already have hmCode are left alone.
//
// Run:
//   node --env-file=.env.production.local scripts/backfill-hm-codes.mjs

import { list, put, del } from "@vercel/blob";

const BLOB_PREFIX = "data/pnl";
const BLOB_BASENAME = "data/pnl.json";

// Mapping from the original CSV row order (see scripts/import-bookings-2026.mjs).
const HM_BY_ENTRY_ID = {
  // SE2 — file `airbnb_03_2026-06_2026 (1).csv`
  "se2-ab-001": "HMZB5CCS8J",  // Shannon McIntyre
  "se2-ab-002": "HMD553RPMK",  // Adriana Soares
  "se2-ab-003": "HM4YAAJQRX",  // Sara Caballero Álvarez
  "se2-ab-004": "HMWCPXTWJQ",  // Margaux Nicolle
  "se2-ab-005": "HMXRBYPFKT",  // Kay Lilley
  "se2-ab-006": "HMDWJYJTDY",  // John Elvis (the extended one)
  "se2-ab-007": "HMHAZPKMAT",  // Joana Neiva
  // SE5 — file `airbnb_03_2026-06_2026.csv`
  "se5-ab-001": "HMJEBJB9KS",  // Wei Wang
  "se5-ab-002": "HMQ825SCC8",  // Asal Ganji
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

  let changed = 0;
  const updated = entries.map((e) => {
    if (e.id in HM_BY_ENTRY_ID && !e.hmCode) {
      changed++;
      return { ...e, hmCode: HM_BY_ENTRY_ID[e.id] };
    }
    return e;
  });

  if (changed === 0) {
    console.log("Nothing to backfill — every target entry already has hmCode.");
    return;
  }

  console.log(`Backfilling hmCode on ${changed} entries.`);
  await put(BLOB_BASENAME, JSON.stringify(updated), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: true,
    cacheControlMaxAge: 0,
  });
  try { await del(blobs.map((b) => b.url)); }
  catch (e) { console.warn("GC failed (non-fatal):", e?.message); }
  console.log("Done.");
}

main().catch((err) => { console.error(err); process.exit(1); });
