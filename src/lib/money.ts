// Single helper for EUR rendering — Portuguese style (1.234,56 €).
// All amounts in the store are kept as numbers (euros, can have decimals);
// this is the only file that knows how to display them.

const PT_EUR = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const PT_EUR_NO_DEC = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function eur(amount: number): string {
  return PT_EUR.format(amount);
}

export function eurCompact(amount: number): string {
  return Math.abs(amount) >= 1000
    ? PT_EUR_NO_DEC.format(amount)
    : PT_EUR.format(amount);
}

/** Signed delta, e.g. "+€120,00" or "-€45,30". */
export function eurDelta(amount: number): string {
  if (amount === 0) return "—";
  const formatted = eur(Math.abs(amount));
  return amount > 0 ? `+${formatted}` : `−${formatted}`;
}
