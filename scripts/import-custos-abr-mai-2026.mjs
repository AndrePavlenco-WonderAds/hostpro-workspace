// One-off importer for the despesa + funcionário rows in Andre's
// Google Sheets May & April 2026 columns (the two screenshots sent on
// 2026-06-07). Same shape, same blob, same idempotent merge logic as
// `import-bookings-2026.mjs`.
//
// Run:
//   node --env-file=.env.local scripts/import-custos-abr-mai-2026.mjs
//
// Mapping rules applied (from Andre's instructions):
//   - When a row's `Descrição` says nothing about which AL → default SE2.
//   - "T2 2º e 5º" + €50 → split as €25 SE2 + €25 SE5.
//   - "t2 elbia 5º-8e11" + €50 → split as €25 SE5 on 08/04 + €25 SE5 on 11/04
//     (the description literally references both dates).
//   - "S.J.Estoril" (São João do Estoril) → One For One House — NOT SE2/SE5.
//     OFO cleaning rate is €35, the row matches.
//   - "Agua dos T2s" + €61.80 → split as €30.90 SE2 + €30.90 SE5.
//   - "Mãe" → person `Lilia`. "Mãe/Andre" → `André` (the books owner).
//   - `Out of Account` ✓ in the sheet → `outOfAccount: true` (paid outside
//     the business account — same convention as the OFO seed).

import { list, put, del } from "@vercel/blob";

const BLOB_PREFIX = "data/pnl";
const BLOB_BASENAME = "data/pnl.json";

// ---------- helpers ----------

function dsp(property, id, date, amount, description, person, outOfAccount) {
  return {
    id, property, date,
    kind: "despesa",
    amount, description, person, outOfAccount,
  };
}

function fnc(property, id, date, amount, description, person, pago, outOfAccount) {
  return {
    id, property, date,
    kind: "funcionario",
    amount, description, person, pago, outOfAccount,
  };
}

// ---------- APRIL 2026 — funcionário ----------

const APRIL_FNC = [
  // Row 7 — 06/04 €50 "Limpeza Elbia 2º - 2e5" → split between SE2 and SE5.
  fnc("sweet-escape-2", "cm-fnc-001", "2026-04-06", 25, "Limpeza (Elbia)", "Lilia", true, false),
  fnc("sweet-escape-5", "cm-fnc-002", "2026-04-06", 25, "Limpeza (Elbia)", "Lilia", true, false),
  // Row 12 — 11/04 €50 "t2 elbia 5º-8e11" → split: SE5 on 08/04 and 11/04.
  fnc("sweet-escape-5", "cm-fnc-003", "2026-04-08", 25, "Limpeza (Elbia)", "Lilia", true, false),
  fnc("sweet-escape-5", "cm-fnc-004", "2026-04-11", 25, "Limpeza (Elbia)", "Lilia", true, false),
  // Rows 19–21 — 18-20/04 Elbia daily (Descrição só "Elbia") → SE2 default.
  fnc("sweet-escape-2", "cm-fnc-005", "2026-04-18", 25, "Limpeza (Elbia)", "Lilia", true, true),
  fnc("sweet-escape-2", "cm-fnc-006", "2026-04-19", 25, "Limpeza (Elbia)", "Lilia", true, true),
  fnc("sweet-escape-2", "cm-fnc-007", "2026-04-20", 25, "Limpeza (Elbia)", "Lilia", true, true),
  // Row 24 — 23/04 €35 "S.J.Estoril" → OFO.
  fnc("one-for-one-house", "cm-fnc-008", "2026-04-23", 35, "Limpeza", "Lilia", true, true),
  // Rows 26-27 — 25-26/04 €25 "Lilia - 5º" → SE5 (Lilia herself cleaning).
  fnc("sweet-escape-5", "cm-fnc-009", "2026-04-25", 25, "Limpeza", "Lilia", true, true),
  fnc("sweet-escape-5", "cm-fnc-010", "2026-04-26", 25, "Limpeza", "Lilia", true, true),
];

// ---------- APRIL 2026 — despesa ----------

const APRIL_DSP = [
  // Row 10 — 09/04 €207.50 "Lavandaria" Mãe OOA ✓ → SE2 default.
  dsp("sweet-escape-2", "cm-dsp-001", "2026-04-09", 207.50, "Lavandaria", "Lilia", true),
  // Row 11 — 10/04 €32.68 "Compras Continente" Mãe → SE2 default.
  dsp("sweet-escape-2", "cm-dsp-002", "2026-04-10", 32.68, "Compras Continente", "Lilia", false),
  // Row 20 — 19/04 €30 "toalhas peq." Mãe → SE2 default.
  dsp("sweet-escape-2", "cm-dsp-003", "2026-04-19", 30.00, "Toalhas pequenas", "Lilia", false),
  // Row 27 — 26/04 €4.35 "Tinta" André → SE2 default.
  dsp("sweet-escape-2", "cm-dsp-004", "2026-04-26", 4.35, "Tinta", "André", false),
  // Row 31 — 30/04 €61.80 "Agua dos T2s" André OOA ✓ → split between SE2 and SE5.
  dsp("sweet-escape-2", "cm-dsp-005", "2026-04-30", 30.90, "Água Abril (T2s)", "André", true),
  dsp("sweet-escape-5", "cm-dsp-006", "2026-04-30", 30.90, "Água Abril (T2s)", "André", true),
];

