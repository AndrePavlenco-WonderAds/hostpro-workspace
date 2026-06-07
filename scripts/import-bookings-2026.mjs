// One-off importer for the SE5 + SE2 entradas extracted from
// Booking.com `2026-01-01_to_2026-06-07_statements*.csv` and Airbnb
// `airbnb_03_2026-06_2026*.csv` exports (see `/Users/andrepavlenco/Downloads/`).
//
// Run once:
//   cd hostpro-workspace
//   node --env-file=.env.local scripts/import-bookings-2026.mjs
//
// What it does:
//   - reads the latest `data/pnl*.json` blob via @vercel/blob `list()` + fetch
//   - merges in every new entry whose `id` is not already present
//   - writes the merged array back as a NEW blob (`addRandomSuffix: true`) so
//     the CDN's 60-second cache is bypassed, then deletes the previous blobs
//
// Idempotent: re-running it is a no-op once the ids exist in the store.

import { list, put, del } from "@vercel/blob";

const BLOB_PREFIX = "data/pnl";
const BLOB_BASENAME = "data/pnl.json";

// ---------- helpers ----------

/** Standard PT short-term-rental IVA = 6%. The seed convention treats the
 *  guest gross as the taxable base and adds 6% on top, rounded to cents. */
function iva6(amount) {
  return Math.round(amount * 0.06 * 100) / 100;
}

/** entrada — mirrors the `e()` helper in src/lib/pnl-seed.ts. All bookings
 *  imported here are already paid out, so recebido + noBanco = true and
 *  inIvaVault stays false (Andre flips it during the quarterly IVA push).
 *  Pass `hmCode` for Airbnb-sourced entries so the Gmail importer can
 *  dedupe by confirmation code. */
function entrada(property, id, date, amount, stayWindow, hmCode) {
  return {
    id,
    property,
    date,
    kind: "entrada",
    amount,
    iva: iva6(amount),
    stayWindow,
    description: stayWindow,
    person: "André",
    recebido: true,
    noBanco: true,
    inIvaVault: false,
    outOfAccount: false,
    ...(hmCode ? { hmCode } : {}),
  };
}

// ---------- SE5 — Sweet Escape · 5º ----------
//
// Booking.com — `2026-01-01_to_2026-06-07_statements.csv`
// Date = Payout date · Amount = guest gross · stay = "DD/MM-DD/MM"

const se5 = [
  // Booking.com
  entrada("sweet-escape-5", "se5-bk-001", "2026-04-20", 101.00, "18/04-19/04"),  // Alfredo Pazos Arjona
  entrada("sweet-escape-5", "se5-bk-002", "2026-04-20", 304.00, "13/04-17/04"),  // Ivo Soares
  entrada("sweet-escape-5", "se5-bk-003", "2026-04-24", 102.70, "22/04-23/04"),  // Ewa Marta Obrok
  entrada("sweet-escape-5", "se5-bk-004", "2026-04-30", 188.40, "27/04-29/04"),  // Amaro Jorge Silva
  entrada("sweet-escape-5", "se5-bk-005", "2026-05-04", 117.15, "01/05-02/05"),  // Sarah Emmerich
  entrada("sweet-escape-5", "se5-bk-006", "2026-05-11",  93.00, "07/05-08/05"),  // Hess Franz
  entrada("sweet-escape-5", "se5-bk-007", "2026-05-13", 143.00, "11/05-12/05"),  // Kritika Thakur
  entrada("sweet-escape-5", "se5-bk-008", "2026-05-25", 147.00, "23/05-24/05"),  // Elsa Moura
  entrada("sweet-escape-5", "se5-bk-009", "2026-05-28", 270.35, "25/05-27/05"),  // Nuno Gabriel Sarabando
  entrada("sweet-escape-5", "se5-bk-010", "2026-05-29", 143.00, "27/05-28/05"),  // Hess Franz
  entrada("sweet-escape-5", "se5-bk-011", "2026-06-04", 670.05, "28/05-03/06"),  // Adrian Botan

  // Airbnb — `airbnb_03_2026-06_2026.csv` (listing "2BR Estoril Apartment · Near Beach & Cascais")
  // Date = Date column (payout day) · Amount = Gross earnings · stay = "DD/MM-DD/MM"
  entrada("sweet-escape-5", "se5-ab-001", "2026-03-20", 210.00, "19/03-22/03", "HMJEBJB9KS"),  // Wei Wang
  entrada("sweet-escape-5", "se5-ab-002", "2026-06-06", 431.60, "05/06-08/06", "HMQ825SCC8"),  // Asal Ganji
];

// ---------- SE2 — Sweet Escape · 2º ----------
//
// Booking.com — `2026-01-01_to_2026-06-07_statements (1).csv`
// One row (Alejandra Refoyo, May 11 payout, Amount=0, Net=-9.40) is a
// post-stay commission correction and is intentionally skipped.

