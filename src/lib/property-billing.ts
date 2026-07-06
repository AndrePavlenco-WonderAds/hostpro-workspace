// Company-wide invoice constants + the per-property billing SHAPE.
//
// v0.13.0 — the per-property BILLING record moved into the property objects
// themselves (now stored in Vercel Blob via `properties-store.ts`) so a single
// edit updates address, rates and cleaning pay everywhere. Only the banking
// block and the tagline — which are the same across every reserva — stay here.

/** The billing fields the reserva form consumes. Property objects already
 *  satisfy this shape, so callers can pass a Property straight through. */
export type PropertyBilling = {
  /** Multi-line address rendered right-aligned under "APARTAMENTO:". */
  addressLines: string[];
  /** Default nightly rate for the form (€). User can override per reserva. */
  defaultNightlyRate: number;
  /** Default cleaning fee in € — 0 means render the dash like the reference PDF. */
  defaultCleaningFee: number;
  /** Standard payment to the cleaner per turn-over, in €. */
  defaultCleaningPaymentEur: number;
};

/** Banking info printed under DADOS BANCÁRIOS in every reserva. */
export const BANKING = {
  bank: "Banco Revolut UAB Sucursal Portugal",
  beneficiary: "André Pavlenco Garnytskyy",
  iban: "PT50 3560 0001 9001 8451 9089 8",
  swift: "REVOPTP2",
};

/** Sign-off tagline at the bottom of every invoice. */
export const TAGLINE = "With you all over Portugal";
