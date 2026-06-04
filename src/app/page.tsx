import Image from "next/image";
import Link from "next/link";
import { PROPERTIES } from "@/lib/properties";
import { getEntries } from "@/lib/pnl-store";
import { aggregateMonth, monthlyBreakdown } from "@/lib/pnl-math";
import { currentMonthKey } from "@/lib/dates";
import { eur } from "@/lib/money";
import { PropertyCard } from "@/components/property-card";
import { Typewriter } from "@/components/typewriter";

export default async function Home() {
  const current = currentMonthKey();

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
    // `min-h-screen` (não `h-screen`) + sem `overflow-hidden` → no mobile a
    // home faz scroll normalmente. Em desktops continua a parecer uma única
    // viewport porque o conteúdo cabe naturalmente.
    <div className="relative flex min-h-screen flex-col bg-brand-navy-dark">
      {/* Hero photo behind everything — softer blur per Andre's feedback. */}
      <Image
        src="/hero-living-room.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover scale-110 blur-lg opacity-55"
      />
      {/* Navy wash so the content stays legible. */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-navy-dark/50 via-brand-navy-dark/65 to-brand-navy-dark/80" />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-6">
        <div className="flex w-full max-w-6xl flex-col items-center gap-5 text-center sm:gap-6">
          <Image
            src="/hostpro-logo-white.png"
            alt="HostPro"
            width={240}
            height={66}
            priority
            className="h-auto w-48 sm:w-60"
          />
          <div className="h-1 w-12 rounded-full bg-brand-cyan" />

          {/* `whitespace-nowrap` apenas em ≥ sm — em mobile a frase pode
              quebrar naturalmente para não overflow horizontal. */}
          <h1 className="text-xl font-semibold tracking-tight text-white sm:whitespace-nowrap sm:text-3xl">
            <Typewriter text="O seu alojamento, nas melhores mãos." />
          </h1>

          <section className="mt-1 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

          <Link
            href="/admin"
            className="mt-1 inline-flex items-center gap-2 rounded-full bg-brand-cyan px-6 py-2.5 text-sm font-semibold text-brand-navy shadow-[0_15px_40px_-12px_rgba(0,181,226,0.7)] transition hover:opacity-90"
          >
            Visão Geral
            <span aria-hidden>→</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
