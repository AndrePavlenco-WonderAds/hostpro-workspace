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
  // Build all 12 months of the year — empty months render as thin grey bars
  // so the chart shape stays comparable as the year fills up.
  const byKey = new Map(breakdown.map((b) => [b.key, b]));
  const months = Array.from({ length: 12 }, (_, i) => {
    const k = `${year}-${String(i + 1).padStart(2, "0")}` as MonthKey;
    const found = byKey.get(k);
    return {
      key: k,
      monthNum: String(i + 1).padStart(2, "0"),
      revenue: found?.totals.revenue ?? 0,
    };
  });
  const max = Math.max(...months.map((m) => m.revenue), 100);

  return (
    <div className="flex items-end gap-1.5">
      {months.map((m, i) => {
        const h = (m.revenue / max) * 100;
        const hasData = m.revenue > 0;
        return (
          <div key={m.key} className="flex flex-1 flex-col items-center">
            {/* Fixed-height column so the bar's % height resolves correctly */}
            <div className="relative h-24 w-full">
              <div
                className={`absolute inset-x-0 bottom-0 origin-bottom rounded-t-sm ${
                  hasData ? "bg-brand-cyan/85" : "bg-white/[0.08]"
                } animate-bar-grow`}
                style={{
                  height: `${Math.max(h, 4)}%`,
                  animationDelay: `${i * 70}ms`,
                }}
                title={`${m.monthNum}/${year}: ${eur(m.revenue)}`}
              />
            </div>
            <span className="mt-1 text-[9px] uppercase tracking-wider text-white/40">
              {m.monthNum}
            </span>
          </div>
        );
      })}
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
