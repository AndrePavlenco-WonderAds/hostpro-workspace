import Image from "next/image";
import Link from "next/link";
import { PROPERTIES } from "@/lib/properties";
import { getAllEntries } from "@/lib/pnl-store";
import {
  aggregateMonth,
  totalLavandariaKg,
  filterMonth,
  listMonths,
} from "@/lib/pnl-math";
import {
  currentMonthKey,
  monthLabelShort,
  shiftMonth,
  type MonthKey,
} from "@/lib/dates";
import { eur } from "@/lib/money";
import { PropertyCard } from "@/components/property-card";
import { MonthPicker } from "@/components/month-picker";
import { Typewriter } from "@/components/typewriter";

function kg(value: number): string {
  return `${value.toLocaleString("pt-PT", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  })} kg`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  // One read covers every property — we slice by slug locally.
  const all = await getAllEntries();

  // Mês seleccionado via ?m=YYYY-MM (default: mês actual). Permite navegar
  // por meses anteriores sem entrar em cada card.
  const { m } = await searchParams;
  const month: MonthKey =
    m && /^\d{4}-\d{2}$/.test(m) ? (m as MonthKey) : currentMonthKey();
  const monthShort = monthLabelShort(month);

  const pickerOptions = listMonths(all, [
    currentMonthKey(),
    shiftMonth(currentMonthKey(), -1),
    shiftMonth(currentMonthKey(), +1),
  ]);

  const cards = PROPERTIES.map((p) => {
    const entries = all.filter((e) => e.property === p.slug);
    const totals = aggregateMonth(entries, month);
    const monthEntries = filterMonth(entries, month);
    const lavandariaKgMes = totalLavandariaKg(monthEntries);
    const lastEntry = [...entries].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    return {
      property: p,
      hasData: entries.length > 0,
      monthRevenue: eur(totals.revenue),
      monthExpenses: eur(totals.totalExpenses),
      monthProfit: eur(totals.profit),
      monthProfitPositive: totals.profit >= 0,
      monthLavandariaKg: kg(lavandariaKgMes),
      lastActivity: lastEntry?.date,
    };
  });

  return (
    // `min-h-screen` deixa a home crescer só o que o conteúdo precisa. A
    // imagem de fundo está dentro de um wrapper próprio com `overflow-hidden`
    // porque o `scale-110` (preserva-se para esconder bordas do blur) faz a
    // imagem ultrapassar o pai em 10% nos dois eixos — sem clip era a
    // origem do scroll lateral E vertical "fantasma" da home (v0.10.5).
    <div className="relative flex min-h-screen flex-col bg-brand-navy-dark">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/hero-living-room.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="scale-110 object-cover opacity-30 blur-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-navy-dark/75 via-brand-navy-dark/90 to-brand-navy-dark" />
      </div>

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

        <section className="flex w-full flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
              A ver o mês de
            </span>
            <MonthPicker current={month} options={pickerOptions} basePath="/" />
          </div>

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
                lastActivity={c.lastActivity}
              />
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full bg-brand-cyan px-6 py-2.5 text-sm font-semibold text-brand-navy shadow-[0_15px_40px_-12px_rgba(0,181,226,0.7)] transition hover:opacity-90"
          >
            Visão Geral
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/marketing"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-brand-cyan hover:text-white"
          >
            <span aria-hidden>📣</span>
            Postagem de conteúdo
          </Link>
        </div>
      </main>
    </div>
  );
}
