// Hero dashboard band on the homepage — current month + YTD across every
// property. Server component, pure rendering from already-aggregated totals.

import type { MonthlyTotals } from "@/lib/pnl-math";
import { eur, eurDelta } from "@/lib/money";

type Accent = "cyan" | "green" | "red" | "white";

export function HomeOverview({
  totalsMonth,
  totalsPrev,
  ytd,
  ytdReservas,
  monthReservas,
  monthLabel,
  year,
}: {
  totalsMonth: MonthlyTotals;
  totalsPrev: MonthlyTotals;
  ytd: MonthlyTotals;
  ytdReservas: number;
  monthReservas: number;
  monthLabel: string;
  year: string;
}) {
  const margemMes =
    totalsMonth.revenue > 0
      ? `${((totalsMonth.profit / totalsMonth.revenue) * 100).toFixed(1)} %`
      : "—";
  const margemYtd =
    ytd.revenue > 0
      ? `${((ytd.profit / ytd.revenue) * 100).toFixed(1)} %`
      : "—";

  return (
    <div className="space-y-5">
      <Band
        eyebrow={monthLabel}
        meta={`${monthReservas} ${monthReservas === 1 ? "reserva" : "reservas"}`}
        tiles={[
          {
            label: "Ganhos",
            value: eur(totalsMonth.revenue),
            accent: "cyan",
            delta: totalsMonth.revenue - totalsPrev.revenue,
          },
          {
            label: "Custos",
            value: eur(totalsMonth.totalExpenses),
            accent: "red",
            delta: totalsMonth.totalExpenses - totalsPrev.totalExpenses,
            deltaInverted: true,
          },
          {
            label: "Lucro",
            value: eur(totalsMonth.profit),
            accent: totalsMonth.profit >= 0 ? "green" : "red",
            delta: totalsMonth.profit - totalsPrev.profit,
            emphasis: true,
          },
          {
            label: "Margem",
            value: margemMes,
            accent: totalsMonth.profit >= 0 ? "green" : "red",
          },
        ]}
      />

      <Band
        eyebrow={`Acumulado · ${year}`}
        meta={`${ytdReservas} ${ytdReservas === 1 ? "reserva" : "reservas"} YTD`}
        tiles={[
          { label: "Ganhos", value: eur(ytd.revenue), accent: "cyan" },
          { label: "Custos", value: eur(ytd.totalExpenses), accent: "red" },
          {
            label: "Lucro",
            value: eur(ytd.profit),
            accent: ytd.profit >= 0 ? "green" : "red",
            emphasis: true,
          },
          {
            label: "Margem",
            value: margemYtd,
            accent: ytd.profit >= 0 ? "green" : "red",
          },
        ]}
      />
    </div>
  );
}

function Band({
  eyebrow,
  meta,
  tiles,
}: {
  eyebrow: string;
  meta: string;
  tiles: Array<{
    label: string;
    value: string;
    accent: Accent;
    emphasis?: boolean;
    delta?: number;
    deltaInverted?: boolean;
  }>;
}) {
  return (
    <section>
      <header className="flex items-baseline justify-between gap-3 px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
          {eyebrow}
        </p>
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
          {meta}
        </p>
      </header>
      <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Tile key={t.label} {...t} />
        ))}
      </div>
    </section>
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
  accent: Accent;
  emphasis?: boolean;
  delta?: number;
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
      className={`rounded-2xl border bg-white/[0.04] p-3.5 backdrop-blur-md transition sm:p-4 ${
        emphasis ? "border-white/25" : "border-white/10"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
      <p
        className={`mt-1.5 font-semibold tracking-tight tabular-nums ${
          emphasis ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
        } ${accentClass}`}
      >
        {value}
      </p>
      {delta !== undefined && (
        <p className={`mt-1 text-[10px] font-medium tabular-nums ${deltaColor}`}>
          {delta === 0 ? "= mês anterior" : `${eurDelta(delta)} vs mês ant.`}
        </p>
      )}
    </div>
  );
}
