// One-off — Andre's existing OFO entry ent-002 (Karen Lodder, host_payout
// €709,41) was created manually with stayWindow "6/06-10/06" (no leading
// zero) and without hmCode, so neither dedupe path in the Gmail cron
// caught it. Backfill: add hmCode = HMNZZJF543 and normalize stayWindow.
// Also normalize ent-001 (date format only).

import { list, put, del } from "@vercel/blob";

const BLOB_PREFIX = "data/pnl";
const BLOB_BASENAME = "data/pnl.json";

function normalizeStayWindow(w) {
  if (!w) return w;
  const m = w.match(/^(\d{1,2})\/(\d{1,2})-(\d{1,2})\/(\d{1,2})$/);
  if (!m) return w;
  const [, d1, mo1, d2, mo2] = m;
  return `${d1.padStart(2, "0")}/${mo1.padStart(2, "0")}-${d2.padStart(2, "0")}/${mo2.padStart(2, "0")}`;
}

async function main() {
  const { blobs } = await list({ prefix: BLOB_PREFIX });
  const newest = blobs.reduce((a, b) =>
    new Date(a.uploadedAt).getTime() > new Date(b.uploadedAt).getTime() ? a : b,
  );
  const res = await fetch(newest.url, { cache: "no-store" });
  const entries = await res.json();

  let changed = 0;
  const updated = entries.map((e) => {
    let patch = {};
    if (e.id === "ent-002" && !e.hmCode) {
      patch.hmCode = "HMNZZJF543"; // Karen Lodder
    }
    if (e.stayWindow) {
      const norm = normalizeStayWindow(e.stayWindow);
      if (norm !== e.stayWindow) patch.stayWindow = norm;
    }
    if (Object.keys(patch).length > 0) {
      changed++;
      return { ...e, ...patch };
    }
    return e;
  });

  if (changed === 0) {
    console.log("Nothing to fix.");
    return;
  }
  console.log(`Updating ${changed} entries.`);
  await put(BLOB_BASENAME, JSON.stringify(updated), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: true,
    cacheControlMaxAge: 0,
  });
  try { await del(blobs.map((b) => b.url)); }
  catch (e) { console.warn("GC failed:", e?.message); }
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
