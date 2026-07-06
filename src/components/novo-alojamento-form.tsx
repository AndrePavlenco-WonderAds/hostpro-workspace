"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createPropertyAction } from "@/lib/properties-actions";

const INPUT_CLASS =
  "w-full rounded-lg border border-white/12 bg-white/[0.05] px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-brand-cyan disabled:opacity-60";

const LABEL_CLASS =
  "mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45";

export function NovoAlojamentoForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createPropertyAction(formData);
      if (res.ok) {
        // Vai directo para a página do novo alojamento.
        router.push(`/alojamentos/${res.slug}`);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md sm:p-7"
    >
      {/* ── Identificação ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={LABEL_CLASS}>Nome do alojamento *</span>
          <input
            name="name"
            required
            placeholder="ex: Sweet Escape · 3º"
            className={INPUT_CLASS}
          />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Nome curto (cards / navegação)</span>
          <input
            name="shortName"
            placeholder="ex: Sweet Escape 3"
            className={INPUT_CLASS}
          />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Localização *</span>
          <input
            name="location"
            required
            placeholder="ex: Monte Estoril"
            className={INPUT_CLASS}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={LABEL_CLASS}>Descrição</span>
          <textarea
            name="description"
            rows={2}
            placeholder="ex: T2 reabilitado em Monte Estoril, perfeito para escapadinhas curtas."
            className={`${INPUT_CLASS} resize-y`}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={LABEL_CLASS}>Foto (upload) — opcional · máx. 10 MB</span>
          <input
            type="file"
            name="photo"
            accept="image/*"
            className={`${INPUT_CLASS} file:mr-3 file:rounded-md file:border-0 file:bg-brand-cyan/20 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-brand-cyan`}
          />
        </label>
      </div>

      {/* ── Morada (para as reservas) ── */}
      <div>
        <label className="block">
          <span className={LABEL_CLASS}>Morada (uma linha por linha) — para a reserva</span>
          <textarea
            name="address"
            rows={4}
            placeholder={"Rua do Viveiro 15\n3ºC\n2765-294 Estoril\nPortugal"}
            className={`${INPUT_CLASS} resize-y font-mono`}
          />
        </label>
      </div>

      {/* ── Valores por defeito ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={LABEL_CLASS}>Preço/noite (€)</span>
          <input
            type="number"
            name="nightlyRate"
            min={0}
            step="0.01"
            placeholder="100"
            className={INPUT_CLASS}
          />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Taxa de limpeza (€)</span>
          <input
            type="number"
            name="cleaningFee"
            min={0}
            step="0.01"
            placeholder="0"
            className={INPUT_CLASS}
          />
        </label>
        <label className="block">
          <span className={LABEL_CLASS}>Pagamento limpeza (€)</span>
          <input
            type="number"
            name="cleaningPayment"
            min={0}
            step="0.01"
            placeholder="25"
            className={INPUT_CLASS}
          />
        </label>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-brand-cyan px-6 py-2.5 text-sm font-semibold text-brand-navy shadow-[0_15px_40px_-12px_rgba(0,181,226,0.7)] transition hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "A criar…" : "Criar alojamento"}
        </button>
        <span className="text-[11px] text-white/40">
          O link (slug) é gerado a partir do nome.
        </span>
      </div>
    </form>
  );
}
