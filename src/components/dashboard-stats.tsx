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
  entries: PnLEntry[];
  monthEntries: PnLEntry[];
  monthKey: MonthKey;
}) {
  const biggestEMonth = biggestEntrada(monthEntries);
  const best = bestMonth(entries);

  const ytdYear = monthKey.slice(0, 4);
  const ytdEntries = entries.filter((e) => e.date.startsWith(ytdYear));
  const ytdReservas = ytdEntries.filter((e) => e.kind === "entrada").length;
  const ytd = aggregate(ytdEntries);
  const breakdown = monthlyBreakdown(entries);

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {/* Ganhos acumulados — full-width, with monthly bar chart on the right */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 backdrop-blur-md lg:col-span-3">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
              <span aria-hidden>📊</span>
              Ganhos acumulados desde início de {ytdYear}
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-brand-cyan">
              {eur(ytd.revenue)}
            </p>
            <p className="mt-1 text-xs text-white/55">
              {ytdReservas} {ytdReservas === 1 ? "reserva" : "reservas"} desde 01/01/{ytdYear}
            </p>
          </div>

          <YearChart breakdown={breakdown.filter((b) => b.key.startsWith(ytdYear))} year={ytdYear} />
        </div>
      </div>

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
        label={`Lucro acumulado desde início de ${ytdYear}`}
        value={eur(ytd.profit)}
        sub={`Margem ${ytd.revenue > 0 ? ((ytd.profit / ytd.revenue) * 100).toFixed(1) : "0.0"}%`}
        accent={ytd.profit >= 0 ? "green" : "red"}
      />

      {/* Tendência mensal — full table for every month with data */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 backdrop-blur-md lg:col-span-3">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            Tendência mensal · ganhos vs custos
          </p>
          <p className="mt-1 text-[11px] text-white/40">
            Desde início de {ytdYear}
          </p>
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
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  accent?: "cyan" | "rose" | "green" | "red";
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 backdrop-blur-md">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
        <span aria-hidden>{icon}</span>
        {label}
      </div>
      <p className={`mt-3 text-2xl font-semibold tracking-tight ${accentClass}`}>{value}</p>
      <p className="mt-1 text-xs text-white/55">{sub}</p>
    </div>
  );
}

function YearChart({
  breakdown,
  year,
}: {
  breakdown: ReturnType<typeof monthlyBreakdown>;
  year: string;
}) {
  // Build all 12 months — ganhos + custos side-by-side per month so it's easy
  // to eyeball months where custos blew past revenue.
  const byKey = new Map(breakdown.map((b) => [b.key, b]));
  const months = Array.from({ length: 12 }, (_, i) => {
    const k = `${year}-${String(i + 1).padStart(2, "0")}` as MonthKey;
    const found = byKey.get(k);
    return {
      key: k,
      monthNum: String(i + 1).padStart(2, "0"),
      revenue: found?.totals.revenue ?? 0,
      expenses: found?.totals.totalExpenses ?? 0,
    };
  });
  const raw = Math.max(
    ...months.map((m) => Math.max(m.revenue, m.expenses)),
    500,
  );
  // Round up to a clean step so the gridlines read nicely (500, 1000, 1500…).
  const step = raw <= 2000 ? 500 : raw <= 5000 ? 1000 : 2000;
  const max = Math.ceil(raw / step) * step;
  const lines = Array.from(
    { length: Math.round(max / step) + 1 },
    (_, i) => i * step,
  ).reverse(); // top → bottom

  const CHART_HEIGHT = 144; // ~h-36 in px

  return (
    <div className="flex gap-2">
      {/* Y-axis */}
      <div
        className="flex flex-col justify-between pr-1 text-right text-[9px] text-white/40"
        style={{ height: CHART_HEIGHT }}
      >
        {lines.map((v) => (
          <span key={v} className="leading-none">
            {v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k€` : `${v}€`}
          </span>
        ))}
      </div>

      {/* Chart area */}
      <div className="flex flex-1 flex-col">
        <div
          className="relative flex items-end gap-1.5"
          style={{ height: CHART_HEIGHT }}
        >
          {/* Gridlines */}
          {lines.map((v) => (
            <div
              key={v}
              aria-hidden
              className="pointer-events-none absolute inset-x-0 border-t border-white/[0.06]"
              style={{ bottom: `${(v / max) * 100}%` }}
            />
          ))}

          {/* Month columns */}
          {months.map((m, i) => {
            const hRev = (m.revenue / max) * 100;
            const hExp = (m.expenses / max) * 100;
            return (
              <div
                key={m.key}
                className="relative flex h-full flex-1 items-end justify-center gap-0.5"
                title={`${m.monthNum}/${year} · ganhos ${eur(m.revenue)} · custos ${eur(m.expenses)}`}
              >
                {/* Ganhos */}
                <div
                  className={`origin-bottom flex-1 rounded-t-sm animate-bar-grow ${
                    m.revenue > 0 ? "bg-brand-cyan/85" : "bg-white/[0.05]"
                  }`}
                  style={{
                    height: `${Math.max(hRev, m.revenue > 0 ? 4 : 0)}%`,
                    animationDelay: `${i * 70}ms`,
                  }}
                />
                {/* Custos */}
                <div
                  className={`origin-bottom flex-1 rounded-t-sm animate-bar-grow ${
                    m.expenses > 0 ? "bg-rose-400/75" : "bg-white/[0.05]"
                  }`}
                  style={{
                    height: `${Math.max(hExp, m.expenses > 0 ? 4 : 0)}%`,
                    animationDelay: `${i * 70 + 35}ms`,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Month labels */}
        <div className="mt-2 flex gap-1.5">
          {months.map((m) => (
            <span
              key={m.key}
              className="flex-1 text-center text-[9px] uppercase tracking-wider text-white/40"
            >
              {m.monthNum}
            </span>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-end gap-4 text-[10px] text-white/55">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-brand-cyan/85" />
            Ganhos
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-rose-400/75" />
            Custos
          </span>
        </div>
      </div>
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
    <div className="mt-5 grid gap-2">
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
                  <div className="h-full origin-left animate-bar-line bg-brand-cyan/85" style={{ width: `${revW}%` }} />
                </div>
                <span className="w-20 shrink-0 text-right text-white/70">{eur(b.totals.revenue)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-[10px] uppercase tracking-wider text-rose-300/80">
                  custos
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full origin-left animate-bar-line bg-rose-400/70" style={{ width: `${expW}%` }} />
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
