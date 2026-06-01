// DD/MM/YYYY everywhere (en-GB style) — per the user-wide rule.
// Months in the URL use `YYYY-MM` so they sort naturally.

export type MonthKey = `${number}-${string}`; // e.g. "2026-05"

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const MONTHS_PT_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

/** Build a MonthKey for the supplied year/month. month is 1-based. */
export function monthKey(year: number, month1to12: number): MonthKey {
  return `${year}-${String(month1to12).padStart(2, "0")}` as MonthKey;
}

/** Parse a MonthKey into [year, monthIndex0to11]. */
export function parseMonthKey(key: MonthKey): { year: number; month: number } {
  const [y, m] = key.split("-").map(Number);
  return { year: y, month: m - 1 };
}

export function monthKeyFromDate(d: Date): MonthKey {
  return monthKey(d.getUTCFullYear(), d.getUTCMonth() + 1);
}

export function currentMonthKey(): MonthKey {
  return monthKeyFromDate(new Date());
}

export function shiftMonth(key: MonthKey, delta: number): MonthKey {
  const { year, month } = parseMonthKey(key);
  const d = new Date(Date.UTC(year, month + delta, 1));
  return monthKey(d.getUTCFullYear(), d.getUTCMonth() + 1);
}

/** "Maio 2026" */
export function monthLabel(key: MonthKey): string {
  const { year, month } = parseMonthKey(key);
  return `${MONTHS_PT[month]} ${year}`;
}

/** "Mai 2026" */
export function monthLabelShort(key: MonthKey): string {
  const { year, month } = parseMonthKey(key);
  return `${MONTHS_PT_SHORT[month]} ${year}`;
}

/** "01/05/2026" given an ISO date string ("2026-05-01"). */
export function ddmmyyyy(iso: string): string {
  // Defensive: also handle "2026-05-01T00:00:00Z".
  const datePart = iso.slice(0, 10);
  const [y, m, d] = datePart.split("-");
  return `${d}/${m}/${y}`;
}

export function formatDateLong(iso: string): string {
  const datePart = iso.slice(0, 10);
  const [y, m, d] = datePart.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTHS_PT_SHORT[m - 1]} ${y}`;
}

/**
 * Suggested ISO date when adding an entry while viewing a specific month.
 * - Viewing current month → today
 * - Viewing past month → last day of that month
 * - Viewing future month → first day of that month
 */
export function defaultDateForMonth(monthKey: MonthKey): string {
  const { year, month } = parseMonthKey(monthKey);
  const today = new Date();
  const isCurrent =
    year === today.getUTCFullYear() && month === today.getUTCMonth();
  const isPast =
    year < today.getUTCFullYear() ||
    (year === today.getUTCFullYear() && month < today.getUTCMonth());

  let d: Date;
  if (isCurrent) {
    d = today;
  } else if (isPast) {
    // Last day of that month — Date(year, month + 1, 0) gives last day.
    d = new Date(Date.UTC(year, month + 1, 0));
  } else {
    d = new Date(Date.UTC(year, month, 1));
  }
  return d.toISOString().slice(0, 10);
}
