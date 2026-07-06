"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createProspectAction } from "@/lib/prospecting/actions";

const INPUT =
  "w-full rounded-lg border border-white/12 bg-white/[0.05] px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-brand-cyan disabled:opacity-60";
const LABEL = "mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45";

export function ProspectingForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPaste, setShowPaste] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createProspectAction(fd);
      if (res.ok) router.push(`/prospecting/${res.id}`);
      else setError(res.error);
    });
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md sm:p-7"
    >
      <label className="block">
        <span className={LABEL}>Link do listing (Airbnb ou Booking) *</span>
        <input
          name="url"
          required
          placeholder="https://www.airbnb.com/rooms/..."
          className={INPUT}
        />
        <span className="mt-1 block text-[11px] text-white/40">
          O Airbnb é lido automaticamente. O Booking bloqueia leitura — nesse caso cola os dados em baixo.
        </span>
      </label>

      <label className="block">
        <span className={LABEL}>Nome do prospect (opcional)</span>
        <input name="name" placeholder="ex: Apartamento do João — Estoril" className={INPUT} />
      </label>

      <label className="block">
        <span className={LABEL}>Detalhes que já viste que não estão bons (opcional)</span>
        <textarea
          name="operatorNotes"
          rows={3}
          placeholder="ex: fotos escuras, título sem localização, preço fixo o ano todo…"
          className={`${INPUT} resize-y`}
        />
      </label>

      <div>
        <button
          type="button"
          onClick={() => setShowPaste((v) => !v)}
          className="text-xs font-semibold text-brand-cyan transition hover:opacity-80"
        >
          {showPaste ? "− Esconder" : "+ Colar dados à mão"} (para Booking ou se o Airbnb falhar)
        </button>
        {showPaste && (
          <div className="mt-3 space-y-4 rounded-2xl border border-brand-cyan/25 bg-brand-cyan/[0.04] p-4">
            <label className="block">
              <span className={LABEL}>Título</span>
              <input name="pastedTitle" className={INPUT} />
            </label>
            <label className="block">
              <span className={LABEL}>Descrição</span>
              <textarea name="pastedDescription" rows={4} className={`${INPUT} resize-y`} />
            </label>
            <label className="block">
              <span className={LABEL}>Comodidades (uma por linha)</span>
              <textarea
                name="pastedAmenities"
                rows={4}
                placeholder={"Wifi\nCozinha equipada\nMáquina de lavar\n..."}
                className={`${INPUT} resize-y`}
              />
            </label>
          </div>
        )}
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
          {isPending ? "A analisar…" : "Analisar listing"}
        </button>
        <span className="text-[11px] text-white/40">Leitura + análise demoram alguns segundos.</span>
      </div>
    </form>
  );
}