// ---------- MAY 2026 — funcionário ----------

const MAY_FNC = [
  // Row 3 — 02/05 €50 "T2 2º e 5º" → split SE2 + SE5.
  fnc("sweet-escape-2", "cm-fnc-011", "2026-05-02", 25, "Limpeza", "Lilia", true, true),
  fnc("sweet-escape-5", "cm-fnc-012", "2026-05-02", 25, "Limpeza", "Lilia", true, true),
  // Row 8 — 07/05 €25 "T2 5º" → SE5.
  fnc("sweet-escape-5", "cm-fnc-013", "2026-05-07", 25, "Limpeza", "Lilia", true, true),
  // Row 9 — 08/05 €25 "T2 5º" → SE5.
  fnc("sweet-escape-5", "cm-fnc-014", "2026-05-08", 25, "Limpeza", "Lilia", true, true),
  // Row 10 — 09/05 €25 "T2 2º" — NÃO pago, NÃO OOA.
  fnc("sweet-escape-2", "cm-fnc-015", "2026-05-09", 25, "Limpeza", "Lilia", false, false),
  // Row 28 — 27/05 €50 "Limpeza 5º Elbia" Mãe/Andre Pago — SE5, person André, pago.
  fnc("sweet-escape-5", "cm-fnc-016", "2026-05-27", 50, "Limpeza (Elbia)", "André", true, false),
  // Row 29 — 28/05 €25 "Limpeza 5º Mãe" Mãe Pago — SE5.
  fnc("sweet-escape-5", "cm-fnc-017", "2026-05-28", 25, "Limpeza", "Lilia", true, false),
];

// ---------- MAY 2026 — despesa ----------

const MAY_DSP = [
  // Row 8 — 07/05 €5.50 "Chines" André — SE2 default.
  dsp("sweet-escape-2", "cm-dsp-007", "2026-05-07", 5.50, "Chinês", "André", false),
  // Row 10 — 09/05 €20 "Tecnico Internet" André — SE2 default.
  dsp("sweet-escape-2", "cm-dsp-008", "2026-05-09", 20.00, "Técnico Internet", "André", false),
  // Row 11 — 10/05 €71.43 "compras" Mãe OOA ✓ — SE2 default.
  dsp("sweet-escape-2", "cm-dsp-009", "2026-05-10", 71.43, "Compras", "Lilia", true),
  // Row 27 — 26/05 €60.68 "Aguas Maio Cash" André OOA ✓ → split entre T2s
  // (Andre confirmou 2026-06-07 que era para ambos, não só SE2).
  dsp("sweet-escape-2", "cm-dsp-010a", "2026-05-26", 30.34, "Águas Maio (cash, T2s)", "André", true),
  dsp("sweet-escape-5", "cm-dsp-010b", "2026-05-26", 30.34, "Águas Maio (cash, T2s)", "André", true),
];

const NEW_ENTRIES = [...APRIL_FNC, ...APRIL_DSP, ...MAY_FNC, ...MAY_DSP];

// ---------- blob I/O — same as import-bookings-2026.mjs ----------

async function readLatestBlob() {
  const { blobs } = await list({ prefix: BLOB_PREFIX });
  if (blobs.length === 0) return { entries: [], existing: [] };
  const newest = blobs.reduce((a, b) =>
    new Date(a.uploadedAt).getTime() > new Date(b.uploadedAt).getTime() ? a : b,
  );
  const res = await fetch(newest.url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Blob fetch failed: ${res.status}`);
  return { entries: await res.json(), existing: blobs };
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN missing — run with --env-file=.env.local");
  }

  const { entries: current, existing } = await readLatestBlob();
  const ids = new Set(current.map((e) => e.id));
  const toAdd = NEW_ENTRIES.filter((e) => !ids.has(e.id));

  if (toAdd.length === 0) {
    console.log(`Nothing to do — all ${NEW_ENTRIES.length} ids already present.`);
    return;
  }

  const merged = [...current, ...toAdd];
  console.log(`Adding ${toAdd.length} of ${NEW_ENTRIES.length} entries — ${current.length} → ${merged.length} total.`);

  await put(BLOB_BASENAME, JSON.stringify(merged), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: true,
    cacheControlMaxAge: 0,
  });

  if (existing.length > 0) {
    try { await del(existing.map((b) => b.url)); }
    catch (e) { console.warn("Garbage-collect failed (non-fatal):", e?.message); }
  }

  const byKey = new Map();
  for (const e of toAdd) {
    const k = `${e.property} · ${e.kind}`;
    byKey.set(k, (byKey.get(k) ?? 0) + 1);
  }
  for (const [k, n] of byKey) console.log(`  · ${k}: +${n}`);

  // Money summary for sanity-check.
  const byPropAmount = new Map();
  for (const e of toAdd) {
    byPropAmount.set(e.property, (byPropAmount.get(e.property) ?? 0) + e.amount);
  }
  console.log("Total custos imported:");
  for (const [k, v] of byPropAmount) console.log(`  · ${k}: ${v.toFixed(2)} €`);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
