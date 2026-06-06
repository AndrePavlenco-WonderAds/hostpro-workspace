import Image from "next/image";
import Link from "next/link";
import { PROPERTIES } from "@/lib/properties";
import { getAllEntries } from "@/lib/pnl-store";
import {
  aggregate,
  aggregateMonth,
  totalLavandariaKg,
  filterMonth,
} from "@/lib/pnl-math";
import { currentMonthKey, monthLabelShort } from "@/lib/dates";
import { eur } from "@/lib/money";
import { PropertyCard } from "@/components/property-card";
import { Typewriter } from "@/components/typewriter";

function kg(value: number): string {
  return `${value.toLocaleString("pt-PT", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  })} kg`;
}

export default async function Home() {
  const current = currentMonthKey();
  const year = current.slice(0, 4);
  const monthShort = monthLabelShort(current);

  // One read covers every property — we slice by slug locally.
  const all = await getAllEntries();

  const cards = PROPERTIES.map((p) => {
    const entries = all.filter((e) => e.property === p.slug);
    const month = aggregateMonth(entries, current);
    const monthEntries = filterMonth(entries, current);
    const lavandariaKgMes = totalLavandariaKg(monthEntries);
    const ytdEntries = entries.filter((e) => e.date.startsWith(year));
    const ytdProp = aggregate(ytdEntries);
    const reservasYtdProp = ytdEntries.filter((e) => e.kind === "entrada").length;
    const lastEntry = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    return {
      property: p,
      hasData: entries.length > 0,
      monthRevenue: eur(month.revenue),
      monthExpenses: eur(month.totalExpenses),
      monthProfit: eur(month.profit),
      monthProfitPositive: month.profit >= 0,
      monthLavandariaKg: kg(lavandariaKgMes),
      ytdRevenue: eur(ytdProp.revenue),
      ytdProfit: eur(ytdProp.profit),
      ytdProfitPositive: ytdProp.profit >= 0,
      reservasYtd: reservasYtdProp,
      lastActivity: lastEntry?.date,
    };
  });

  return (
    // `min-h-screen` (sem `h-screen`) + sem `overflow-hidden` → no mobile a
    // home faz scroll natural. Em desktops continua a parecer one-page
    // porque o conteúdo cabe naturalmente.
    <div className="relative flex min-h-screen flex-col bg-brand-navy-dark">
      <Image
        src="/hero-living-room.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-30 blur-2xl scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-brand-navy-dark/75 via-brand-navy-dark/90 to-brand-navy-dark" />

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10">
        <header className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/hostpro-logo-white.png"
            alt="HostPro"
            width={240}
            height={66}
            priority
            className="h-auto w-44 sm:w-56"
          />
          <div className="h-1 w-12 rounded-full bg-brand-cyan" />
          {/* `whitespace-nowrap` só em ≥ sm — em mobile a frase quebra para
              não causar overflow horizontal. */}
          <h1 className="text-xl font-semibold tracking-tight text-white sm:whitespace-nowrap sm:text-3xl">
            <Typewriter text="O seu alojamento, nas melhores mãos." />
          </h1>
        </header>

        <section className="w-full">
          <div className="grid w-full gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {cards.map((c) => (
              <PropertyCard
                key={c.property.slug}
                property={c.property}
                hasData={c.hasData}
                monthLabel={monthShort}
                monthRevenue={c.monthRevenue}
                monthExpenses={c.monthExpenses}
                monthProfit={c.monthProfit}
                monthProfitPositive={c.monthProfitPositive}
                monthLavandariaKg={c.monthLavandariaKg}
                ytdRevenue={c.ytdRevenue}
                ytdProfit={c.ytdProfit}
                ytdProfitPositive={c.ytdProfitPositive}
                reservasYtd={c.reservasYtd}
                lastActivity={c.lastActivity}
                year={year}
              />
            ))}
          </div>
        </section>

        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-full bg-brand-cyan px-6 py-2.5 text-sm font-semibold text-brand-navy shadow-[0_15px_40px_-12px_rgba(0,181,226,0.7)] transition hover:opacity-90"
        >
          Visão Geral
          <span aria-hidden>→</span>
        </Link>
      </main>
    </div>
  );
}
