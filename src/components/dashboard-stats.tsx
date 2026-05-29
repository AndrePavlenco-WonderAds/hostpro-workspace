// All-time + month-scoped records + a monthly bar trend (ganhos vs custos).
// Server component, pure rendering from PnLEntry list.

import {
  bestMonth,
  biggestEntrada,
  monthlyBreakdown,
  aggregate,
} from "@/lib/pnl-math";
import type { PnLEntry } from "@/lib/pnl-types";
import { eur } from "@/lib/money";
import { ddmmyyyy, monthLabel, monthLabelShort, type MonthKey } from "@/lib/dates";

export function DashboardStats({
  entries,
  monthEntries,
  monthKey,
}: {
  /** All entries for this property — used for YTD aggregates + monthly trend. */
  entries: PnLEntry[];
  /** Entries scoped to the currently-displayed month — used for the month-scoped records. */
  monthEntries: PnLEntry[];
  monthKey: MonthKey;
}) {
  const biggestEMonth = biggestEntrada(monthEntries);
  const best = bestMonth(entries);

  // YTD = entries in the same year as the currently displayed month.
  const ytdYear = monthKey.slice(0, 4);
  const ytdEntries = entries.filter((e) => e.date.startsWith(ytdYear));
  const ytd = aggregate(ytdEntries);
  const breakdown = monthlyBreakdown(entries);

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <Record
        icon="🏆"
        label={`Maior reserva — ${monthLabelShort(monthKey)}`}
        value={biggestEMonth ? eur(biggestEMonth.entry.amount) : "—"}
        sub={
          biggestEMonth
            ? `${biggestEMonth.entry.kind === "entrada" ? biggestEMonth.entry.stayWindow ?? "—" : "—"} · ${ddmmyyyy(biggestEMonth.entry.date)}`
            : "Sem reservas neste mês"
        }
        accent="cyan"
      />
      <Record
        icon="📅"
        label="Melhor mês"
        value={best ? eur(best.totals.profit) : "—"}
        sub={best ? monthLabel(best.key) : "Sem dados ainda"}
        accent="green"
      />
      <Record
        icon="🏷️"
        label="Profit acumulado"
        value={eur(ytd.profit)}
        sub={`Margem ${ytd.revenue > 0 ? ((ytd.profit / ytd.revenue) * 100).toFixed(1) : "0.0"}%`}
        accent={ytd.profit >= 0 ? "green" : "red"}
      />

      <Record
        icon="📊"
        label="Ganhos acumulados"
        value={eur(ytd.revenue)}
        sub={`Desde 01/01/${ytdYear} · ${ytdEntries.length} entradas`}
        accent="cyan"
        className="lg:col-span-3"
      />

      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 backdrop-blur-md lg:col-span-3">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            Tendência mensal · ganhos vs custos
          </p>
          <p className="text-[11px] text-white/40">{breakdown.length} meses</p>
        </header>
        <TrendBars breakdown={breakdown} />
      </div>
    </div>
  );
}

function Record({
  icon,
  label,
  value,
  sub,
  accent,
  className = "",
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  accent?: "cyan" | "rose" | "green" | "red";
  className?: string;
}) {
  const accentClass =
    accent === "cyan"
      ? "text-brand-cyan"
      : accent === "rose"
        ? "text-rose-200"
        : accent === "green"
          ? "text-emerald-300"
          : accent === "red"
            ? "text-rose-300"
            : "text-white";
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.025] p-4 backdrop-blur-md ${className}`}>
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
        <span aria-hidden>{icon}</span>
        {label}
      </div>
      <p className={`mt-3 text-2xl font-semibold tracking-tight ${accentClass}`}>{value}</p>
      <p className="mt-1 text-xs text-white/55">{sub}</p>
    </div>
  );
}

function TrendBars({
  breakdown,
}: {
  breakdown: ReturnType<typeof monthlyBreakdown>;
}) {
  if (breakdown.length === 0) {
    return (
      <p className="mt-6 text-center text-sm text-white/45">Sem histórico ainda.</p>
    );
  }
  const max = Math.max(
    ...breakdown.map((b) => Math.max(b.totals.revenue, b.totals.totalExpenses, 100)),
  );
  return (
    <div className="mt-4 grid gap-2">
      {breakdown.map((b) => {
        const revW = (b.totals.revenue / max) * 100;
        const expW = (b.totals.totalExpenses / max) * 100;
        const positive = b.totals.profit >= 0;
        return (
          <div key={b.key} className="grid grid-cols-12 items-center gap-2 text-xs">
            <span className="col-span-2 text-white/55">{monthLabelShort(b.key)}</span>
            <div className="col-span-9 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-[10px] uppercase tracking-wider text-brand-cyan/80">
                  ganhos
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full bg-brand-cyan/85" style={{ width: `${revW}%` }} />
                </div>
                <span className="w-20 shrink-0 text-right text-white/70">{eur(b.totals.revenue)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-[10px] uppercase tracking-wider text-rose-300/80">
                  custos
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full bg-rose-400/70" style={{ width: `${expW}%` }} />
                </div>
                <span className="w-20 shrink-0 text-right text-white/70">{eur(b.totals.totalExpenses)}</span>
              </div>
            </div>
            <span
              className={`col-span-1 text-right text-[11px] font-semibold ${
                positive ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {positive ? "+" : "−"}
              {eur(Math.abs(b.totals.profit))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