const se2 = [
  // Booking.com
  entrada("sweet-escape-2", "se2-bk-001", "2026-01-05",  558.00, "29/12-02/01"),  // Michael Haj
  entrada("sweet-escape-2", "se2-bk-002", "2026-01-08", 1213.00, "24/12-07/01"),  // Larysa Miller
  entrada("sweet-escape-2", "se2-bk-003", "2026-01-19",  166.00, "14/01-16/01"),  // Thais Santos
  entrada("sweet-escape-2", "se2-bk-004", "2026-02-09",  236.00, "03/02-06/02"),  // Jesús Sevilla Alonso
  entrada("sweet-escape-2", "se2-bk-005", "2026-02-25",  275.00, "21/02-24/02"),  // Marco Antonio Herling
  entrada("sweet-escape-2", "se2-bk-006", "2026-03-02",  458.00, "24/02-28/02"),  // Marco Antonio Herling
  entrada("sweet-escape-2", "se2-bk-007", "2026-03-23",  275.00, "13/03-16/03"),  // Andreynska Elena
  entrada("sweet-escape-2", "se2-bk-008", "2026-03-25",  400.00, "19/03-24/03"),  // Olena Shotova
  entrada("sweet-escape-2", "se2-bk-009", "2026-03-30",  174.80, "27/03-29/03"),  // Carlos Alberto Cirillo de Oliveira
  entrada("sweet-escape-2", "se2-bk-010", "2026-03-30",  182.80, "26/03-28/03"),  // Emerson Rancoletta
  entrada("sweet-escape-2", "se2-bk-011", "2026-03-30",  112.40, "26/03-27/03"),  // Marcel Pop
  entrada("sweet-escape-2", "se2-bk-012", "2026-04-03",  294.50, "30/03-02/04"),  // Vitor Araujo
  entrada("sweet-escape-2", "se2-bk-013", "2026-04-06",  353.60, "02/04-05/04"),  // gabriel conde
  entrada("sweet-escape-2", "se2-bk-014", "2026-04-09",  836.00, "31/03-08/04"),  // Jose Josildo De Medeiros
  entrada("sweet-escape-2", "se2-bk-015", "2026-04-13",  620.64, "05/04-12/04"),  // Joachim Pietsch
  entrada("sweet-escape-2", "se2-bk-016", "2026-04-13",  325.10, "08/04-11/04"),  // Jesse Frye
  entrada("sweet-escape-2", "se2-bk-017", "2026-04-20",  443.40, "14/04-18/04"),  // Milad Makdis Mouso
  entrada("sweet-escape-2", "se2-bk-018", "2026-04-24",  358.10, "19/04-23/04"),  // Cristina Dos Santos Paulo
  entrada("sweet-escape-2", "se2-bk-019", "2026-04-27",  745.00, "19/04-26/04"),  // Alejandra Refoyo Roldan
  entrada("sweet-escape-2", "se2-bk-020", "2026-05-11",  773.00, "02/05-09/05"),  // Ieva Melke
  entrada("sweet-escape-2", "se2-bk-021", "2026-05-11",  571.00, "02/05-07/05"),  // Peter Lejaeghere
  entrada("sweet-escape-2", "se2-bk-022", "2026-05-25",  458.00, "18/05-22/05"),  // ANDERSON MACHADO

  // Airbnb — `airbnb_03_2026-06_2026 (1).csv` (listing "2BR Apartment · Near Estoril Beach & Cascais")
  entrada("sweet-escape-2", "se2-ab-001", "2026-05-01", 230.00, "30/04-02/05", "HMZB5CCS8J"),  // Shannon McIntyre
  entrada("sweet-escape-2", "se2-ab-002", "2026-05-10", 350.00, "09/05-12/05", "HMD553RPMK"),  // Adriana Soares
  entrada("sweet-escape-2", "se2-ab-003", "2026-05-13", 823.00, "12/05-18/05", "HM4YAAJQRX"),  // Sara Caballero Álvarez
  entrada("sweet-escape-2", "se2-ab-004", "2026-05-28", 250.00, "27/05-29/05", "HMWCPXTWJQ"),  // Margaux Nicolle
  entrada("sweet-escape-2", "se2-ab-005", "2026-05-30", 379.00, "29/05-01/06", "HMXRBYPFKT"),  // Kay Lilley
  entrada("sweet-escape-2", "se2-ab-006", "2026-06-02", 366.00, "01/06-04/06", "HMDWJYJTDY"),  // John Elvis
  entrada("sweet-escape-2", "se2-ab-007", "2026-06-06", 261.00, "05/06-07/06", "HMHAZPKMAT"),  // Joana Neiva
];

const NEW_ENTRIES = [...se5, ...se2];

// ---------- blob I/O — same shape as src/lib/pnl-store.ts ----------

async function readLatestBlob() {
  const { blobs } = await list({ prefix: BLOB_PREFIX });
  if (blobs.length === 0) return { url: null, entries: [], existing: [] };
  const newest = blobs.reduce((a, b) =>
    new Date(a.uploadedAt).getTime() > new Date(b.uploadedAt).getTime() ? a : b,
  );
  const res = await fetch(newest.url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Blob fetch failed: ${res.status}`);
  const entries = await res.json();
  return { url: newest.url, entries, existing: blobs };
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
    try {
      await del(existing.map((b) => b.url));
    } catch (e) {
      console.warn("Garbage-collect of old blobs failed (non-fatal):", e?.message);
    }
  }

  // Per-property breakdown so the operator can sanity-check.
  const grouped = new Map();
  for (const e of toAdd) {
    const k = e.property;
    grouped.set(k, (grouped.get(k) ?? 0) + 1);
  }
  for (const [k, n] of grouped) console.log(`  · ${k}: +${n}`);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
