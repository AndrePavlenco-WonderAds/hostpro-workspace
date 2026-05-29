// All-time records + a tiny monthly bar trend.
// Renders directly from PnLEntry list (server component, no client state).

import {
  biggestEntrada,
  biggestDespesa,
  bestMonth,
  monthlyBreakdown,
  aggregate,
} from "@/lib/pnl-math";
import type { PnLEntry } from "@/lib/pnl-types";
import { eur } from "@/lib/money";
import { ddmmyyyy, monthLabel, monthLabelShort } from "@/lib/dates";

export function DashboardStats({ entries }: { entries: PnLEntry[] }) {
  const biggestE = biggestEntrada(entries);
  const biggestD = biggestDespesa(entries);
  const best = bestMonth(entries);
  const all = aggregate(entries);
  const breakdown = monthlyBreakdown(entries);

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <Record
        icon="🏆"
        label="Maior reserva de sempre"
        value={biggestE ? eur(biggestE.entry.amount) : "—"}
        sub={
          biggestE
            ? `${biggestE.entry.kind === "entrada" ? biggestE.entry.stayWindow ?? "—" : "—"} · ${ddmmyyyy(biggestE.entry.date)}`
            : "Ainda sem reservas registadas"
        }
        accent="cyan"
      />
      <Record
        icon="💸"
        label="Maior despesa de sempre"
        value={biggestD ? eur(biggestD.entry.amount) : "—"}
        sub={
          biggestD
            ? `${biggestD.entry.description} · ${ddmmyyyy(biggestD.entry.date)}`
            : "Sem despesas registadas"
        }
        accent="rose"
      />
      <Record
        icon="📅"
        label="Melhor mês"
        value={best ? eur(best.totals.profit) : "—"}
        sub={best ? monthLabel(best.key) : "Sem dados ainda"}
        accent="green"
      />

      <Record
        icon="📊"
        label="Receita acumulada"
        value={eur(all.revenue)}
        sub={`${all.entryCount} entradas registadas`}
      />
      <Record
        icon="🧾"
        label="IVA acumulado"
        value={eur(all.iva)}
        sub="A ir para o IVA Vault"
      />
      <Record
        icon="🏷️"
        label="Profit acumulado"
        value={eur(all.profit)}
        sub={`Margem ${all.revenue > 0 ? ((all.profit / all.revenue) * 100).toFixed(1) : "0.0"}%`}
        accent={all.profit >= 0 ? "green" : "red"}
      />

      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 backdrop-blur-md lg:col-span-3">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            Tendência mensal · profit
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
      <p className={`mt-3 text-2xl font-semibold tracking-tight ${accentClass}`}>
        {value}
      </p>
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
      <p className="mt-6 text-center text-sm text-white/45">
        Sem histórico ainda.
      </p>
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
                <span className="w-12 shrink-0 text-[10px] uppercase tracking-wider text-brand-cyan/80">
                  rev
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full bg-brand-cyan/85"
                    style={{ width: `${revW}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-white/70">
                  {eur(b.totals.revenue)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-[10px] uppercase tracking-wider text-rose-300/80">
                  exp
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full bg-rose-400/70"
                    style={{ width: `${expW}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-white/70">
                  {eur(b.totals.totalExpenses)}
                </span>
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
