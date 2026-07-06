import Link from "next/link";
import { getAllProspects } from "@/lib/prospecting/store";
import { applyOverrides } from "@/lib/prospecting/audit";
import { ddmmyyyy } from "@/lib/dates";

export const metadata = { title: "Prospecting — HostPro Workspace" };

export default async function ProspectingPage() {
  const prospects = await getAllProspects();

  return (
    <div className="min-h-screen bg-brand-navy-dark px-4 py-8 sm:px-10 sm:py-14">
      <div className="mx-auto w-full max-w-4xl">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link href="/" className="inline-flex items-center text-sm text-white/55 transition hover:text-white">
              ← Início
            </Link>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
              Prospecting
            </h1>
            <p className="mt-2 text-sm text-white/55 sm:text-base">
              Audita o listing de um potencial cliente e gera um relatório para lhe enviar.
            </p>
          </div>
          <Link
            href="/prospecting/novo"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-cyan px-4 py-2 text-sm font-semibold text-brand-navy shadow-[0_10px_30px_-8px_rgba(0,181,226,0.6)] transition hover:opacity-90"
          >
            <span aria-hidden>＋</span> Nova análise
          </Link>
        </header>

        <div className="mt-8 space-y-3">
          {prospects.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center text-sm text-white/55">
              Ainda sem análises. Começa com <span className="text-brand-cyan">＋ Nova análise</span>.
            </div>
          ) : (
            prospects.map((p) => {
              const audit = applyOverrides(p.audit, p.overrides);
              const tone = audit.score >= 70 ? "text-emerald-300" : audit.score >= 40 ? "text-amber-300" : "text-rose-300";
              return (
                <Link
                  key={p.id}
                  href={`/prospecting/${p.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-brand-cyan/50 hover:bg-white/[0.05]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                    <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-white/40">
                      {p.platform} · {ddmmyyyy(p.createdAt)} · {audit.failCount} a melhorar
                    </p>
                  </div>
                  <span className={`shrink-0 text-lg font-bold tabular-nums ${tone}`}>{audit.score}</span>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
