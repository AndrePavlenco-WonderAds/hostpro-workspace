import { notFound } from "next/navigation";
import { getProspectByToken } from "@/lib/prospecting/store";
import { applyOverrides } from "@/lib/prospecting/audit";
import { resolveGeo } from "@/lib/prospecting/geo";
import { ddmmyyyy } from "@/lib/dates";
import { ReportGlobe } from "@/components/prospecting/report-globe";
import { ReportActions } from "@/components/prospecting/report-actions";
import type { Priority } from "@/lib/prospecting/types";

export const metadata = {
  title: "Auditoria de Listing — HostPro",
  robots: { index: false, follow: false },
};

const NAVY = "#203247";
const NAVY_DARK = "#142030";
const CYAN = "#00B5E2";

const PRANK: Record<Priority, number> = { alta: 0, media: 1, baixa: 2 };
const PRIO: Record<Priority, { label: string; color: string; bg: string }> = {
  alta: { label: "Crítico", color: "#dc2626", bg: "#fef2f2" },
  media: { label: "Importante", color: "#d97706", bg: "#fffbeb" },
  baixa: { label: "Menor", color: "#0891b2", bg: "#ecfeff" },
};

function healthColor(ratio: number): string {
  return ratio >= 0.7 ? "#16a34a" : ratio >= 0.4 ? "#d97706" : "#dc2626";
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const p = await getProspectByToken(token);
  if (!p) notFound();

  const audit = applyOverrides(p.audit, p.overrides);
  const geo = resolveGeo(p.listing.location, p.name);

  // Oportunidades ordenadas por gravidade → roadmap prioritizado.
  const opportunities = audit.categories
    .map((c) => {
      const items = c.items.filter((i) => i.status === "fail");
      const priority =
        items.map((i) => i.priority ?? "media").sort((a, b) => PRANK[a] - PRANK[b])[0] ?? "media";
      return { label: c.label, items, priority };
    })
    .filter((c) => c.items.length > 0)
    .sort((a, b) => PRANK[a.priority] - PRANK[b.priority]);

  const criticalCount = audit.categories
    .flatMap((c) => c.items)
    .filter((i) => i.status === "fail" && (i.priority ?? "media") === "alta").length;

  const strengths = audit.categories.flatMap((c) => c.items.filter((i) => i.status === "pass"));
  const clientNotes = (p.clientNotes ?? "").trim();

  // Desempenho por categoria — barras estilo dashboard.
  const categoryPerf = audit.categories
    .map((c) => {
      const pass = c.items.filter((i) => i.status === "pass").length;
      const fail = c.items.filter((i) => i.status === "fail").length;
      const manual = c.items.filter((i) => i.status === "manual").length;
      const evaluated = pass + fail;
      return { label: c.label, pass, fail, manual, evaluated, ratio: evaluated ? pass / evaluated : 0 };
    })
    .filter((c) => c.evaluated > 0)
    .sort((a, b) => a.ratio - b.ratio);

  const verdict =
    audit.score >= 70
      ? "O seu anúncio já está sólido — com uns ajustes finos passa a topo de mercado."
      : audit.score >= 40
        ? "Há uma base boa, mas várias oportunidades claras para aumentar reservas e receita."
        : "Há margem significativa para otimizar — o potencial de crescimento é grande.";

  const scoreColor = audit.score >= 70 ? "#16a34a" : audit.score >= 40 ? "#d97706" : "#dc2626";

  return (
    <main style={{ background: "#ffffff", color: NAVY }} className="min-h-screen">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .print-only { display: none; }
            @keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
            .rise { animation: rise 0.7s cubic-bezier(0.22,1,0.36,1) both; }
            @media print {
              @page { size: A4 portrait; margin: 12mm; }
              html, body { background: #fff !important; }
              .no-print { display: none !important; }
              .print-only { display: block !important; }
              .avoid-break { break-inside: avoid; }
              .rise { animation: none !important; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          `,
        }}
      />

      {/* ======================= LIVE / WEB VERSION ======================= */}

      {/* Barra de ações fixa (não imprime) */}
      <header
        className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 px-5 py-3 sm:px-8"
        style={{ background: NAVY_DARK, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hostpro-logo-white.png" alt="HostPro" className="h-6 w-auto" />
          <span className="hidden text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50 sm:inline">
            Auditoria de Anúncio
          </span>
        </div>
        <ReportActions />
      </header>

      {/* HERO com globo (só ecrã) */}
      <section
        className="no-print relative overflow-hidden px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14"
        style={{
          background: `radial-gradient(1200px 600px at 80% -10%, rgba(0,181,226,0.18), transparent 55%), linear-gradient(180deg, ${NAVY_DARK} 0%, ${NAVY} 100%)`,
        }}
      >
        {/* estrelas subtis */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 70% 20%, rgba(255,255,255,0.4), transparent), radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 85% 60%, rgba(255,255,255,0.35), transparent), radial-gradient(1px 1px at 55% 45%, rgba(255,255,255,0.3), transparent)",
          }}
        />
        <div className="relative mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
          <div className="rise">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-cyan">
              Auditoria de Anúncio · {p.platform} · {ddmmyyyy(p.createdAt)}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              {p.name}
            </h1>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-white/70">
              <PinIcon /> {geo.place} · de Cascais a Lisboa
            </p>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/80">{verdict}</p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <HeroChip n={strengths.length} label="pontos fortes" color="#4ade80" />
              <HeroChip n={audit.failCount} label="a melhorar" color={CYAN} />
              {criticalCount > 0 && <HeroChip n={criticalCount} label="críticos" color="#f87171" />}
            </div>
          </div>

          <div className="relative flex flex-col items-center gap-5">
            <ReportGlobe lat={geo.lat} lng={geo.lng} place={geo.place} />
            <div
              className="flex items-center gap-3 rounded-2xl border px-5 py-3 backdrop-blur"
              style={{ borderColor: "rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)" }}
            >
              <span className="text-4xl font-extrabold tabular-nums" style={{ color: scoreColor }}>
                {audit.score}
              </span>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                  Índice de otimização
                </p>
                <p className="text-xs font-semibold text-white/80">de 100 pontos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================= PRINT HEADER (só impressão) ======================= */}
      <section className="print-only" style={{ borderBottom: `2px solid ${CYAN}`, paddingBottom: 14, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hostpro-logo.png" alt="HostPro" style={{ height: 32, width: "auto" }} />
          <div style={{ textAlign: "right", fontSize: 11, color: "#6b7280" }}>
            <p>Auditoria de Anúncio · {p.platform}</p>
            <p>{ddmmyyyy(p.createdAt)}</p>
          </div>
        </div>
        <div style={{ marginTop: 12, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: NAVY }}>{p.name}</h1>
            <p style={{ marginTop: 2, fontSize: 12, color: "#6b7280" }}>📍 {geo.place} · de Cascais a Lisboa</p>
            <p style={{ marginTop: 8, maxWidth: 420, fontSize: 13, color: "#374151" }}>{verdict}</p>
          </div>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, color: scoreColor }}>{audit.score}</div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9ca3af" }}>de 100</div>
          </div>
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 18, fontSize: 12, color: "#374151" }}>
          <span><strong style={{ color: "#16a34a" }}>{strengths.length}</strong> pontos fortes</span>
          <span><strong style={{ color: CYAN }}>{audit.failCount}</strong> a melhorar</span>
          {criticalCount > 0 && <span><strong style={{ color: "#dc2626" }}>{criticalCount}</strong> críticos</span>}
        </div>
      </section>

      {/* ======================= CORPO (partilhado ecrã + impressão) ======================= */}
      <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 print:px-0 print:py-0">
        {/* --- Painel de desempenho estilo dashboard --- */}
        <section className="rise">
          <SectionTitle eyebrow="Diagnóstico" title="Como está o seu anúncio" />
          <div className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr]">
            {/* Donut do score */}
            <div
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border p-5"
              style={{ borderColor: "#e6eaed", background: "#fbfcfd" }}
            >
              <DonutScore score={audit.score} color={scoreColor} />
              <p className="text-xs font-semibold" style={{ color: "#6b7280" }}>
                Índice de otimização
              </p>
            </div>

            {/* Tiles */}
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Pontos fortes" value={strengths.length} color="#16a34a" hint="já bem feitos" />
              <StatTile label="A melhorar" value={audit.failCount} color={CYAN} hint="oportunidades" />
              <StatTile label="Críticos" value={criticalCount} color="#dc2626" hint="prioridade máxima" />
              <StatTile label="Por confirmar" value={audit.manualCount} color="#6b7280" hint="análise HostPro" />
            </div>
          </div>

          {/* Barras por categoria */}
          {categoryPerf.length > 0 && (
            <div
              className="mt-4 rounded-2xl border p-5"
              style={{ borderColor: "#e6eaed", background: "#fbfcfd" }}
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "#6b7280" }}>
                Desempenho por área
              </p>
              <div className="mt-4 space-y-3.5">
                {categoryPerf.map((c) => (
                  <CategoryBar key={c.label} {...c} />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* --- Roadmap de melhorias --- */}
        {opportunities.length > 0 && (
          <section className="mt-10 rise">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle eyebrow="Plano de ação" title="Oportunidades de melhoria" />
              <span
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-extrabold"
                style={{ background: "#dc2626", color: "#fff" }}
              >
                <span aria-hidden>⚠</span> {audit.failCount} a corrigir
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {opportunities.map((cat, ci) => {
                const prio = PRIO[cat.priority];
                return (
                  <div
                    key={cat.label}
                    className="avoid-break overflow-hidden rounded-2xl border"
                    style={{ borderColor: "#e6eaed" }}
                  >
                    <div
                      className="flex items-center justify-between gap-2 px-4 py-3"
                      style={{ background: prio.bg, borderBottom: `1px solid ${prio.color}22` }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                          style={{ background: prio.color }}
                        >
                          {ci + 1}
                        </span>
                        <span className="text-sm font-bold" style={{ color: NAVY }}>
                          {cat.label}
                        </span>
                      </div>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{ background: "#fff", color: prio.color, border: `1px solid ${prio.color}55` }}
                      >
                        {prio.label}
                      </span>
                    </div>
                    <ul className="divide-y" style={{ borderColor: "#eef1f3" }}>
                      {cat.items.map((it) => {
                        const ip = PRIO[it.priority ?? "media"];
                        return (
                          <li key={it.id} className="flex items-start gap-3 px-4 py-3">
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
          </section>
        )}

        {/* --- Plano da HostPro (notas para o cliente) --- */}
        {clientNotes && (
          <section className="mt-10 avoid-break rise">
            <div
              className="overflow-hidden rounded-2xl p-6"
              style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DARK} 100%)` }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: CYAN }}>
                O que a HostPro faz por si
              </p>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed" style={{ color: "#e8edf1" }}>
                {clientNotes}
              </p>
            </div>
          </section>
        )}

        {/* --- Pontos fortes --- */}
        {strengths.length > 0 && (
          <section className="mt-10 avoid-break rise">
            <SectionTitle eyebrow="Já conquistado" title="O que já está bem" />
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {strengths.map((it) => (
                <li
                  key={it.id}
                  className="flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm"
                  style={{ borderColor: "#e6eaed", background: "#f6fdf9", color: "#374151" }}
                >
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: "#16a34a" }}
                  >
                    ✓
                  </span>
                  {it.label}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* --- CTA --- */}
        <section
          className="mt-10 avoid-break overflow-hidden rounded-2xl p-8 text-center"
          style={{ background: `radial-gradient(600px 300px at 50% -20%, rgba(0,181,226,0.25), transparent), ${NAVY}` }}
        >
          <p className="text-xl font-extrabold text-white">A HostPro trata de tudo isto por si.</p>
          <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "#c7d0d9" }}>
            Gestão completa do seu alojamento local de Cascais a Lisboa — anúncio, fotos, preços
            dinâmicos, automação e operações.
          </p>
          <a
            href="tel:+351936535306"
            className="no-print mt-5 inline-flex items-center gap-2 rounded-full bg-brand-cyan px-6 py-2.5 text-sm font-bold text-brand-navy transition hover:opacity-90"
          >
            Falar com a HostPro →
          </a>
        </section>

        {/* --- Assinatura do consultor --- */}
        <section
          className="mt-8 avoid-break flex items-center gap-4 rounded-2xl border p-5"
          style={{ borderColor: "#e6eaed", background: "#fbfcfd" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/team/andre-pavlenco.jpg"
            alt="André Pavlenco"
            className="h-16 w-16 shrink-0 rounded-full object-cover"
            style={{ border: `2px solid ${CYAN}` }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-extrabold" style={{ color: NAVY }}>
              André Pavlenco
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: CYAN }}>
              Consultor HostPro
            </p>
            <p className="mt-1 text-sm" style={{ color: "#4b5563" }}>
              hostpro.pt@gmail.com · 936 535 306
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hostpro-logo.png" alt="" className="hidden h-7 w-auto opacity-70 sm:block" />
        </section>

        <p
          className="mt-6 text-center text-[10px] uppercase tracking-[0.22em]"
          style={{ color: "#9ca3af" }}
        >
          HostPro · With you all over Portugal
        </p>
      </div>
    </main>
  );
}

