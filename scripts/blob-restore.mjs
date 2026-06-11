// One-shot restore: take local JSON snapshots saved at ./backup/*.json
// and `put` them into the currently-configured Blob store. Use this when
// migrating to a fresh store after hitting the Hobby ops cap (see the
// 2026-06-11 incident in CHANGELOG v0.10.2).
//
// Requires BLOB_READ_WRITE_TOKEN to point at the *NEW* store (run
// `vercel env pull .env.production.local` after connecting the new store
// to the project, or paste the token manually).
//
// Run:
//   node --env-file=.env.production.local scripts/blob-restore.mjs
//
// The script is idempotent — re-running it just creates new versions
// and garbage-collects the previous ones.

import { list, put, del } from "@vercel/blob";
import { readFile, access } from "node:fs/promises";
import { constants } from "node:fs";

const TARGETS = [
  {
    backup: "./backup/pnl.json",
    prefix: "data/pnl",
    basename: "data/pnl.json",
    label: "P&L entries",
  },
  {
    backup: "./backup/gmail-import-log.json",
    prefix: "data/gmail-import-log",
    basename: "data/gmail-import-log.json",
    label: "Gmail import log",
  },
];

async function fileExists(p) {
  try { await access(p, constants.R_OK); return true; }
  catch { return false; }
}

async function restoreOne({ backup, prefix, basename, label }) {
  if (!(await fileExists(backup))) {
    console.log(`⏭  ${label}: ${backup} not found — skipping.`);
    return;
  }
  const raw = await readFile(backup, "utf-8");
  // Sanity-check the file is JSON so we don't upload garbage.
  const parsed = JSON.parse(raw);
  const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
  console.log(`📦 ${label}: ${count} records from ${backup} → ${basename}`);

  // GC any existing blob at this prefix BEFORE the new write — we want
  // a clean state. (On a freshly-created store the list returns empty.)
  const { blobs: existing } = await list({ prefix });
  if (existing.length > 0) {
    console.log(`   cleaning ${existing.length} existing blob(s) at ${prefix}…`);
    try { await del(existing.map((b) => b.url)); }
    catch (e) { console.warn(`   GC failed (non-fatal): ${e?.message}`); }
  }

  await put(basename, raw, {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: true,
    cacheControlMaxAge: 0,
  });
  console.log(`   ✅ uploaded.`);
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN missing — pull env first or paste it inline.");
  }
  // Belt-and-suspenders: print the store id prefix so we don't accidentally
  // restore into the OLD locked store. Token format is
  // `vercel_blob_rw_<storeId>_<secret>` — we just log the storeId.
  const storeId = process.env.BLOB_READ_WRITE_TOKEN.split("_")[3] ?? "?";
  console.log(`Restoring into Blob store: ${storeId}`);
  console.log("");

  for (const target of TARGETS) {
    await restoreOne(target);
    console.log("");
  }
  console.log("Done.");
}

main().catch((err) => { console.error(err); process.exit(1); });
