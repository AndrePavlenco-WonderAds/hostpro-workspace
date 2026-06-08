import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PROPERTIES, getProperty } from "@/lib/properties";
import { getEntries } from "@/lib/pnl-store";
import {
  aggregateMonth,
  filterMonth,
  listMonths,
} from "@/lib/pnl-math";
import {
  currentMonthKey,
  defaultDateForMonth,
  monthLabel,
  shiftMonth,
  type MonthKey,
} from "@/lib/dates";

import { OverviewTiles } from "@/components/overview-tiles";
import { MonthPicker } from "@/components/month-picker";
import { PnLTable } from "@/components/pnl-table";
import { DashboardStats } from "@/components/dashboard-stats";

export function generateStaticParams() {
  return PROPERTIES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getProperty(slug);
  return { title: p ? `${p.name} — HostPro` : "Alojamento — HostPro" };
}

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { slug } = await params;
  const property = getProperty(slug);
  if (!property) notFound();

  // Cyclic prev/next around the PROPERTIES order. Saves Andre a round-trip
  // to `/` (Home) when comparing one AL against its neighbour.
  const idx = PROPERTIES.findIndex((p) => p.slug === property.slug);
  const prevProperty = PROPERTIES[(idx - 1 + PROPERTIES.length) % PROPERTIES.length];
  const nextProperty = PROPERTIES[(idx + 1) % PROPERTIES.length];

  const { m } = await searchParams;
  const entries = await getEntries(property.slug);

  const monthsWithData = listMonths(entries);
  const fallback = monthsWithData[0] ?? currentMonthKey();
  const month: MonthKey = (m && /^\d{4}-\d{2}$/.test(m) ? (m as MonthKey) : fallback);

  const pickerOptions = listMonths(entries, [
    currentMonthKey(),
    shiftMonth(currentMonthKey(), -1),
    shiftMonth(currentMonthKey(), +1),
  ]);

  const totals = aggregateMonth(entries, month);
  const previous = aggregateMonth(entries, shiftMonth(month, -1));
  const monthEntries = filterMonth(entries, month);

  return (
    <div className="min-h-screen bg-brand-navy-dark">
      <section className="relative h-56 sm:h-72">
        <Image
          src={property.photo}
          alt={property.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-dark via-brand-navy-dark/70 to-brand-navy-dark/30" />

<div className="absolute inset-x-0 top-0 px-4 pt-4 sm:px-10 sm:pt-8">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white/85 backdrop-blur-sm transition hover:border-brand-cyan hover:text-white"
              >
                ← Início
              </Link>
              <Link
                href={`/alojamentos/${prevProperty.slug}`}
                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white/85 backdrop-blur-sm transition hover:border-brand-cyan hover:text-white"
                title={`Anterior: ${prevProperty.shortName}`}
              >
                ‹ {prevProperty.shortName}
              </Link>
              <Link
                href={`/alojamentos/${nextProperty.slug}`}
                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white/85 backdrop-blur-sm transition hover:border-brand-cyan hover:text-white"
                title={`Seguinte: ${nextProperty.shortName}`}
              >
                {nextProperty.shortName} ›
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/alojamentos/${property.slug}/reserva`}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-cyan/95 px-3.5 py-1.5 text-xs font-semibold text-brand-navy shadow-[0_10px_30px_-8px_rgba(0,181,226,0.6)] transition hover:opacity-90"
              >
                🧾 Gerar reserva
              </Link>
              <span className="rounded-full bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/85 ring-1 ring-white/15 backdrop-blur-sm">
                {property.location}
              </span>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 px-4 pb-5 sm:px-10 sm:pb-8">
          <div className="mx-auto w-full max-w-6xl">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">
              {property.name}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-white/75 sm:text-base">
              {property.description}
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-10 sm:py-12">
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            Dashboard
          </h2>
          <div className="mt-4">
            {entries.length === 0 ? (
              <EmptyStateInline />
            ) : (
              <DashboardStats
                entries={entries}
                monthEntries={monthEntries}
                monthKey={month}
              />
            )}
          </div>
        </section>

        <section className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                P&amp;L mensal
              </h2>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {monthLabel(month)}
              </p>
            </div>
            <MonthPicker
              current={month}
              options={pickerOptions}
              basePath={`/alojamentos/${property.slug}`}
            />
          </div>

          <div className="mt-6">
            <OverviewTiles totals={totals} previous={previous} />
          </div>

          <div className="mt-10">
            <PnLTable
              entries={monthEntries}
              propertySlug={property.slug}
              defaultDate={defaultDateForMonth(month)}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function EmptyStateInline() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center backdrop-blur-md">
      <p className="text-sm text-white/55">
        Ainda sem entradas registadas. Usa os botões{" "}
        <span className="text-brand-cyan">+ Adicionar</span> na tabela em baixo
        para começar.
      </p>
    </div>
  );
}
