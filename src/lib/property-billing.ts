// Address, default rates and banking info per property.
// Used by the /alojamentos/[slug]/reserva page to pre-fill the invoice form.
//
// 🔴 As moradas exactas da Sweet Escape 2 e 5 ainda não estão confirmadas —
// os placeholders abaixo precisam de ser substituídos quando o Andre mandar
// (são edifícios diferentes, ambos em Monte Estoril).

import type { PropertySlug } from "./properties";

export type PropertyBilling = {
  /** Multi-line address rendered right-aligned under "APARTAMENTO:". */
  addressLines: string[];
  /** Default nightly rate for the form (€). User can override per reserva. */
  defaultNightlyRate: number;
  /** Default cleaning fee in € — 0 means render the dash like the reference PDF. */
  defaultCleaningFee: number;
};

export const BILLING: Record<PropertySlug, PropertyBilling> = {
  "one-for-one-house": {
    addressLines: [
      "Rua Gil Vicente Nº141",
      "R/C B",
      "São João Do Estoril",
      "Cascais, Lisboa",
      "Portugal",
    ],
    defaultNightlyRate: 130,
    defaultCleaningFee: 0,
  },
  "sweet-escape-2": {
    addressLines: [
      "Avenida de Saboia [nº a confirmar]",
      "2º andar",
      "Monte Estoril",
      "Cascais, Lisboa",
      "Portugal",
    ],
    defaultNightlyRate: 100,
    defaultCleaningFee: 0,
  },
  "sweet-escape-5": {
    addressLines: [
      "Avenida de Saboia [nº a confirmar]",
      "5º andar",
      "Monte Estoril",
      "Cascais, Lisboa",
      "Portugal",
    ],
    defaultNightlyRate: 100,
    defaultCleaningFee: 0,
  },
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
