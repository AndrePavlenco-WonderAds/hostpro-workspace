import Image from "next/image";
import Link from "next/link";
import type { Property } from "@/lib/properties";

export function PropertyCard({
  property,
  monthRevenue,
  monthProfit,
  hasData,
}: {
  property: Property;
  monthRevenue: string;
  monthProfit: string;
  hasData: boolean;
}) {
  return (
    <Link
      href={`/alojamentos/${property.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] transition hover:-translate-y-0.5 hover:border-brand-cyan/50"
    >
      <div className="relative h-48 w-full overflow-hidden sm:h-56">
        <Image
          src={property.photo}
          alt={property.name}
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-dark via-brand-navy-dark/30 to-transparent" />
        <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 ring-1 ring-white/15">
          {property.location}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 py-4">
        <h3 className="text-lg font-semibold tracking-tight text-white">
          {property.name}
        </h3>

        <div className="mt-1 grid grid-cols-2 gap-2">
          <Mini label="Ganhos / mês" value={hasData ? monthRevenue : "—"} accent="cyan" />
          <Mini label="Profit / mês" value={hasData ? monthProfit : "—"} />
        </div>

        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="text-white/45 transition group-hover:text-white">
            Abrir página →
          </span>
          {!hasData && (
            <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
              Sem dados
            </span>
          )}
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
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-semibold tracking-tight ${
          accent === "cyan" ? "text-brand-cyan" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
