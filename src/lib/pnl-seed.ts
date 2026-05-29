// Seed data — every PnL entry imported from Andre's Google Sheet on 2026-05-29.
// Lives separate from the store so the store stays focused on persistence
// concerns and we can re-seed cleanly if the Blob is ever emptied.

import type {
  PnLEntry,
  DespesaEntry,
  EntradaEntry,
  FuncionarioEntry,
} from "./pnl-types";
import type { PropertySlug } from "./properties";

// ---------- helpers — terse so the seed block below stays readable ----------

function d(
  property: PropertySlug,
  id: string,
  date: string,
  amount: number,
  description: string,
  person: "André" | "Carol" | "Alex",
  outOfAccount: boolean,
): DespesaEntry {
  return { id, date, amount, description, person, outOfAccount, kind: "despesa", property };
}

function f(
  property: PropertySlug,
  id: string,
  date: string,
  amount: number,
  description: string,
  person: "André" | "Carol" | "Alex",
  pago: boolean,
  outOfAccount: boolean,
): FuncionarioEntry {
  return { id, date, amount, description, person, pago, outOfAccount, kind: "funcionario", property };
}

function e(
  property: PropertySlug,
  id: string,
  date: string,
  amount: number,
  iva: number,
  stayWindow: string,
  person: "André" | "Carol" | "Alex",
  recebido: boolean,
  noBanco: boolean,
  inIvaVault: boolean,
): EntradaEntry {
  return {
    id, date, amount, iva, stayWindow, person,
    recebido, noBanco, inIvaVault,
    description: stayWindow,
    outOfAccount: false,
    kind: "entrada",
    property,
  };
}

// ---------- One For One House — Jan→Mai 2026, from the spreadsheet ----------

