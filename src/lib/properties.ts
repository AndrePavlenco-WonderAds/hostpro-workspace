// The accommodations HostPro manages.
//
// v0.13.0 — properties moved from a compile-time constant to a Vercel
// Blob-backed store (`src/lib/properties-store.ts`) so Andre can add new
// alojamentos straight from the app. This file now only holds the shared
// TYPES and the SEED used on first store creation. Every reader goes through
// the store's async `getAllProperties()` / `getProperty()`.
//
// Because slugs are now user-generated, `PropertySlug` is a plain `string`
// alias — it stays as a named type so the P&L layer (pnl-types, pnl-store,
// pnl-actions, …) keeps reading intent-fully without a big rename.

export type PropertySlug = string;

export type Property = {
  slug: PropertySlug;
  name: string;
  location: string;          // e.g. "Monte Estoril"
  photo: string;             // path under /public OR a Vercel Blob URL
  /** Short label shown on cards / nav. */
  shortName: string;
  /** Longer description for the property detail page header. Cards don't
   *  render this — they're intentionally tight. */
  description: string;

  // ---- Billing / reserva defaults (merged in v0.13.0 from the old
  // `property-billing.ts` BILLING record so one edit updates everything). ----
  /** Multi-line address rendered right-aligned under "APARTAMENTO:" na reserva. */
  addressLines: string[];
  /** Default nightly rate for the reserva form (€). Overridable per reserva. */
  defaultNightlyRate: number;
  /** Default cleaning fee in € — 0 renders the dash like the reference PDF. */
  defaultCleaningFee: number;
  /** Standard payment to the cleaner per turn-over, in €. Pre-fills the
   *  *Nova limpeza* form on the property page (T2 ≈ 25€, T3 ≈ 35€). */
  defaultCleaningPaymentEur: number;
};

// Seed written to the Blob store the first time it's touched. Order here is
// the initial left-to-right order on the homepage; new ones append after.
export const SEED_PROPERTIES: Property[] = [
  {
    slug: "sweet-escape-2",
    shortName: "Sweet Escape 2",
    name: "Sweet Escape · 2º",
    location: "Monte Estoril",
    photo: "/properties/sweet-escape-2.jpg",
    description: "T2 reabilitado em Monte Estoril, perfeito para escapadinhas curtas.",
    addressLines: ["Rua do Viveiro 15", "2ºB", "2765-294 Estoril", "Portugal"],
    defaultNightlyRate: 100,
    defaultCleaningFee: 0,
    defaultCleaningPaymentEur: 25,
  },
  {
    slug: "sweet-escape-5",
    shortName: "Sweet Escape 5",
    name: "Sweet Escape · 5º",
    location: "Monte Estoril",
    photo: "/properties/sweet-escape-5.jpg",
    description: "T2 com terraço e vista sobre a serra, muita luz natural.",
    addressLines: ["Rua do Viveiro 15", "5ºD", "2765-294 Estoril", "Portugal"],
    defaultNightlyRate: 100,
    defaultCleaningFee: 0,
    defaultCleaningPaymentEur: 25,
  },
  {
    slug: "one-for-one-house",
    shortName: "One For One House",
    name: "One For One House",
    location: "São João do Estoril",
    photo: "/properties/one-for-one-house.jpg",
    description:
      "Apartamento grande premium de 3 quartos em São João do Estoril.",
    addressLines: [
      "Rua Gil Vicente Nº141",
      "R/C B",
      "São João Do Estoril",
      "Cascais, Lisboa",
      "Portugal",
    ],
    defaultNightlyRate: 130,
    defaultCleaningFee: 0,
    defaultCleaningPaymentEur: 35,
  },
];

/** Turn a free-text name into a URL-safe, ASCII slug. Shared by the store's
 *  create path and any caller that needs to predict a slug. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
