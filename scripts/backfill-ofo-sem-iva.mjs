// Backfill OFO entradas: set noIva=true + iva=0 on EVERY entrada with
// property=one-for-one-house from 2026-01-01 onwards. Andre confirmed
// (2026-06-09) that all his cash entradas don't carry IVA.
//
// Idempotent — re-runnable safely; entries already in the right state
// are left untouched.
//
// Run:
//   node --env-file=.env.production.local scripts/backfill-ofo-sem-iva.mjs

import { list, put, del } from "@vercel/blob";

const BLOB_PREFIX = "data/pnl";
const BLOB_BASENAME = "data/pnl.json";

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN missing — pull env first");
  }

  const { blobs } = await list({ prefix: BLOB_PREFIX });
  if (blobs.length === 0) throw new Error("Blob empty");
  const newest = blobs.reduce((a, b) =>
    new Date(a.uploadedAt).getTime() > new Date(b.uploadedAt).getTime() ? a : b,
  );
  const res = await fetch(newest.url, { cache: "no-store" });
  const entries = await res.json();

  let touched = 0;
  let ivaCleared = 0;
  const updated = entries.map((e) => {
    if (
      e.property === "one-for-one-house" &&
      e.kind === "entrada" &&
      e.date >= "2026-01-01"
    ) {
      const before = { noIva: e.noIva, iva: e.iva };
      const after = { ...e, noIva: true, iva: 0 };
      if (before.noIva !== true || before.iva !== 0) {
        touched++;
        if (before.iva && before.iva > 0) ivaCleared += before.iva;
      }
      return after;
    }
    return e;
  });

  if (touched === 0) {
    console.log("Nada para fazer — todas as entradas OFO já estão noIva=true.");
    return;
  }

  console.log(`Patching ${touched} entradas OFO (noIva=true, iva=0).`);
  console.log(`Total IVA limpo: ${ivaCleared.toFixed(2)} €`);

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
