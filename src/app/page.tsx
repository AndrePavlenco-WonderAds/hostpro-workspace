import Image from "next/image";
import Link from "next/link";
import { PROPERTIES } from "@/lib/properties";
import { getAllEntries } from "@/lib/pnl-store";
import { aggregate, aggregateMonth } from "@/lib/pnl-math";
import { currentMonthKey, shiftMonth, monthLabel } from "@/lib/dates";
import { eur } from "@/lib/money";
import { PropertyCard } from "@/components/property-card";
import { HomeOverview } from "@/components/home-overview";
import { Typewriter } from "@/components/typewriter";

export default async function Home() {
  const current = currentMonthKey();
  const prev = shiftMonth(current, -1);
  const year = current.slice(0, 4);

  // One single read covers every property, then we slice locally — cheaper
  // than the per-property awaits the old version did.
  const all = await getAllEntries();

  const totalsMonth = aggregateMonth(all, current);
  const totalsPrev = aggregateMonth(all, prev);

  const ytdEntries = all.filter((e) => e.date.startsWith(year));
  const ytd = aggregate(ytdEntries);
  const ytdReservas = ytdEntries.filter((e) => e.kind === "entrada").length;
  const monthReservas = all.filter(
    (e) => e.kind === "entrada" && e.date.startsWith(current),
  ).length;

  const cards = PROPERTIES.map((p) => {
    const entries = all.filter((e) => e.property === p.slug);
    const month = aggregateMonth(entries, current);
    const ytdProp = aggregate(entries.filter((e) => e.date.startsWith(year)));
    const reservasYtdProp = entries.filter(
      (e) => e.kind === "entrada" && e.date.startsWith(year),
    ).length;
    const lastEntry = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    return {
      property: p,
      hasData: entries.length > 0,
      monthRevenue: eur(month.revenue),
      monthProfit: eur(month.profit),
      ytdRevenue: eur(ytdProp.revenue),
      ytdProfit: eur(ytdProp.profit),
      reservasYtd: reservasYtdProp,
      lastActivity: lastEntry?.date,
    };
  });

  return (
    // `min-h-screen` (sem `h-screen`) + sem `overflow-hidden` → no mobile a
    // home faz scroll natural. Em desktops continua a parecer one-page porque
    // o conteúdo cabe naturalmente sem clipar.
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

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10">
        {/* Compact brand header — leaves room for the dashboard below. */}
        <header className="flex flex-col items-center gap-2 text-center sm:gap-3">
          <Image
            src="/hostpro-logo-white.png"
            alt="HostPro"
            width={240}
            height={66}
            priority
            className="h-auto w-36 sm:w-48"
          />
          <div className="h-0.5 w-10 rounded-full bg-brand-cyan" />
          {/* `whitespace-nowrap` só em ≥ sm — em mobile a frase quebra para
              não causar overflow horizontal. */}
          <h1 className="text-base font-semibold tracking-tight text-white sm:whitespace-nowrap sm:text-2xl">
            <Typewriter text="O seu alojamento, nas melhores mãos." />
          </h1>
        </header>

        <HomeOverview
          totalsMonth={totalsMonth}
          totalsPrev={totalsPrev}
          ytd={ytd}
          ytdReservas={ytdReservas}
          monthReservas={monthReservas}
          monthLabel={monthLabel(current)}
          year={year}
        />

        <section>
          <header className="flex items-baseline justify-between gap-3 px-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
              Alojamentos · {PROPERTIES.length}
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
              Tocar para abrir
            </p>
          </header>
          <div className="mt-2.5 grid w-full gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {cards.map((c) => (
              <PropertyCard
                key={c.property.slug}
                property={c.property}
                hasData={c.hasData}
                monthRevenue={c.monthRevenue}
                monthProfit={c.monthProfit}
                ytdRevenue={c.ytdRevenue}
                ytdProfit={c.ytdProfit}
                reservasYtd={c.reservasYtd}
                lastActivity={c.lastActivity}
                year={year}
              />
            ))}
          </div>
        </section>

        <div className="flex flex-col items-center gap-1.5 pt-1">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full bg-brand-cyan px-6 py-2.5 text-sm font-semibold text-brand-navy shadow-[0_15px_40px_-12px_rgba(0,181,226,0.7)] transition hover:opacity-90"
          >
            Visão Geral
            <span aria-hidden>→</span>
          </Link>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
            Dados ao vivo · {monthLabel(current)}
          </p>
        </div>
      </main>
    </div>
  );
}
