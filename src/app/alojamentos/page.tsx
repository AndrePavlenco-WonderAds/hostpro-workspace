import Link from "next/link";
import { PROPERTIES } from "@/lib/properties";
import { getEntries } from "@/lib/pnl-store";
import { aggregateMonth, monthlyBreakdown } from "@/lib/pnl-math";
import { currentMonthKey, monthLabel } from "@/lib/dates";
import { eur } from "@/lib/money";
import { PropertyCard } from "@/components/property-card";

export const metadata = {
  title: "Alojamentos — HostPro Workspace",
};

export default function AlojamentosPage() {
  const current = currentMonthKey();

  return (
    <div className="min-h-screen bg-brand-navy-dark px-6 py-10 sm:px-10 sm:py-14">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-3">
          <Link
            href="/"
            className="text-sm text-white/55 transition hover:text-white"
          >
            ← Voltar
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Alojamentos
              </h1>
              <p className="mt-2 text-sm text-white/55 sm:text-base">
                Os {PROPERTIES.length} alojamentos activos da HostPro. Os cartões
                mostram a receita e profit de <strong className="text-white">{monthLabel(current)}</strong>.
              </p>
            </div>
            <span className="rounded-full border border-brand-cyan/40 bg-brand-cyan/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-cyan">
              Operação ao vivo
            </span>
          </div>
        </header>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROPERTIES.map((p) => {
            const entries = getEntries(p.slug);
            const month = aggregateMonth(entries, current);
            const hasAnyData = entries.length > 0;
            const latest = monthlyBreakdown(entries).slice(-1)[0];
            // If the current month has no entries but historical data exists,
            // show the most recent month with data so the card isn't all dashes.
            const display = month.entryCount > 0
              ? month
              : latest?.totals ?? month;

            return (
              <PropertyCard
                key={p.slug}
                property={p}
                hasData={hasAnyData}
                monthRevenue={eur(display.revenue)}
                monthProfit={eur(display.profit)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
