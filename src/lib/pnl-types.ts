// P&L data model — mirrors Andre's existing Google Sheets columns, normalised
// into three entry kinds. Every entry belongs to ONE property and ONE day.
//
// `date` is stored as ISO YYYY-MM-DD so it sorts naturally. The MonthKey for
// a given entry is `date.slice(0, 7)`.

import type { PropertySlug } from "./properties";

export type Person = "André" | "Carol" | "Alex" | "Lilia";
export const PEOPLE: Person[] = ["André", "Carol", "Alex", "Lilia"];

export type EntryKind = "entrada" | "despesa" | "funcionario" | "lavandaria";

interface BaseEntry {
  id: string;
  property: PropertySlug;
  date: string;         // ISO YYYY-MM-DD
  kind: EntryKind;
  amount: number;       // euros
  description: string;
  person: Person;
  /** True when the money moved through someone's personal account, not the
   *  business bank. Mirrors the spreadsheet's `Out of Account` toggle. */
  outOfAccount: boolean;
}

export interface DespesaEntry extends BaseEntry {
  kind: "despesa";
}

export interface FuncionarioEntry extends BaseEntry {
  kind: "funcionario";
  /** True when the staff member was already paid. */
  pago: boolean;
  /** Date of the actual cleaning this payment corresponds to (ISO
   *  YYYY-MM-DD). `date` on the BaseEntry is the payment date. v0.10.4 —
   *  optional for backwards compat with entries created before the
   *  field existed; UI falls back to `date` when missing so older rows
   *  still render. New entries are required to set it. */
  cleaningDate?: string;
}

export interface EntradaEntry extends BaseEntry {
  kind: "entrada";
  /** Valor que o hóspede paga (bruto). É `amount` na BaseEntry — mantido
   *  como referência e mostrado na tabela, mas NÃO é a base dos Ganhos. */
  /** Valor efectivamente recebido na conta (líquido de comissões Airbnb,
   *  taxas, etc.). É ESTE o valor que entra nos Ganhos / Lucro. Opcional
   *  para retrocompat: entradas sem o campo preenchido contam como 0 nos
   *  Ganhos (decisão do Andre — preencher manualmente cada entrada). */
  valorRecebido?: number;
  /** Stay window like "16/02-20/02" — kept verbatim for now. */
  stayWindow?: string;
  /** IVA charged on the booking (6 % short-term rental in PT). Forced to
   *  0 when `noIva` is true so the monthly aggregation can stay naive. */
  iva: number;
  /** When true, the entrada doesn't carry IVA — e.g. directas / under-
   *  threshold guest payments, or stays for which Andre absorbed the IVA.
   *  Aggregations treat `iva` as 0, and the UI marks the row "sem IVA". */
  noIva?: boolean;
  recebido: boolean;
  noBanco: boolean;
  inIvaVault: boolean;
}

/** Lavandaria — quilos de roupa que a lavandaria leva.
 *  Não tem pessoa, conta, nem valor em euros — apenas data e peso. */
export interface LavandariaEntry {
  id: string;
  property: PropertySlug;
  date: string;          // ISO YYYY-MM-DD
  kind: "lavandaria";
  weightKg: number;      // peso de roupa em kg
  description: "Lavandaria";
}

export type PnLEntry =
  | DespesaEntry
  | FuncionarioEntry
  | EntradaEntry
  | LavandariaEntry;
