"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  setOverrideAction,
  updateProspectMetaAction,
  reanalyzeAction,
  deleteProspectAction,
} from "@/lib/prospecting/actions";
import type { AuditCategory, ItemStatus, ListingData } from "@/lib/prospecting/types";

type Props = {
  id: string;
  name: string;
  url: string;
  publicToken: string;
  operatorNotes: string;
  clientNotes: string;
  listing: ListingData;
  categories: AuditCategory[];
  score: number;
  passCount: number;
  failCount: number;
  manualCount: number;
};

const STATUS_META: Record<ItemStatus, { label: string; cls: string }> = {
  pass: { label: "OK", cls: "bg-emerald-400/15 text-emerald-200 border-emerald-400/30" },
  fail: { label: "A melhorar", cls: "bg-rose-400/15 text-rose-200 border-rose-400/30" },
  manual: { label: "Por rever", cls: "bg-white/8 text-white/55 border-white/15" },
  na: { label: "N/A", cls: "bg-white/5 text-white/35 border-white/10" },
};

export function AuditWorkspace(props: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(props.operatorNotes);
  const [clientNotes, setClientNotes] = useState(props.clientNotes);
  const [copied, setCopied] = useState(false);

  const reportPath = `/prospecting/r/${props.publicToken}`;

  function setStatus(itemId: string, status: ItemStatus) {
    startTransition(async () => {
      await setOverrideAction(props.id, itemId, status);
      router.refresh();
    });
  }
  function saveNotes() {
    startTransition(async () => {
      await updateProspectMetaAction(props.id, { operatorNotes: notes });
      router.refresh();
    });
  }
  function saveClientNotes() {
    startTransition(async () => {
      await updateProspectMetaAction(props.id, { clientNotes });
      router.refresh();
    });
  }
  function reanalyze() {
    startTransition(async () => {
      await reanalyzeAction(props.id);
      router.refresh();
    });
  }
  function remove() {
    if (!confirm("Apagar este prospect?")) return;
    startTransition(async () => {
      await deleteProspectAction(props.id);
      router.push("/prospecting");
    });
  }
  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}${reportPath}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho: score + ações */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <ScoreDial score={props.score} />
          <div>
            <p className="text-lg font-semibold text-white">{props.name}</p>
            <a
              href={props.url}
              target="_blank"
              rel="noreferrer"
              className="block max-w-[240px] truncate text-xs text-brand-cyan underline-offset-2 hover:underline"
            >
              {props.url.replace(/^https?:\/\/(www\.)?/, "")}
            </a>
            <p className="mt-1 text-[11px] text-white/45">
              {props.passCount} OK · {props.failCount} a melhorar · {props.manualCount} por rever
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={copyLink} className="rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:border-brand-cyan disabled:opacity-60" disabled={isPending}>
            {copied ? "Copiado ✓" : "Copiar link do cliente"}
          </button>
          <Link href={reportPath} target="_blank" className="rounded-full bg-brand-cyan px-3.5 py-1.5 text-xs font-semibold text-brand-navy transition hover:opacity-90">
            Ver relatório →
          </Link>
          <button onClick={reanalyze} disabled={isPending} className="rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:border-brand-cyan disabled:opacity-60">
            Reanalisar
          </button>
          <button onClick={remove} disabled={isPending} className="rounded-full border border-rose-400/25 bg-rose-400/10 px-3.5 py-1.5 text-xs font-semibold text-rose-200 transition hover:border-rose-400/50 disabled:opacity-60">
            Apagar
          </button>
        </div>
      </div>

      {/* Diagnóstico da leitura */}
      {props.listing.note && (
        <p className="rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
          {props.listing.note}
        </p>
      )}

      {/* Notas do operador */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
          Notas internas (não aparecem no relatório do cliente)
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-2 w-full resize-y rounded-lg border border-white/12 bg-white/[0.05] px-3 py-2 text-sm text-white outline-none focus:border-brand-cyan"
        />
        <button onClick={saveNotes} disabled={isPending} className="mt-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:border-brand-cyan disabled:opacity-60">
          Guardar notas
        </button>
      </div>

      {/* Notas da HostPro PARA o cliente — aparecem no relatório */}
      <div className="rounded-2xl border border-brand-cyan/25 bg-brand-cyan/[0.05] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-cyan">
          Notas da HostPro para o cliente · plano de ação
        </p>
        <p className="mt-0.5 text-[11px] text-white/45">
          Isto <strong>aparece no relatório</strong> do cliente. Usa para situar o roadmap: o que fazemos já, prioridades, próximos passos.
        </p>
        <textarea
          value={clientNotes}
          onChange={(e) => setClientNotes(e.target.value)}
          rows={4}
          placeholder={"ex: Começamos pelas fotos (sessão profissional) e reescrita do título esta semana; depois ativamos preços dinâmicos e automação de mensagens. Em 30 dias esperamos +15% de ocupação."}
          className="mt-2 w-full resize-y rounded-lg border border-white/12 bg-white/[0.05] px-3 py-2 text-sm text-white outline-none focus:border-brand-cyan"
        />
        <button onClick={saveClientNotes} disabled={isPending} className="mt-2 rounded-full bg-brand-cyan px-3.5 py-1.5 text-xs font-semibold text-brand-navy transition hover:opacity-90 disabled:opacity-60">
          Guardar plano de ação
        </button>
      </div>

      {/* Categorias */}
      {props.categories.map((cat) => (
        <section key={cat.id}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            {cat.label}
          </h3>
          <div className="mt-3 space-y-2">
            {cat.items.map((it) => {
              const meta = STATUS_META[it.status];
              return (
                <div key={it.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white">{it.label}</p>
                      {it.evidence && (
                        <p className="mt-0.5 text-[11px] text-white/45">{it.evidence}</p>
                      )}
                      {it.status === "fail" && it.recommendation && (
                        <p className="mt-1 text-[11px] text-brand-cyan/90">↳ {it.recommendation}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.cls}`}>
                        {meta.label}
                        {it.mode === "auto" && it.status !== "manual" ? " · auto" : ""}
                      </span>
                      <div className="flex overflow-hidden rounded-lg border border-white/10">
                        <Toggle active={it.status === "pass"} onClick={() => setStatus(it.id, "pass")} disabled={isPending} title="OK">✓</Toggle>
                        <Toggle active={it.status === "fail"} onClick={() => setStatus(it.id, "fail")} disabled={isPending} title="A melhorar">✗</Toggle>
                        <Toggle active={it.status === "na"} onClick={() => setStatus(it.id, "na")} disabled={isPending} title="N/A">—</Toggle>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function Toggle({
  active,
  onClick,
  disabled,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
        active ? "bg-brand-cyan text-brand-navy" : "bg-white/[0.04] text-white/60 hover:bg-white/[0.08]"
      }`}
    >
      {children}
    </button>
  );
}

function ScoreDial({ score }: { score: number }) {
  const tone = score >= 70 ? "text-emerald-300" : score >= 40 ? "text-amber-300" : "text-rose-300";
  return (
    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border border-white/15 bg-white/[0.04]">
      <span className={`text-xl font-bold tabular-nums ${tone}`}>{score}</span>
      <span className="text-[8px] uppercase tracking-[0.2em] text-white/40">score</span>
    </div>
  );
}