/* ---------------- sub-componentes ---------------- */

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: CYAN }}>
        {eyebrow}
      </p>
      <h2 className="mt-1 text-2xl font-extrabold tracking-tight" style={{ color: NAVY }}>
        {title}
      </h2>
    </div>
  );
}

function DonutScore({ score, color }: { score: number; color: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (c * score) / 100;
  return (
    <div className="relative h-32 w-32">
      <svg viewBox="0 0 128 128" className="h-32 w-32 -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#eceff2" strokeWidth="12" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: "#9ca3af" }}>
          / 100
        </span>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  color,
  hint,
}: {
  label: string;
  value: number;
  color: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "#e6eaed", background: "#fbfcfd" }}>
      <p className="text-3xl font-extrabold tabular-nums leading-none" style={{ color }}>
        {value}
      </p>
      <p className="mt-1.5 text-sm font-bold" style={{ color: NAVY }}>
        {label}
      </p>
      <p className="text-[11px]" style={{ color: "#9ca3af" }}>
        {hint}
      </p>
    </div>
  );
}

function CategoryBar({
  label,
  pass,
  evaluated,
  manual,
  ratio,
}: {
  label: string;
  pass: number;
  manual: number;
  evaluated: number;
  ratio: number;
}) {
  const pct = Math.round(ratio * 100);
  const color = healthColor(ratio);
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold" style={{ color: NAVY }}>
          {label}
        </span>
        <span className="tabular-nums font-semibold" style={{ color }}>
          {pass}/{evaluated}
          {manual > 0 && (
            <span className="ml-1.5 text-[11px] font-medium" style={{ color: "#9ca3af" }}>
              +{manual} a confirmar
            </span>
          )}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full" style={{ background: "#eceff2" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function HeroChip({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl border px-3 py-2 backdrop-blur"
      style={{ borderColor: "rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)" }}
    >
      <span className="text-lg font-extrabold tabular-nums" style={{ color }}>
        {n}
      </span>
      <span className="text-xs font-medium text-white/70">{label}</span>
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
