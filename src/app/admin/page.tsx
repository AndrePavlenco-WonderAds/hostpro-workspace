import Image from "next/image";
import Link from "next/link";

import { PROPERTIES } from "@/lib/properties";
import { getAllEntries } from "@/lib/pnl-store";
import {
  aggregate,
  aggregateMonth,
  filterMonth,
  monthlyBreakdown,
} from "@/lib/pnl-math";
import { currentMonthKey, monthLabel, shiftMonth, ddmmyyyy } from "@/lib/dates";
import { eur, eurDelta } from "@/lib/money";
import type { PnLEntry, EntradaEntry } from "@/lib/pnl-types";
import { OverviewTiles } from "@/components/overview-tiles";

export const metadata = {
  title: "Admin — HostPro Workspace",
};

export default async function AdminPage() {
  const all = await getAllEntries();
  const month = currentMonthKey();
  const prevMonth = shiftMonth(month, -1);

  const totalsMonth = aggregateMonth(all, month);
  const totalsPrev = aggregateMonth(all, prevMonth);

  const ytdYear = month.slice(0, 4);
  const ytd = aggregate(all.filter((e) => e.date.startsWith(ytdYear)));

  // Per-property breakdown for the current month + YTD.
  const perProperty = PROPERTIES.map((p) => {
    const entries = all.filter((e) => e.property === p.slug);
    return {
      property: p,
      month: aggregateMonth(entries, month),
      prev: aggregateMonth(entries, shiftMonth(month, -1)),
      ytd: aggregate(entries.filter((e) => e.date.startsWith(ytdYear))),
      breakdown: monthlyBreakdown(entries),
      count: entries.length,
    };
  });

  const topEntradas = [...all]
    .filter((e): e is EntradaEntry => e.kind === "entrada")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const topCostsEntries = [...all]
    .filter((e) => e.kind !== "entrada")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const recent = [...all]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-brand-navy-dark px-6 py-10 sm:px-10 sm:py-14">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link
              href="/"
              className="inline-flex items-center text-sm text-white/55 transition hover:text-white"
            >
              ← Início
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Admin overview
            </h1>
            <p className="mt-2 text-sm text-white/55 sm:text-base">
              Operação consolidada dos {PROPERTIES.length} alojamentos em{" "}
              <strong className="text-white">{monthLabel(month)}</strong> e{" "}
              YTD {ytdYear}.
            </p>
          </div>
          <span className="rounded-full border border-brand-cyan/40 bg-brand-cyan/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-cyan">
            Live · v0.4.0
          </span>
        </header>

        {/* Tiles — todos os alojamentos, mês actual */}
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            {monthLabel(month)} · todos os alojamentos
          </h2>
          <div className="mt-4">
            <OverviewTiles totals={totalsMonth} previous={totalsPrev} />
          </div>
        </section>

        {/* YTD top tiles */}
        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            YTD {ytdYear}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <YtdTile label="Ganhos YTD" value={eur(ytd.revenue)} accent="cyan" />
            <YtdTile label="Custos YTD" value={eur(ytd.totalExpenses)} accent="rose" />
            <YtdTile
              label="Profit YTD"
              value={eur(ytd.profit)}
              accent={ytd.profit >= 0 ? "green" : "red"}
              emphasis
            />
            <YtdTile
              label="Margem"
              value={`${ytd.revenue > 0 ? ((ytd.profit / ytd.revenue) * 100).toFixed(1) : "0.0"} %`}
              accent={ytd.profit >= 0 ? "green" : "red"}
            />
          </div>
        </section>

        {/* Per-property comparison */}
        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            Por alojamento
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {perProperty.map((row) => (
              <PropertyComparisonCard key={row.property.slug} row={row} monthLabel={monthLabel(month)} />
            ))}
          </div>
        </section>

        {/* Top widgets */}
        <section className="mt-12 grid gap-4 lg:grid-cols-2">
          <TopList
            title="Top 5 reservas (sempre)"
            emoji="🏆"
            rows={topEntradas.map((e) => ({
              key: e.id,
              property: e.property,
              left: e.stayWindow ?? e.description,
              middle: ddmmyyyy(e.date),
              right: eur(e.amount),
              accent: "cyan" as const,
            }))}
          />
          <TopList
            title="Top 5 custos (sempre)"
            emoji="💸"
            rows={topCostsEntries.map((e) => ({
              key: e.id,
              property: e.property,
              left: e.description,
              middle: ddmmyyyy(e.date),
              right: `−${eur(e.amount)}`,
              accent: "rose" as const,
            }))}
          />
        </section>

        {/* Recent activity */}
        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            Actividade recente
          </h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] backdrop-blur-md">
            <table className="min-w-full divide-y divide-white/5 text-sm">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Data</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Alojamento</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Tipo</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Descrição</th>
                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recent.map((e) => (
                  <ActivityRow key={e.id} entry={e} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Integrations roadmap */}
        <IntegrationsRoadmap />
      </div>
    </div>
  );
}

