import { notFound } from "next/navigation";
import { getProspectByToken } from "@/lib/prospecting/store";
import { applyOverrides } from "@/lib/prospecting/audit";
import { resolveGeo, getZone } from "@/lib/prospecting/geo";
import { ddmmyyyy } from "@/lib/dates";
import { ReportGlobe } from "@/components/prospecting/report-globe";
import { ReportActions } from "@/components/prospecting/report-actions";
import { HeroBackground } from "@/components/prospecting/report-hero-bg";
import { CountUp, Donut } from "@/components/prospecting/report-anim";
import type { Priority } from "@/lib/prospecting/types";

export const metadata = {
  title: "Auditoria de Alojamento Local — HostPro",
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

const CATEGORY_DESC: Record<string, string> = {
  "Título & Descrição do Anúncio": "As palavras que aparecem na pesquisa e convencem a reservar.",
  "Fotos do Anúncio": "Quantidade e ordem das fotos que mostram o espaço.",
  "Qualidade das Fotos do Anúncio": "Luz, edição e apresentação de cada fotografia.",
  Cobertura: "Todas as divisões e ângulos fotografados, sem nada por mostrar.",
  "Configuração do listing": "Direções, check-in, WiFi e manual da casa na plataforma.",
  Amenidades: "Comodidades listadas que ganham (ou perdem) reservas.",
  "Extras de alta conversão": "Pormenores que fazem o hóspede escolher-vos (café, Netflix, praia).",
  "Automação (TalkGuest)": "Mensagens automáticas, do check-in ao pedido de avaliação.",
  "Preços & PriceLabs": "Preços dinâmicos por procura, época e eventos locais.",
  Operações: "Limpezas, manutenção e reposição de stock nos bastidores.",
  "Bónus (alto impacto)": "Detalhes que elevam a experiência e as avaliações.",
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
  const geo = resolveGeo(p.listing.location, p.name);
  const zone = await getZone(geo.lat, geo.lng, geo.zone);
  // "São Domingos de Rana · Cascais" — but avoid "Cascais · Cascais".
  const locationLine =
    zone && zone.toLowerCase() !== geo.place.toLowerCase() ? `${geo.place} · ${zone}` : geo.place;

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
        ? "Há uma base mínima, mas várias oportunidades claras para aumentar reservas e receita."
        : "Há margem significativa para otimizar — o potencial de crescimento é grande.";

  const scoreColor = audit.score >= 70 ? "#16a34a" : audit.score >= 40 ? "#d97706" : "#dc2626";
  const scoreBand = audit.score >= 70 ? "Competitivo" : audit.score >= 40 ? "A perder €" : "Perde muito €";

  const globeStats = {
    platform: p.platform,
    name: p.name,
    score: audit.score,
    scoreColor,
    band: scoreBand,
    strengths: strengths.length,
    fails: audit.failCount,
    criticals: criticalCount,
  };

  return (
    <main style={{ background: "linear-gradient(180deg,#f7f9fb 0%,#eef2f6 100%)", color: NAVY }} className="min-h-screen">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .print-only { display: none; }
            .font-hand { font-family: var(--font-hand), "Segoe Script", cursive; }
            @keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
            .rise { animation: rise 0.7s cubic-bezier(0.22,1,0.36,1) both; }
            .rise-2 { animation-delay: 0.08s; }
            .rise-3 { animation-delay: 0.16s; }
            .lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
            .lift:hover { transform: translateY(-2px); box-shadow: 0 16px 40px -18px rgba(16,24,40,0.28); }
            @media print {
              @page { size: A4 portrait; margin: 12mm; }
              html, body { background: #fff !important; }
              .no-print { display: none !important; }
              .print-only { display: block !important; }
              .avoid-break { break-inside: avoid; }
              .rise, .rise-2, .rise-3 { animation: none !important; opacity: 1 !important; transform: none !important; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          `,
        }}
      />

      {/* ======================= BARRA DE AÇÕES ======================= */}
      <header
        className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 px-5 py-3 sm:px-8"
        style={{ background: NAVY_DARK, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hostpro-logo-white.png" alt="HostPro" className="h-6 w-auto" />
          <span className="hidden text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50 sm:inline">
            Auditoria de Alojamento Local
          </span>
        </div>
        <ReportActions />
      </header>

      {/* ======================= HERO ======================= */}
      <section className="no-print relative overflow-hidden px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
        <HeroBackground />
        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
          <div className="rise">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-cyan">
              Auditoria de Alojamento Local · {p.platform} · {ddmmyyyy(p.createdAt)}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              {p.name}
            </h1>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-white/70">
              <PinIcon /> {locationLine}
            </p>

            {/* Resumo assinado */}
            <figure
              className="relative mt-6 max-w-lg overflow-hidden rounded-3xl border p-6"
              style={{
                borderColor: "rgba(0,181,226,0.28)",
                background: "linear-gradient(150deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))",
              }}
            >
              <span
                aria-hidden
                className="absolute -left-1 -top-6 select-none text-[110px] leading-none"
                style={{ color: "rgba(0,181,226,0.22)", fontFamily: "Georgia, serif" }}
              >
                “
              </span>
              <p className="relative text-[11px] font-bold uppercase tracking-[0.22em] text-brand-cyan">
                Resumo
              </p>
              <blockquote className="relative mt-2 text-lg font-semibold leading-relaxed text-white sm:text-xl">
                {verdict}
              </blockquote>
              <figcaption className="relative mt-4 border-t border-white/10 pt-3">
                <p className="font-hand text-3xl leading-none text-brand-cyan">André Pavlenco</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
                  Fundador · HostPro
                </p>
              </figcaption>
            </figure>
          </div>

          <div className="relative rise rise-2">
            <ReportGlobe lat={geo.lat} lng={geo.lng} place={geo.place} stats={globeStats} />
          </div>
        </div>
      </section>

      {/* ======================= PRINT HEADER ======================= */}
      <section className="print-only" style={{ borderBottom: `2px solid ${CYAN}`, paddingBottom: 14, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hostpro-logo.png" alt="HostPro" style={{ height: 32, width: "auto" }} />
          <div style={{ textAlign: "right", fontSize: 11, color: "#6b7280" }}>
            <p>Auditoria de Alojamento Local · {p.platform}</p>
            <p>{ddmmyyyy(p.createdAt)} · hostpro.pt</p>
          </div>
        </div>
        <div style={{ marginTop: 12, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: NAVY }}>{p.name}</h1>
            <p style={{ marginTop: 2, fontSize: 12, color: "#6b7280" }}>📍 {locationLine}</p>
            <p style={{ marginTop: 8, maxWidth: 440, fontSize: 14, fontWeight: 600, color: "#1f2937" }}>{verdict}</p>
            <p style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>— André Pavlenco, Fundador</p>
          </div>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, color: scoreColor }}>{audit.score}</div>
            <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9ca3af" }}>de 100</div>
          </div>
        </div>
      </section>

      {/* ======================= CORPO DASHBOARD ======================= */}
      <div className="relative">
        {/* Fundo decorativo — malha de pontos + brilhos, para as secções não ficarem planas */}
        <div
          aria-hidden
          className="no-print pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage: `radial-gradient(${NAVY}0f 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />
          <div
            className="absolute -left-32 top-24 h-96 w-96 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(0,181,226,0.12), transparent 70%)" }}
          />
          <div
            className="absolute -right-32 top-[40%] h-[28rem] w-[28rem] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(32,50,71,0.1), transparent 70%)" }}
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 print:px-0 print:py-0">
          {/* --- Diagnóstico --- */}
          <section className="rise">
            <SectionHeader eyebrow="Diagnóstico" title="Como está o seu Alojamento Local" />

            <div className="mt-5 grid gap-4 lg:grid-cols-3 print:grid-cols-3">
              <div
                className="lift flex flex-col items-center justify-center gap-3 rounded-3xl border p-6"
                style={{
                  borderColor: "#e6eaed",
                  background: "linear-gradient(160deg,#ffffff, #f4f8fb)",
                  boxShadow: "0 1px 3px rgba(16,24,40,0.05)",
                }}
              >
                <Donut score={audit.score} color={scoreColor} />
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: scoreColor, background: `${scoreColor}14`, border: `1px solid ${scoreColor}33` }}
                >
                  {scoreBand}
                </span>
                <p className="text-xs font-semibold" style={{ color: "#6b7280" }}>
                  Índice de otimização
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:col-span-2">
                <StatTile label="Pontos fortes" value={strengths.length} color="#16a34a" hint="já bem feitos" />
                <StatTile label="A melhorar" value={audit.failCount} color={CYAN} hint="oportunidades" />
                <StatTile label="Críticos" value={criticalCount} color="#dc2626" hint="prioridade máxima" />
                <StatTile label="Por confirmar" value={audit.manualCount} color="#64748b" hint="análise HostPro" />
              </div>
            </div>

            {categoryPerf.length > 0 && (
              <div
                className="mt-4 rounded-3xl border bg-white p-6"
                style={{ borderColor: "#e6eaed", boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1.5 rounded-full" style={{ background: CYAN }} />
                  <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "#6b7280" }}>
                    Desempenho por área
                  </p>
                </div>
                <div className="mt-5 grid gap-x-10 gap-y-4 sm:grid-cols-2 print:grid-cols-2">
                  {categoryPerf.map((c) => (
                    <CategoryBar key={c.label} {...c} />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* --- Roadmap de melhorias --- */}
          {opportunities.length > 0 && (
            <section className="mt-12 rise">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <SectionHeader eyebrow="Plano de ação" title="Oportunidades de melhoria" />
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-extrabold text-white"
                  style={{ background: "#dc2626" }}
                >
                  <span aria-hidden>⚠</span> {audit.failCount} a corrigir
                </span>
              </div>

              <div className="mt-5 grid items-start gap-4 sm:grid-cols-2 print:grid-cols-1">
                {opportunities.map((cat, ci) => {
                  const prio = PRIO[cat.priority];
                  return (
                    <div
                      key={cat.label}
                      className="lift avoid-break overflow-hidden rounded-3xl border bg-white"
                      style={{ borderColor: "#e6eaed", boxShadow: "0 1px 3px rgba(16,24,40,0.05)" }}
                    >
                      <div
                        className="flex items-center justify-between gap-2 px-4 py-3"
                        style={{ background: prio.bg, borderBottom: `1px solid ${prio.color}22` }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-extrabold text-white"
                            style={{ background: prio.color }}
                          >
                            {ci + 1}
                          </span>
                          <span className="text-sm font-bold" style={{ color: NAVY }}>
                            {cat.label}
                          </span>
                        </div>
                        <span
                          className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{ color: prio.color, border: `1px solid ${prio.color}55` }}
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

          {/* --- Lados positivos + Plano da HostPro --- */}
          <section className="mt-12 grid gap-4 lg:grid-cols-2 print:grid-cols-1">
            {strengths.length > 0 && (
              <div className="avoid-break rise">
                <SectionHeader eyebrow="Lados Positivos do AL" title="O que já está bem" />
                <ul className="mt-4 grid grid-cols-1 gap-2">
                  {strengths.map((it) => (
                    <li
                      key={it.id}
                      className="flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm"
                      style={{ borderColor: "#dcefe3", background: "#f4fcf7", color: "#374151" }}
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
              </div>
            )}

            {clientNotes && (
              <div className="avoid-break rise rise-2">
                <SectionHeader eyebrow="O nosso plano" title="O que a HostPro faz por si" />
                <div
                  className="mt-4 h-[calc(100%-4.5rem)] overflow-hidden rounded-3xl p-6"
                  style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DARK} 100%)` }}
                >
                  <p className="whitespace-pre-line text-[15px] leading-relaxed" style={{ color: "#e8edf1" }}>
                    {clientNotes}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* --- CTA --- */}
          <section
            className="mt-12 avoid-break overflow-hidden rounded-3xl p-8 text-center"
            style={{ background: `radial-gradient(700px 320px at 50% -30%, rgba(0,181,226,0.28), transparent), ${NAVY}` }}
          >
            <p className="text-xl font-extrabold text-white sm:text-2xl">A HostPro trata de tudo isto por si.</p>
            <p className="mx-auto mt-2 max-w-lg text-sm" style={{ color: "#c7d0d9" }}>
              Gestão completa do seu alojamento local de Cascais a Lisboa — anúncio, fotos, preços
              dinâmicos, automação e operações.
            </p>
            <a
              href="tel:+351936535306"
              className="no-print mt-5 inline-flex items-center gap-2 rounded-full bg-brand-cyan px-6 py-2.5 text-sm font-bold text-brand-navy transition hover:opacity-90"
            >
              Falar com o André →
            </a>
          </section>

          {/* --- Assinatura --- */}
          <section
            className="mt-8 avoid-break flex items-center gap-4 rounded-3xl border bg-white p-5"
            style={{ borderColor: "#e6eaed", boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/team/andre-pavlenco.jpg"
              alt="André Pavlenco"
              className="h-16 w-16 shrink-0 rounded-full object-cover"
              style={{ border: `2px solid ${CYAN}` }}
            />
            <div className="min-w-0 flex-1">
              <p className="font-hand text-2xl leading-none" style={{ color: NAVY }}>
                André Pavlenco
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: CYAN }}>
                Fundador HostPro
              </p>
              <p className="mt-1 text-sm" style={{ color: "#4b5563" }}>
                hostpro.pt · hostpro.pt@gmail.com · 936 535 306
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hostpro-logo.png" alt="" className="hidden h-7 w-auto opacity-70 sm:block" />
          </section>

          <p
            className="mt-6 text-center text-[10px] uppercase tracking-[0.22em]"
            style={{ color: "#9ca3af" }}
          >
            HostPro · hostpro.pt · With you all over Portugal
          </p>
        </div>
      </div>
    </main>
  );
}

/* ---------------- sub-componentes ---------------- */

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ background: CYAN, boxShadow: `0 0 0 4px ${CYAN}22` }} />
        <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: CYAN }}>
          {eyebrow}
        </p>
      </div>
      <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: NAVY }}>
        {title}
      </h2>
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
    <div
      className="lift relative overflow-hidden rounded-3xl border bg-white p-4"
      style={{ borderColor: "#e6eaed", boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}
    >
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
      <span className="text-4xl font-extrabold leading-none" style={{ color }}>
        <CountUp value={value} />
      </span>
      <p className="mt-2 text-sm font-bold" style={{ color: NAVY }}>
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
  const desc = CATEGORY_DESC[label];
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold" style={{ color: NAVY }}>
          {label}
        </span>
        <span className="shrink-0 tabular-nums font-semibold" style={{ color }}>
          {pass}/{evaluated}
          {manual > 0 && (
            <span className="ml-1.5 text-[11px] font-medium" style={{ color: "#9ca3af" }}>
              +{manual} a confirmar
            </span>
          )}
        </span>
      </div>
      {desc && (
        <p className="mt-0.5 text-[11px] leading-snug" style={{ color: "#9ca3af" }}>
          {desc}
        </p>
      )}
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full" style={{ background: "#eceff2" }}>
        <div
          className="animate-grow-x h-full rounded-full"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}
        />
      </div>
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
