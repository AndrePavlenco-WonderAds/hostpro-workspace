import { notFound } from "next/navigation";
import { getProspectByToken } from "@/lib/prospecting/store";
import { applyOverrides } from "@/lib/prospecting/audit";
import { ddmmyyyy } from "@/lib/dates";
import { PrintButton } from "@/components/prospecting/print-button";
import type { Priority } from "@/lib/prospecting/types";

export const metadata = {
  title: "Auditoria de Listing — HostPro",
  robots: { index: false, follow: false },
};

const NAVY = "#203247";
const CYAN = "#00B5E2";

const PRANK: Record<Priority, number> = { alta: 0, media: 1, baixa: 2 };
const PRIO: Record<Priority, { label: string; color: string; bg: string }> = {
  alta: { label: "Crítico", color: "#dc2626", bg: "#fef2f2" },
  media: { label: "Importante", color: "#d97706", bg: "#fffbeb" },
  baixa: { label: "Menor", color: "#0891b2", bg: "#ecfeff" },
};

export default async function ReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const p = await getProspectByToken(token);
  if (!p) notFound();

  const audit = applyOverrides(p.audit, p.overrides);

  // Oportunidades ordenadas por gravidade → roadmap prioritizado.
  const opportunities = audit.categories
    .map((c) => {
      const items = c.items.filter((i) => i.status === "fail");
      const priority = items
        .map((i) => i.priority ?? "media")
        .sort((a, b) => PRANK[a] - PRANK[b])[0] ?? "media";
      return { label: c.label, items, priority };
    })
    .filter((c) => c.items.length > 0)
    .sort((a, b) => PRANK[a.priority] - PRANK[b.priority]);

  const criticalCount = audit.categories
    .flatMap((c) => c.items)
    .filter((i) => i.status === "fail" && (i.priority ?? "media") === "alta").length;

  const strengths = audit.categories.flatMap((c) => c.items.filter((i) => i.status === "pass"));
  const clientNotes = (p.clientNotes ?? "").trim();

  const verdict =
    audit.score >= 70
      ? "O seu anúncio já está sólido — com uns ajustes finos passa a topo de mercado."
      : audit.score >= 40
        ? "Há uma base boa, mas várias oportunidades claras para aumentar reservas e receita."
        : "Há margem significativa para otimizar — o potencial de crescimento é grande.";

  return (
    <main
      style={{ background: "#ffffff", color: NAVY, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
      className="min-h-screen"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { size: A4; margin: 10mm; }
              html, body { background: #fff !important; }
              .no-print { display: none !important; }
              .avoid-break { break-inside: avoid; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          `,
        }}
      />

      {/* Barra de ações (não imprime) */}
      <div className="no-print flex items-center justify-between gap-3 border-b border-black/10 px-5 py-3">
        <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: NAVY }}>
          Relatório HostPro
        </span>
        <PrintButton />
      </div>

      <div className="mx-auto w-full max-w-2xl px-5 py-6 sm:px-8">
        {/* Cabeçalho */}
        <header className="flex items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "#e5e5df" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hostpro-logo.png" alt="HostPro" className="h-8 w-auto" />
          <div className="text-right text-[11px]" style={{ color: "#6b7280" }}>
            <p>Auditoria de Anúncio</p>
            <p>{ddmmyyyy(p.createdAt)}</p>
          </div>
        </header>

        {/* Hero */}
        <section className="mt-5 flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{p.name}</h1>
            <p className="mt-0.5 text-sm capitalize" style={{ color: "#6b7280" }}>{p.platform}</p>
            <p className="mt-3 max-w-md text-sm" style={{ color: "#374151" }}>{verdict}</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Pill n={strengths.length} label="pontos fortes" color="#16a34a" />
              <Pill n={audit.failCount} label="a melhorar" color={CYAN} />
              {criticalCount > 0 && <Pill n={criticalCount} label="críticos" color="#dc2626" />}
            </div>
          </div>
          <ScoreBadge score={audit.score} />
        </section>

        {/* Oportunidades de melhoria — roadmap prioritizado */}
        {opportunities.length > 0 && (
          <section className="mt-8">
            <div
              className="rounded-2xl p-4 sm:p-6"
              style={{ background: "#f0fbfe", border: `1px solid ${CYAN}33`, borderLeft: `6px solid ${CYAN}` }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl" style={{ color: NAVY }}>
                    Plano de melhorias
                  </h2>
                  <p className="mt-0.5 text-sm" style={{ color: "#4b5563" }}>
                    Priorizado por impacto nas reservas e na receita.
                  </p>
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-extrabold"
                  style={{ background: "#dc2626", color: "#fff" }}
                >
                  <span aria-hidden>⚠</span> {audit.failCount} a corrigir
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {opportunities.map((cat) => {
                  const prio = PRIO[cat.priority];
                  return (
                    <div key={cat.label} className="avoid-break">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: NAVY }}>
                          {cat.label}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{ background: prio.bg, color: prio.color, border: `1px solid ${prio.color}44` }}
                        >
                          {prio.label}
                        </span>
                      </div>
                      <ul className="mt-2 space-y-2">
                        {cat.items.map((it) => {
                          const ip = PRIO[it.priority ?? "media"];
                          return (
                            <li
                              key={it.id}
                              className="flex items-start gap-3 rounded-xl border bg-white p-3"
                              style={{ borderColor: "#e2e8ec", boxShadow: "0 1px 2px rgba(16,24,40,0.04)" }}
                            >
                              <span
                                className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ background: ip.color }}
                                aria-hidden
                              />
                              <div className="min-w-0">
                                <p className="text-[15px] font-bold leading-snug" style={{ color: NAVY }}>
                                  {it.label}
                                </p>
                                {it.recommendation && (
                                  <p className="mt-0.5 text-sm leading-snug" style={{ color: "#4b5563" }}>
                                    {it.recommendation}
                                  </p>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Plano de ação da HostPro (notas para o cliente) */}
        {clientNotes && (
          <section className="mt-6 avoid-break">
            <div className="rounded-2xl p-4 sm:p-6" style={{ background: NAVY, color: "#fff" }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: CYAN }}>
                O que a HostPro faz por si
              </p>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed" style={{ color: "#e8edf1" }}>
                {clientNotes}
              </p>
            </div>
          </section>
        )}

        {/* Pontos fortes */}
        {strengths.length > 0 && (
          <section className="mt-6 avoid-break">
            <h2 className="text-lg font-bold" style={{ color: NAVY }}>O que já está bem</h2>
            <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
              {strengths.map((it) => (
                <li key={it.id} className="flex items-start gap-2 text-sm" style={{ color: "#374151" }}>
                  <span style={{ color: "#16a34a" }}>✓</span> {it.label}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA */}
        <section className="mt-8 rounded-2xl p-6 text-center avoid-break" style={{ background: NAVY, color: "#ffffff" }}>
          <p className="text-lg font-bold">A HostPro trata de tudo isto por si.</p>
          <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "#c7d0d9" }}>
            Gestão completa do seu alojamento local de Cascais a Lisboa — anúncio, fotos,
            preços dinâmicos, automação e operações.
          </p>
        </section>

        {/* Assinatura do consultor */}
        <section className="mt-6 flex items-center gap-4 avoid-break">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/team/andre-pavlenco.jpg"
            alt="André Pavlenco"
            className="h-16 w-16 shrink-0 rounded-full object-cover"
            style={{ border: `2px solid ${CYAN}` }}
          />
          <div>
            <p className="text-[15px] font-extrabold" style={{ color: NAVY }}>André Pavlenco</p>
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: CYAN }}>
              Consultor HostPro
            </p>
            <p className="mt-1 text-sm" style={{ color: "#4b5563" }}>
              hostpro.pt@gmail.com · 936 535 306
            </p>
          </div>
        </section>

        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.22em]" style={{ color: "#9ca3af" }}>
          HostPro · With you all over Portugal
        </p>
      </div>
    </main>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#d97706" : "#dc2626";
  return (
    <div
      className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4"
      style={{ borderColor: color }}
    >
      <span className="text-3xl font-extrabold tabular-nums" style={{ color }}>{score}</span>
      <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: "#6b7280" }}>/ 100</span>
    </div>
  );
}

function Pill({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div className="rounded-lg border px-3 py-1.5" style={{ borderColor: "#e5e5df" }}>
      <span className="text-base font-bold tabular-nums" style={{ color }}>{n}</span>{" "}
      <span className="text-xs" style={{ color: "#6b7280" }}>{label}</span>
    </div>
  );
}
