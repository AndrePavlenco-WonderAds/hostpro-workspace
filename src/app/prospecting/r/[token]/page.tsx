import { notFound } from "next/navigation";
import { getProspectByToken } from "@/lib/prospecting/store";
import { applyOverrides } from "@/lib/prospecting/audit";
import { ddmmyyyy } from "@/lib/dates";
import { PrintButton } from "@/components/prospecting/print-button";

export const metadata = {
  title: "Auditoria de Listing — HostPro",
  robots: { index: false, follow: false },
};

const NAVY = "#203247";
const CYAN = "#00B5E2";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const p = await getProspectByToken(token);
  if (!p) notFound();

  const audit = applyOverrides(p.audit, p.overrides);
  const opportunities = audit.categories
    .map((c) => ({ label: c.label, items: c.items.filter((i) => i.status === "fail") }))
    .filter((c) => c.items.length > 0);
  const strengths = audit.categories.flatMap((c) => c.items.filter((i) => i.status === "pass"));

  const verdict =
    audit.score >= 70
      ? "O seu listing já está sólido — com uns ajustes finos passa a topo de mercado."
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
              @page { size: A4; margin: 14mm; }
              html, body { background: #fff !important; }
              .no-print { display: none !important; }
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

      <div className="mx-auto w-full max-w-3xl px-6 py-10 sm:px-10">
        {/* Cabeçalho */}
        <header className="flex items-center justify-between gap-4 border-b pb-6" style={{ borderColor: "#e5e5df" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hostpro-logo.png" alt="HostPro" className="h-9 w-auto" />
          <div className="text-right text-xs" style={{ color: "#6b7280" }}>
            <p>Auditoria de Listing</p>
            <p>{ddmmyyyy(p.createdAt)}</p>
          </div>
        </header>

        {/* Hero */}
        <section className="mt-8 flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{p.name}</h1>
            <p className="mt-1 text-sm capitalize" style={{ color: "#6b7280" }}>
              {p.platform}
            </p>
            <p className="mt-4 max-w-md text-sm" style={{ color: "#374151" }}>{verdict}</p>
          </div>
          <ScoreBadge score={audit.score} />
        </section>

        <div className="mt-6 flex gap-3 text-center text-sm">
          <Pill n={strengths.length} label="pontos fortes" color="#16a34a" />
          <Pill n={audit.failCount} label="oportunidades" color={CYAN} />
        </div>

        {/* Oportunidades de melhoria */}
        {opportunities.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold" style={{ color: NAVY }}>
              Oportunidades de melhoria
            </h2>
            <div className="mt-4 space-y-6">
              {opportunities.map((cat) => (
                <div key={cat.label} style={{ breakInside: "avoid" }}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: CYAN }}>
                    {cat.label}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {cat.items.map((it) => (
                      <li key={it.id} className="rounded-lg border p-3" style={{ borderColor: "#e5e5df", background: "#fafaf8" }}>
                        <p className="text-sm font-semibold" style={{ color: NAVY }}>{it.label}</p>
                        {it.recommendation && (
                          <p className="mt-1 text-sm" style={{ color: "#4b5563" }}>{it.recommendation}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pontos fortes */}
        {strengths.length > 0 && (
          <section className="mt-10" style={{ breakInside: "avoid" }}>
            <h2 className="text-lg font-bold" style={{ color: NAVY }}>O que já está bem</h2>
            <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {strengths.map((it) => (
                <li key={it.id} className="flex items-start gap-2 text-sm" style={{ color: "#374151" }}>
                  <span style={{ color: "#16a34a" }}>✓</span> {it.label}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA */}
        <section
          className="mt-12 rounded-2xl p-6 text-center"
          style={{ background: NAVY, color: "#ffffff", breakInside: "avoid" }}
        >
          <p className="text-lg font-bold">A HostPro trata de tudo isto por si.</p>
          <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "#c7d0d9" }}>
            Gestão completa do seu alojamento local na Costa do Estoril — listing, fotos,
            preços dinâmicos, automação e operações.
          </p>
          <p className="mt-4 text-sm font-semibold" style={{ color: CYAN }}>
            hostpro.pt@gmail.com
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-[0.22em]" style={{ color: "#8b97a3" }}>
            With you all over Portugal
          </p>
        </section>
      </div>
    </main>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#d97706" : "#dc2626";
  return (
    <div
      className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-4"
      style={{ borderColor: color }}
    >
      <span className="text-3xl font-extrabold tabular-nums" style={{ color }}>{score}</span>
      <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: "#6b7280" }}>/ 100</span>
    </div>
  );
}

function Pill({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div className="rounded-lg border px-4 py-2" style={{ borderColor: "#e5e5df" }}>
      <span className="text-lg font-bold tabular-nums" style={{ color }}>{n}</span>{" "}
      <span className="text-sm" style={{ color: "#6b7280" }}>{label}</span>
    </div>
  );
}