const oneForOne: PnLEntry[] = [
  d("one-for-one-house", "ofo-01", "2026-01-19", 9, "Revenue Est. Inv. (pricelabs)", "André", true),
  // February
  d("one-for-one-house", "ofo-02", "2026-02-06", 1000, "Renda One For One", "Carol", true),
  d("one-for-one-house", "ofo-03", "2026-02-06", 1975, "Renda One For One", "Alex", true),
  d("one-for-one-house", "ofo-04", "2026-02-07", 1975, "Renda One For One", "André", true),
  d("one-for-one-house", "ofo-05", "2026-02-08", 52.88, "Recheio", "André", true),
  d("one-for-one-house", "ofo-06", "2026-02-09", 21.68, "LeroyMerlin", "André", true),
  d("one-for-one-house", "ofo-07", "2026-02-10", 45.57, "Chinês", "André", true),
  d("one-for-one-house", "ofo-08", "2026-02-11", 21, "Shein", "Carol", true),
  d("one-for-one-house", "ofo-09", "2026-02-12", 7, "Chinês", "André", true),
  d("one-for-one-house", "ofo-10", "2026-02-13", 460.63, "IKEA", "André", true),
  d("one-for-one-house", "ofo-11", "2026-02-14", 30.09, "Makro", "André", true),
  d("one-for-one-house", "ofo-12", "2026-02-15", 10.24, "Chinês", "André", true),
  d("one-for-one-house", "ofo-13", "2026-02-16", 8.30, "Makro", "André", true),
  d("one-for-one-house", "ofo-14", "2026-02-17", 8.99, "IKEA", "André", true),
  d("one-for-one-house", "ofo-15", "2026-02-18", 3.53, "Pingo Doce", "Carol", true),
  d("one-for-one-house", "ofo-16", "2026-02-19", 34.90, "Chaves duplicadas", "André", true),
  d("one-for-one-house", "ofo-17", "2026-02-20", 54, "Toalhas", "André", true),
  d("one-for-one-house", "ofo-18", "2026-02-22", 8.99, "Chinês", "André", true),
  d("one-for-one-house", "ofo-19", "2026-02-23", 3.50, "Drogaria", "André", true),
  f("one-for-one-house", "ofo-20", "2026-02-15", 6.08, "Elbia — produtos de limpeza", "André", true, true),
  e("one-for-one-house", "ofo-21", "2026-02-08", 330, 19.80, "16/02-20/02", "André", true, true, false),
  e("one-for-one-house", "ofo-22", "2026-02-09", 330, 19.80, "23/02-27/02", "André", true, true, false),
  e("one-for-one-house", "ofo-23", "2026-02-10", 320, 19.20, "23/03-29/03", "André", true, true, false),
  // March
  d("one-for-one-house", "ofo-24", "2026-03-08", 5.15, "LeroyMerlin", "André", true),
  d("one-for-one-house", "ofo-25", "2026-03-18", 14.14, "Digi", "André", true),
  d("one-for-one-house", "ofo-26", "2026-03-19", 16.84, "Shein", "Carol", true),
  d("one-for-one-house", "ofo-27", "2026-03-22", 14.59, "Máquina café", "André", true),
  d("one-for-one-house", "ofo-28", "2026-03-31", 1650, "Renda", "André", true),
  f("one-for-one-house", "ofo-29", "2026-03-16", 35, "Limpeza", "André", true, true),
  f("one-for-one-house", "ofo-30", "2026-03-23", 35, "Limpeza", "André", true, true),
  f("one-for-one-house", "ofo-31", "2026-03-28", 15, "Limpeza", "André", true, true),
  e("one-for-one-house", "ofo-32", "2026-03-09", 340, 20.40, "02/03-06/03", "André", true, true, false),
  e("one-for-one-house", "ofo-33", "2026-03-10", 340, 20.40, "09/03-13/03", "André", true, true, false),
  e("one-for-one-house", "ofo-34", "2026-03-11", 340, 20.40, "16/03-20/03", "André", true, true, false),
  e("one-for-one-house", "ofo-35", "2026-03-12", 340, 20.40, "23/03-27/03", "André", true, true, false),
  e("one-for-one-house", "ofo-36", "2026-03-20", 360, 21.60, "30/03-03/04", "André", true, true, false),
  // April
  d("one-for-one-house", "ofo-37", "2026-04-09", 26.76, "Água Março", "André", true),
  d("one-for-one-house", "ofo-38", "2026-04-16", 16.57, "Pingo Doce", "André", true),
  d("one-for-one-house", "ofo-39", "2026-04-21", 22, "Digi Abril", "André", true),
  d("one-for-one-house", "ofo-40", "2026-04-22", 44.95, "Chinês", "André", true),
  d("one-for-one-house", "ofo-41", "2026-04-26", 5.54, "Recheio", "André", true),
  d("one-for-one-house", "ofo-42", "2026-04-27", 10, "Quadro", "André", true),
  d("one-for-one-house", "ofo-43", "2026-04-29", 9.28, "Posters", "André", true),
  d("one-for-one-house", "ofo-44", "2026-04-30", 153.82, "Máquina lavar", "André", true),
  d("one-for-one-house", "ofo-45", "2026-04-30", 1496.18, "Renda", "André", true),
  f("one-for-one-house", "ofo-46", "2026-04-10", 35, "Limpeza", "Carol", true, true),
  f("one-for-one-house", "ofo-47", "2026-04-11", 35, "Limpeza", "Carol", true, true),
  f("one-for-one-house", "ofo-48", "2026-04-12", 35, "Limpeza", "Carol", true, true),
  f("one-for-one-house", "ofo-49", "2026-04-15", 35, "Limpeza", "Carol", true, true),
  f("one-for-one-house", "ofo-50", "2026-04-20", 35, "Limpeza", "Carol", true, true),
  f("one-for-one-house", "ofo-51", "2026-04-24", 35, "Limpeza", "Carol", true, true),
  f("one-for-one-house", "ofo-52", "2026-04-27", 35, "Limpeza", "Carol", true, true),
  e("one-for-one-house", "ofo-53", "2026-04-04", 340, 20.40, "07/04-10/04", "André", true, true, false),
  e("one-for-one-house", "ofo-54", "2026-04-11", 59.05, 3.54, "10/04-11/04", "André", true, true, false),
  e("one-for-one-house", "ofo-55", "2026-04-12", 145.90, 8.75, "11/04-12/04", "André", true, true, false),
  e("one-for-one-house", "ofo-56", "2026-04-13", 381.11, 22.87, "12/04-15/04", "André", true, true, false),
  e("one-for-one-house", "ofo-57", "2026-04-19", 478.05, 28.68, "16/04-20/04", "André", true, true, false),
  e("one-for-one-house", "ofo-58", "2026-04-20", 453.41, 27.20, "20/04-24/04", "André", true, true, false),
  e("one-for-one-house", "ofo-59", "2026-04-27", 187.08, 11.22, "25/04-26/04", "André", true, true, false),
  // May
  d("one-for-one-house", "ofo-60", "2026-05-03", 38.08, "Água Abril", "André", true),
  d("one-for-one-house", "ofo-61", "2026-05-07", 16.35, "Renda — diferença", "André", true),
  d("one-for-one-house", "ofo-62", "2026-05-11", 12.07, "Pingo Doce", "André", true),
  d("one-for-one-house", "ofo-63", "2026-05-15", 2.76, "Uber Elbia", "André", true),
  d("one-for-one-house", "ofo-64", "2026-05-22", 28.30, "EDP Abril atraso", "André", true),
  d("one-for-one-house", "ofo-65", "2026-05-26", 51.90, "Registo AL", "André", true),
  d("one-for-one-house", "ofo-66", "2026-05-27", 43.21, "Água Maio", "André", true),
  d("one-for-one-house", "ofo-67", "2026-05-28", 22, "Digi Maio", "André", true),
  d("one-for-one-house", "ofo-68", "2026-05-29", 26.27, "EDP Abril atraso", "André", true),
  d("one-for-one-house", "ofo-69", "2026-05-30", 7.71, "Recheio", "André", true),
  f("one-for-one-house", "ofo-70", "2026-05-04", 35, "Limpeza", "Carol", true, true),
  f("one-for-one-house", "ofo-71", "2026-05-08", 35, "Limpeza", "Carol", true, true),
  f("one-for-one-house", "ofo-72", "2026-05-11", 35, "Limpeza", "Carol", true, true),
  f("one-for-one-house", "ofo-73", "2026-05-15", 32.24, "Limpeza", "Carol", true, true),
  f("one-for-one-house", "ofo-74", "2026-05-18", 35, "Limpeza", "Carol", true, true),
  e("one-for-one-house", "ofo-75", "2026-05-04", 384.64, 23.08, "01/05-04/05", "André", true, true, false),
  e("one-for-one-house", "ofo-76", "2026-05-11", 399.39, 23.96, "04/05-08/05", "André", true, true, false),
  e("one-for-one-house", "ofo-77", "2026-05-13", 323.21, 19.39, "08/05-11/05", "André", true, true, false),
  e("one-for-one-house", "ofo-78", "2026-05-16", 500, 30.00, "11/05-15/05", "André", true, true, false),
  e("one-for-one-house", "ofo-79", "2026-05-17", 297.29, 17.84, "16/05-18/05", "André", true, true, false),
  e("one-for-one-house", "ofo-80", "2026-05-21", 834.86, 50.09, "20/05-27/05", "André", true, true, false),
  e("one-for-one-house", "ofo-81", "2026-05-29", 601.31, 36.08, "28/05-01/06", "André", false, false, false),
];

export const SEED_ENTRIES: PnLEntry[] = [
  ...oneForOne,
  // Sweet Escape 2 — começa vazio. Adiciona a partir do app.
  // Sweet Escape 5 — começa vazio.
];
