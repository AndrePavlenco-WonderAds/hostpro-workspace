import type { MonthlyTotals } from "@/lib/pnl-math";
import { eur, eurDelta } from "@/lib/money";

export function OverviewTiles({
  totals,
  previous,
}: {
  totals: MonthlyTotals;
  previous?: MonthlyTotals;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <Tile
        label="Revenue"
        value={eur(totals.revenue)}
        accent="cyan"
        delta={previous ? totals.revenue - previous.revenue : undefined}
      />
      <Tile
        label="Despesas"
        value={eur(totals.expenses)}
        delta={previous ? totals.expenses - previous.expenses : undefined}
        deltaInverted
      />
      <Tile
        label="Funcionário"
        value={eur(totals.employees)}
        delta={previous ? totals.employees - previous.employees : undefined}
        deltaInverted
      />
      <Tile
        label="IVA"
        value={eur(totals.iva)}
        delta={previous ? totals.iva - previous.iva : undefined}
        deltaInverted
      />
      <Tile
        label="Profit"
        value={eur(totals.profit)}
        accent={totals.profit >= 0 ? "green" : "red"}
        emphasis
        delta={previous ? totals.profit - previous.profit : undefined}
      />
    </div>
  );
}

function Tile({
  label,
  value,
  accent,
  emphasis,
  delta,
  deltaInverted,
}: {
  label: string;
  value: string;
  accent?: "cyan" | "green" | "red";
  emphasis?: boolean;
  delta?: number;
  /** If true, positive delta is bad (e.g. expenses going up). */
  deltaInverted?: boolean;
}) {
  const accentClass =
    accent === "cyan"
      ? "text-brand-cyan"
      : accent === "green"
        ? "text-emerald-300"
        : accent === "red"
          ? "text-rose-300"
          : "text-white";
  const deltaSign = delta && delta !== 0 ? (delta > 0 ? "+" : "−") : "";
  const deltaIsGood =
    delta === undefined || delta === 0
      ? null
      : deltaInverted
        ? delta < 0
        : delta > 0;
  const deltaColor =
    deltaIsGood === null
      ? "text-white/40"
      : deltaIsGood
        ? "text-emerald-300"
        : "text-rose-300";
  return (
    <div
      className={`rounded-2xl border bg-white/[0.03] p-4 backdrop-blur-md ${
        emphasis ? "border-white/20 sm:col-span-1" : "border-white/10"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
      <p
        className={`mt-2 font-semibold tracking-tight ${
          emphasis ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
        } ${accentClass}`}
      >
        {value}
      </p>
      {delta !== undefined && (
        <p className={`mt-1 text-[11px] font-medium ${deltaColor}`}>
          {delta === 0 ? "= mês anterior" : `${deltaSign}${eurDelta(Math.abs(delta)).replace(/^[+−]/, "")} vs anterior`}
        </p>
      )}
    </div>
  );
}
