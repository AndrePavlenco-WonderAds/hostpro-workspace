import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/lib/properties";
import { ddmmyyyy } from "@/lib/dates";

export function PropertyCard({
  property,
  hasData,
  monthRevenue,
  monthProfit,
  ytdRevenue,
  ytdProfit,
  reservasYtd,
  lastActivity,
  year,
}: {
  property: Property;
  hasData: boolean;
  monthRevenue: string;
  monthProfit: string;
  ytdRevenue: string;
  ytdProfit: string;
  reservasYtd: number;
  lastActivity?: string;
  year: string;
}) {
  return (
    <Link
      href={`/alojamentos/${property.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-0.5 hover:border-brand-cyan/50 hover:bg-white/[0.05]"
    >
      {/* Photo — smaller than before so the card data takes priority. */}
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

        {/* Mês actual — 2 mini KPIs */}
        <div className="grid grid-cols-2 gap-2">
          <Mini label="Ganhos / mês" value={hasData ? monthRevenue : "—"} accent="cyan" />
          <Mini label="Lucro / mês" value={hasData ? monthProfit : "—"} />
        </div>

        {/* YTD strip */}
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-2.5">
          <YtdMini label={`Ganhos ${year}`} value={hasData ? ytdRevenue : "—"} accent="cyan" />
          <YtdMini label={`Lucro ${year}`} value={hasData ? ytdProfit : "—"} />
          <YtdMini label="Reservas" value={hasData ? String(reservasYtd) : "—"} />
        </div>

        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-white/45 transition group-hover:text-brand-cyan">
            Abrir página
          </span>
          <span aria-hidden className="text-white/45 transition group-hover:text-brand-cyan group-hover:translate-x-0.5">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

function Mini({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "cyan";
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-semibold tracking-tight tabular-nums ${
          accent === "cyan" ? "text-brand-cyan" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function YtdMini({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "cyan";
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[8.5px] font-semibold uppercase tracking-[0.16em] text-white/40">
        {label}
      </p>
      <p
        className={`mt-0.5 truncate text-xs font-semibold tabular-nums ${
          accent === "cyan" ? "text-brand-cyan" : "text-white/85"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
