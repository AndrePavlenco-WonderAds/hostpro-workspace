import Link from "next/link";
import { notFound } from "next/navigation";
import { getProspect } from "@/lib/prospecting/store";
import { applyOverrides } from "@/lib/prospecting/audit";
import { AuditWorkspace } from "@/components/prospecting/audit-workspace";

export const metadata = { title: "Análise — HostPro Workspace" };

export default async function ProspectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getProspect(id);
  if (!p) notFound();

  const audit = applyOverrides(p.audit, p.overrides);

  return (
    <div className="min-h-screen bg-brand-navy-dark px-4 py-8 sm:px-10 sm:py-14">
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/prospecting" className="inline-flex items-center text-sm text-white/55 transition hover:text-white">
          ← Prospecting
        </Link>

        <div className="mt-4">
          <AuditWorkspace
            id={p.id}
            name={p.name}
            url={p.url}
            publicToken={p.publicToken}
            operatorNotes={p.operatorNotes}
            clientNotes={p.clientNotes ?? ""}
            listing={p.listing}
            categories={audit.categories}
            score={audit.score}
            passCount={audit.passCount}
            failCount={audit.failCount}
            manualCount={audit.manualCount}
          />
        </div>

        {/* Resumo do que foi lido */}
        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            O que foi lido do listing
          </h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat label="Fotos" value={p.listing.photoCount ?? p.listing.photos.length} />
            <Stat label="Amenidades" value={p.listing.amenities.length} />
            <Stat label="Rating" value={p.listing.rating ?? "—"} />
            <Stat label="Fonte" value={p.listing.source === "scrape" ? "Automático" : "Colado"} />
          </dl>
          {p.listing.title && (
            <p className="mt-4 text-sm text-white/80">
              <span className="text-white/45">Título: </span>
              {p.listing.title}
            </p>
          )}
          {p.listing.description && (
            <p className="mt-2 line-clamp-4 text-xs text-white/55">{p.listing.description}</p>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}
