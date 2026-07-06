import Image from "next/image";
import Link from "next/link";

import { getAllProperties } from "@/lib/properties-store";
import type { Property } from "@/lib/properties";
import { getCurrentVersion } from "@/lib/changelog";
import { getAllEntries } from "@/lib/pnl-store";
import {
  aggregate,
  aggregateMonth,
  monthlyBreakdown,
} from "@/lib/pnl-math";
import { currentMonthKey, monthLabel, shiftMonth, ddmmyyyy } from "@/lib/dates";
import { eur, eurDelta } from "@/lib/money";
import type { PnLEntry, EntradaEntry } from "@/lib/pnl-types";
import { OverviewTiles } from "@/components/overview-tiles";

export const metadata = {
  title: "Visão Geral — HostPro Workspace",
};

export default async function AdminPage() {
  const [all, properties] = await Promise.all([getAllEntries(), getAllProperties()]);
  // slug → shortName lookup for the ranked lists / activity table (properties
  // are dynamic now, so we resolve names from the store snapshot).
  const nameBySlug = new Map(properties.map((p) => [p.slug, p.shortName]));
  const month = currentMonthKey();
  const prevMonth = shiftMonth(month, -1);

  const totalsMonth = aggregateMonth(all, month);
  const totalsPrev = aggregateMonth(all, prevMonth);

  const ytdYear = month.slice(0, 4);
  const ytd = aggregate(all.filter((e) => e.date.startsWith(ytdYear)));

  const perProperty = properties.map((p) => {
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

  const topCustos = [...all]
    .filter((e) => e.kind === "despesa" || e.kind === "funcionario")
    .sort((a, b) => (b as { amount: number }).amount - (a as { amount: number }).amount)
    .slice(0, 5);

  const recent = [...all]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-brand-navy-dark px-4 py-8 sm:px-10 sm:py-14">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link
              href="/"
              className="inline-flex items-center text-sm text-white/55 transition hover:text-white"
            >
              ← Início
            </Link>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
              Visão geral
            </h1>
            <p className="mt-2 text-sm text-white/55 sm:text-base">
              Operação consolidada dos {properties.length} alojamentos em{" "}
              <strong className="text-white">{monthLabel(month)}</strong> e
              acumulado de {ytdYear}.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full border border-brand-cyan/40 bg-brand-cyan/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-cyan">
              Ao vivo · v{getCurrentVersion()}
            </span>
            <div className="flex items-center gap-2">
              <Link
                href="/prospecting"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:border-brand-cyan"
              >
                <span aria-hidden>🔎</span>
                Prospecting
              </Link>
              <Link
                href="/alojamentos/novo"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-cyan px-3.5 py-1.5 text-xs font-semibold text-brand-navy shadow-[0_10px_30px_-8px_rgba(0,181,226,0.6)] transition hover:opacity-90"
              >
                <span aria-hidden>＋</span>
                Novo alojamento
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            {monthLabel(month)} · todos os alojamentos
          </h2>
          <div className="mt-4">
            <OverviewTiles totals={totalsMonth} previous={totalsPrev} />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            Acumulado de {ytdYear}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <YtdTile label={`Ganhos ${ytdYear}`} value={eur(ytd.revenue)} accent="cyan" />
            <YtdTile label={`Custos ${ytdYear}`} value={eur(ytd.totalExpenses)} accent="red" />
            <YtdTile
              label={`Lucro ${ytdYear}`}
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

        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            Por alojamento
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {perProperty.map((row) => (
              <PropertyComparisonCard
                key={row.property.slug}
                row={row}
                monthLabel={monthLabel(month)}
                year={ytdYear}
              />
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-2">
          <TopList
            title="Top 5 reservas (sempre)"
            emoji="🏆"
            nameBySlug={nameBySlug}
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
            nameBySlug={nameBySlug}
            rows={topCustos.map((e) => ({
              key: e.id,
              property: e.property,
              left: e.description,
              middle: ddmmyyyy(e.date),
              right: `−${eur(e.amount)}`,
              accent: "rose" as const,
            }))}
          />
        </section>

        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            Actividade recente
          </h2>
          {/* `overflow-x-auto` no wrapper interno para a tabela poder fazer
              scroll horizontal em mobile sem o card a clipar. */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/5 text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 sm:px-5">Data</th>
                    <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 sm:px-5">Alojamento</th>
                    <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 sm:px-5">Tipo</th>
                    <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 sm:px-5">Descrição</th>
                    <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 sm:px-5">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recent.map((e) => (
                    <ActivityRow key={e.id} entry={e} nameBySlug={nameBySlug} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

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
      : accent === "rose" || accent === "red"
        ? "text-rose-300"
        : "text-emerald-300";
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
  year,
}: {
  row: {
    property: Property;
    month: ReturnType<typeof aggregate>;
    prev: ReturnType<typeof aggregate>;
    ytd: ReturnType<typeof aggregate>;
    count: number;
  };
  monthLabel: string;
  year: string;
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
        <Row label={`Custos ${monthLabel}`} value={eur(month.totalExpenses)} accent="red" />
        <Row
          label="Lucro"
          value={eur(month.profit)}
          accent={month.profit >= 0 ? "green" : "red"}
          delta={profitDelta}
        />
        <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-3 text-[11px] text-white/55">
          <span>Lucro {year} {eur(ytd.profit)}</span>
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
  nameBySlug,
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
  nameBySlug: Map<string, string>;
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
            const propertyName = nameBySlug.get(r.property) ?? r.property;
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

function ActivityRow({
  entry,
  nameBySlug,
}: {
  entry: PnLEntry;
  nameBySlug: Map<string, string>;
}) {
  const propertyName = nameBySlug.get(entry.property) ?? entry.property;
  const typeLabel =
    entry.kind === "entrada"
      ? "Entrada"
      : entry.kind === "despesa"
        ? "Custo"
        : entry.kind === "funcionario"
          ? "Limpeza"
          : "Lavandaria";
  const tone =
    entry.kind === "entrada"
      ? "text-brand-cyan"
      : entry.kind === "despesa"
        ? "text-rose-200"
        : entry.kind === "funcionario"
          ? "text-amber-200"
          : "text-violet-200";
  const desc =
    entry.kind === "entrada" ? (entry.stayWindow ?? entry.description) : entry.description;
  const rightValue =
    entry.kind === "lavandaria"
      ? `${entry.weightKg.toLocaleString("pt-PT", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} kg`
      : `${entry.kind === "entrada" ? "+" : "−"}${eur(entry.amount)}`;
  return (
    <tr className="hover:bg-white/[0.025]">
      <td className="whitespace-nowrap px-3 py-3 text-white/65 sm:px-5">{ddmmyyyy(entry.date)}</td>
      <td className="whitespace-nowrap px-3 py-3 text-white/75 sm:px-5">{propertyName}</td>
      <td className="whitespace-nowrap px-3 py-3 text-[11px] uppercase tracking-[0.18em] text-white/45 sm:px-5">
        {typeLabel}
      </td>
      <td className="px-3 py-3 text-white sm:px-5">{desc}</td>
      <td className={`whitespace-nowrap px-3 py-3 text-right font-semibold sm:px-5 ${tone}`}>
        {rightValue}
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
        por esta ordem:
      </p>
      <ol className="mt-4 space-y-3 text-sm">
        <Step
          num={1}
          title="Talkguest (channel manager)"
          desc="A fonte mais valiosa — agrega Airbnb, Booking e directas num só feed. Se tiverem API REST e webhooks, é só ligar e o app puxa cada nova reserva automaticamente. Precisamos do token da API."
        />
        <Step
          num={2}
          title="Airbnb iCal por listing"
          desc="Cobertura mínima sem API: cada listing tem URL .ics com datas + reserva-id. Vercel Cron diário sincroniza, cria entradas como rascunho (precisas confirmar o valor)."
        />
        <Step
          num={3}
          title="Booking.com iCal por listing"
          desc="Mesma lógica do Airbnb. URL público por anúncio."
        />
      </ol>
      <p className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
        🔴 Para arrancar, preciso de:
        <br />· chave da API do Talkguest (ou confirmação que não há e usamos só iCal)
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
