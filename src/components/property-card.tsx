import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/lib/properties";
import { ddmmyyyy } from "@/lib/dates";

export function PropertyCard({
  property,
  hasData,
  monthLabel,
  monthRevenue,
  monthExpenses,
  monthProfit,
  monthProfitPositive,
  monthLavandariaKg,
  ytdRevenue,
  ytdProfit,
  ytdProfitPositive,
  reservasYtd,
  lastActivity,
  year,
}: {
  property: Property;
  hasData: boolean;
  monthLabel: string;
  monthRevenue: string;
  monthExpenses: string;
  monthProfit: string;
  monthProfitPositive: boolean;
  monthLavandariaKg: string;
  ytdRevenue: string;
  ytdProfit: string;
  ytdProfitPositive: boolean;
  reservasYtd: number;
  lastActivity?: string;
  year: string;
}) {
  return (
    <Link
      href={`/alojamentos/${property.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-0.5 hover:border-brand-cyan/50 hover:bg-white/[0.05]"
    >
      <div className="relative h-36 w-full overflow-hidden sm:h-44">
        <Image
          src={property.photo}
          alt={property.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-dark via-brand-navy-dark/30 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-black/45 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 ring-1 ring-white/15">
          {property.location}
        </span>
        {!hasData && (
          <span className="absolute right-3 top-3 rounded-full border border-amber-300/30 bg-amber-300/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-100">
            Sem dados
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-4 sm:px-5">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-white sm:text-lg">
            {property.name}
          </h3>
          {lastActivity && (
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-white/40">
              Última actividade · {ddmmyyyy(lastActivity)}
            </p>
          )}
        </div>

        {/* Mês actual — 4 KPIs in a 2×2 grid, with the colour-coding Andre
            asked for: ganhos verde, custos vermelho, lucro segue o sinal. */}
        <section>
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/45">
            {monthLabel}
          </p>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <Mini label="Ganhos" value={hasData ? monthRevenue : "—"} tone="green" />
            <Mini label="Custos" value={hasData ? monthExpenses : "—"} tone="red" />
            <Mini
              label="Lucro"
              value={hasData ? monthProfit : "—"}
              tone={hasData ? (monthProfitPositive ? "green" : "red") : "neutral"}
            />
            <Mini
              label="Lavandaria"
              value={hasData ? monthLavandariaKg : "—"}
              tone="neutral"
            />
          </div>
        </section>

        {/* YTD strip — same colour rules. */}
        <section>
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/45">
            {year} · YTD
          </p>
          <div className="mt-1.5 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-2.5">
            <YtdMini label="Ganhos" value={hasData ? ytdRevenue : "—"} tone="green" />
            <YtdMini
              label="Lucro"
              value={hasData ? ytdProfit : "—"}
              tone={hasData ? (ytdProfitPositive ? "green" : "red") : "neutral"}
            />
            <YtdMini
              label="Reservas"
              value={hasData ? String(reservasYtd) : "—"}
              tone="neutral"
            />
          </div>
        </section>

        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-white/45 transition group-hover:text-brand-cyan">
            Abrir página
          </span>
          <span
            aria-hidden
            className="text-white/45 transition group-hover:translate-x-0.5 group-hover:text-brand-cyan"
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

type Tone = "green" | "red" | "neutral";

function toneClass(tone: Tone): string {
  return tone === "green"
    ? "text-emerald-300"
    : tone === "red"
      ? "text-rose-300"
      : "text-white";
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>
      <p
        className={`mt-1 truncate text-sm font-semibold tracking-tight tabular-nums ${toneClass(tone)}`}
      >
        {value}
      </p>
    </div>
  );
}

function YtdMini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[8.5px] font-semibold uppercase tracking-[0.16em] text-white/40">
        {label}
      </p>
      <p
        className={`mt-0.5 truncate text-xs font-semibold tabular-nums ${toneClass(tone)}`}
      >
        {value}
      </p>
    </div>
  );
}