function YtdTile({
  label,
  value,
  accent,
  emphasis,
}: {
  label: string;
  value: string;
  accent: "cyan" | "rose" | "green" | "red";
  emphasis?: boolean;
}) {
  const accentCls =
    accent === "cyan"
      ? "text-brand-cyan"
      : accent === "rose"
        ? "text-rose-200"
        : accent === "green"
          ? "text-emerald-300"
          : "text-rose-300";
  return (
    <div
      className={`rounded-2xl border bg-white/[0.025] p-4 backdrop-blur-md ${
        emphasis ? "border-white/20" : "border-white/10"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${accentCls} ${emphasis ? "sm:text-3xl" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function PropertyComparisonCard({
  row,
  monthLabel,
}: {
  row: {
    property: typeof PROPERTIES[number];
    month: ReturnType<typeof aggregate>;
    prev: ReturnType<typeof aggregate>;
    ytd: ReturnType<typeof aggregate>;
    count: number;
  };
  monthLabel: string;
}) {
  const { property, month, prev, ytd } = row;
  const profitDelta = month.profit - prev.profit;
  return (
    <Link
      href={`/alojamentos/${property.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] transition hover:-translate-y-0.5 hover:border-brand-cyan/40"
    >
      <div className="relative h-32 w-full overflow-hidden">
        <Image src={property.photo} alt={property.name} fill sizes="33vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-dark via-brand-navy-dark/40 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-black/45 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/90 ring-1 ring-white/15">
          {property.location}
        </span>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <h3 className="text-base font-semibold text-white">{property.name}</h3>
        <Row label={`Ganhos ${monthLabel}`} value={eur(month.revenue)} accent="cyan" />
        <Row label={`Custos ${monthLabel}`} value={eur(month.totalExpenses)} />
        <Row
          label="Profit"
          value={eur(month.profit)}
          accent={month.profit >= 0 ? "green" : "red"}
          delta={profitDelta}
        />
        <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-3 text-[11px] text-white/55">
          <span>YTD {eur(ytd.profit)}</span>
          <span className="transition group-hover:text-brand-cyan">Abrir →</span>
        </div>
      </div>
    </Link>
  );
}

function Row({
  label,
  value,
  accent,
  delta,
}: {
  label: string;
  value: string;
  accent?: "cyan" | "green" | "red";
  delta?: number;
}) {
  const accentCls =
    accent === "cyan"
      ? "text-brand-cyan"
      : accent === "green"
        ? "text-emerald-300"
        : accent === "red"
          ? "text-rose-300"
          : "text-white";
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-white/55">{label}</span>
      <span className="flex items-baseline gap-2">
        <span className={`text-sm font-semibold ${accentCls}`}>{value}</span>
        {delta !== undefined && delta !== 0 && (
          <span className={`text-[10px] ${delta > 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {eurDelta(delta)}
          </span>
        )}
      </span>
    </div>
  );
}

function TopList({
  title,
  emoji,
  rows,
}: {
  title: string;
  emoji: string;
  rows: Array<{
    key: string;
    property: string;
    left: string;
    middle: string;
    right: string;
    accent: "cyan" | "rose";
  }>;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] backdrop-blur-md">
      <header className="flex items-center gap-3 px-5 py-4">
        <span aria-hidden>{emoji}</span>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </header>
      <ul className="divide-y divide-white/5 text-sm">
        {rows.length === 0 ? (
          <li className="px-5 py-6 text-center text-xs text-white/45">Sem dados.</li>
        ) : (
          rows.map((r) => {
            const propertyName = PROPERTIES.find((p) => p.slug === r.property)?.shortName ?? r.property;
            const accent = r.accent === "cyan" ? "text-brand-cyan" : "text-rose-200";
            return (
              <li key={r.key} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-white">{r.left}</p>
                  <p className="mt-0.5 text-[11px] text-white/45">
                    {propertyName} · {r.middle}
                  </p>
                </div>
                <span className={`shrink-0 text-sm font-semibold ${accent}`}>{r.right}</span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

function ActivityRow({ entry }: { entry: PnLEntry }) {
  const propertyName =
    PROPERTIES.find((p) => p.slug === entry.property)?.shortName ?? entry.property;
  const typeLabel =
    entry.kind === "entrada" ? "Entrada" : entry.kind === "despesa" ? "Custo" : "Funcionário";
  const tone =
    entry.kind === "entrada"
      ? "text-brand-cyan"
      : entry.kind === "despesa"
        ? "text-rose-200"
        : "text-amber-200";
  const desc =
    entry.kind === "entrada" ? (entry.stayWindow ?? entry.description) : entry.description;
  const sign = entry.kind === "entrada" ? "+" : "−";
  return (
    <tr className="hover:bg-white/[0.025]">
      <td className="whitespace-nowrap px-5 py-3 text-white/65">{ddmmyyyy(entry.date)}</td>
      <td className="whitespace-nowrap px-5 py-3 text-white/75">{propertyName}</td>
      <td className="whitespace-nowrap px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-white/45">
        {typeLabel}
      </td>
      <td className="px-5 py-3 text-white">{desc}</td>
      <td className={`whitespace-nowrap px-5 py-3 text-right font-semibold ${tone}`}>
        {sign}
        {eur(entry.amount)}
      </td>
    </tr>
  );
}

function IntegrationsRoadmap() {
  return (
    <section className="mt-14 rounded-2xl border border-white/10 bg-white/[0.025] p-6 backdrop-blur-md">
      <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
        Integrações automáticas — roadmap
      </h2>
      <p className="mt-3 text-sm text-white/65">
        Estratégia para deixar de inserir reservas à mão. Três fontes a ligar
        nesta ordem:
      </p>
      <ol className="mt-4 space-y-3 text-sm">
        <Step
          num={1}
          title="Talkguest (channel manager)"
          desc="A fonte mais valiosa — agrega Airbnb, Booking e directas num só feed. Se tiverem API REST + webhooks, é só ligar e o app puxa cada nova reserva automaticamente. Precisamos do token API."
        />
        <Step
          num={2}
          title="Airbnb iCal por listing"
          desc="Cobertura mínima sem API: cada listing tem URL .ics com datas + reserva-id. Vercel Cron diário sincroniza, cria entradas como 'rascunho' (precisas confirmar valor)."
        />
        <Step
          num={3}
          title="Booking.com iCal por listing"
          desc="Mesma lógica do Airbnb. URL público por anúncio."
        />
      </ol>
      <p className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
        🔴 Para arrancar, preciso de:
        <br />· chave API do Talkguest (ou confirmação que não há e usamos iCal apenas)
        <br />· URL iCal de cada listing Airbnb (Sweet Escape 2, 5 e One For One House)
        <br />· URL iCal de cada listing Booking.com
      </p>
    </section>
  );
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-cyan/15 text-[11px] font-bold text-brand-cyan ring-1 ring-brand-cyan/30">
        {num}
      </span>
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs text-white/55">{desc}</p>
      </div>
    </li>
  );
}
