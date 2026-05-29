import Image from "next/image";
import Link from "next/link";
import { PROPERTIES } from "@/lib/properties";
import { getEntries } from "@/lib/pnl-store";
import { aggregateMonth, monthlyBreakdown } from "@/lib/pnl-math";
import { currentMonthKey } from "@/lib/dates";
import { eur } from "@/lib/money";
import { getCurrentVersion } from "@/lib/changelog";
import { PropertyCard } from "@/components/property-card";

export default async function Home() {
  const version = getCurrentVersion();
  const current = currentMonthKey();

  // Pre-compute monthly totals for the cards.
  const cards = await Promise.all(
    PROPERTIES.map(async (p) => {
      const entries = await getEntries(p.slug);
      const month = aggregateMonth(entries, current);
      const hasAnyData = entries.length > 0;
      const latest = monthlyBreakdown(entries).slice(-1)[0];
      const display = month.entryCount > 0 ? month : (latest?.totals ?? month);
      return {
        property: p,
        hasData: hasAnyData,
        monthRevenue: eur(display.revenue),
        monthProfit: eur(display.profit),
      };
    }),
  );

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-brand-navy-dark">
      {/* Blurred hero photo behind everything. */}
      <Image
        src="/hero-living-room.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover scale-110 blur-2xl opacity-30"
      />
      {/* Navy wash so the content stays legible. */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-navy-dark/75 via-brand-navy-dark/85 to-brand-navy-dark/95" />

      <main className="relative z-10 flex flex-1 flex-col items-center px-6 py-14 sm:py-20">
        <div className="flex w-full max-w-6xl flex-col items-center gap-10 text-center">
          {/* Logo + claim */}
          <Image
            src="/hostpro-logo-white.png"
            alt="HostPro"
            width={300}
            height={82}
            priority
          />
          <div className="h-1 w-14 rounded-full bg-brand-cyan" />

          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl">
            O seu alojamento,
            <br />
            nas melhores mãos.
          </h1>

          {/* Property cards row — clicks straight into each property's page */}
          <section className="mt-4 grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <PropertyCard
                key={c.property.slug}
                property={c.property}
                hasData={c.hasData}
                monthRevenue={c.monthRevenue}
                monthProfit={c.monthProfit}
              />
            ))}
          </section>

          {/* Admin CTA below the cards */}
          <Link
            href="/admin"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-cyan px-6 py-3 text-sm font-semibold text-brand-navy shadow-[0_15px_40px_-12px_rgba(0,181,226,0.7)] transition hover:opacity-90"
          >
            Admin view
            <span aria-hidden>→</span>
          </Link>
        </div>
      </main>

      <footer className="relative z-10 flex items-center justify-center gap-3 px-6 pb-8 text-[11px] uppercase tracking-[0.22em] text-white/40">
        <span>HostPro Workspace</span>
        <span aria-hidden className="text-white/20">·</span>
        <Link href="/changelog" className="transition hover:text-brand-cyan">
          v{version}
        </Link>
      </footer>
    </div>
  );
}
