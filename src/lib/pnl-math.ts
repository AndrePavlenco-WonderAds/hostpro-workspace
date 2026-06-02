// Aggregations and dashboard metrics over the P&L entries.
// Pure functions — same input always returns the same output.

import type { PnLEntry, EntradaEntry } from "./pnl-types";
import type { MonthKey } from "./dates";
import { monthLabelShort } from "./dates";

export type MonthlyTotals = {
  revenue: number;       // sum of entrada.amount
  expenses: number;      // sum of despesa.amount
  employees: number;     // sum of funcionario.amount
  iva: number;           // sum of entrada.iva
  totalExpenses: number; // expenses + employees + iva
  profit: number;        // revenue - totalExpenses
  entryCount: number;
};

const EMPTY: MonthlyTotals = {
  revenue: 0,
  expenses: 0,
  employees: 0,
  iva: 0,
  totalExpenses: 0,
  profit: 0,
  entryCount: 0,
};

export function monthOf(entry: PnLEntry): MonthKey {
  return entry.date.slice(0, 7) as MonthKey;
}

export function filterMonth(entries: PnLEntry[], key: MonthKey): PnLEntry[] {
  return entries.filter((e) => monthOf(e) === key);
}

export function aggregate(entries: PnLEntry[]): MonthlyTotals {
  let revenue = 0, expenses = 0, employees = 0, iva = 0;
  for (const e of entries) {
    if (e.kind === "entrada") {
      revenue += e.amount;
      iva += e.iva;
    } else if (e.kind === "despesa") {
      expenses += e.amount;
    } else if (e.kind === "funcionario") {
      employees += e.amount;
    }
  }
  const totalExpenses = expenses + employees + iva;
  return {
    revenue,
    expenses,
    employees,
    iva,
    totalExpenses,
    profit: revenue - totalExpenses,
    entryCount: entries.length,
  };
}

export function aggregateMonth(
  entries: PnLEntry[],
  key: MonthKey,
): MonthlyTotals {
  return aggregate(filterMonth(entries, key));
}

/** Sorted descending by month key. Returns every month that has at least one
 *  entry, plus an empty record for the current month if missing — so the
 *  picker always lets you land on "this month". */
export function listMonths(entries: PnLEntry[], pad: MonthKey[] = []): MonthKey[] {
  const set = new Set<MonthKey>(pad);
  for (const e of entries) set.add(monthOf(e));
  return [...set].sort((a, b) => (a < b ? 1 : -1));
}

export function monthlyBreakdown(entries: PnLEntry[]): Array<{
  key: MonthKey;
  label: string;
  totals: MonthlyTotals;
}> {
  const byMonth = new Map<MonthKey, PnLEntry[]>();
  for (const e of entries) {
    const k = monthOf(e);
    const arr = byMonth.get(k) ?? [];
    arr.push(e);
    byMonth.set(k, arr);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, list]) => ({
      key,
      label: monthLabelShort(key),
      totals: aggregate(list),
    }));
}

// ---------- dashboard records ----------

export type RecordPick<T extends PnLEntry> = { value: T; entry: T } | null;

export function biggestEntrada(entries: PnLEntry[]): RecordPick<EntradaEntry> | null {
  let best: EntradaEntry | null = null;
  for (const e of entries) {
    if (e.kind !== "entrada") continue;
    if (!best || e.amount > best.amount) best = e;
  }
  return best ? { value: best, entry: best } : null;
}

export function biggestDespesa(entries: PnLEntry[]): { entry: PnLEntry } | null {
  let best: (PnLEntry & { amount: number }) | null = null;
  for (const e of entries) {
    if (e.kind !== "despesa" && e.kind !== "funcionario") continue;
    if (!best || e.amount > best.amount) best = e;
  }
  return best ? { entry: best } : null;
}

/** Total de quilos de roupa lavada num conjunto de entradas. */
export function totalLavandariaKg(entries: PnLEntry[]): number {
  let total = 0;
  for (const e of entries) {
    if (e.kind === "lavandaria") total += e.weightKg;
  }
  return total;
}

export function bestMonth(entries: PnLEntry[]): {
  key: MonthKey;
  totals: MonthlyTotals;
} | null {
  const list = monthlyBreakdown(entries);
  if (list.length === 0) return null;
  return list.reduce((best, cur) =>
    cur.totals.profit > best.totals.profit ? cur : best,
  );
}

export function emptyTotals(): MonthlyTotals {
  return { ...EMPTY };
}
