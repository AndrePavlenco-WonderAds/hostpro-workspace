"use client";

import { useState } from "react";

// v0.3.0 stub. v0.4.0 will swap this for a real form + server action that
// persists to Vercel Blob (or whichever storage we settle on after this UI
// gets validated). Today it only shows a friendly "coming soon" toast so
// the affordance is visible and tested.

export function AddEntryButton({
  kind,
  property,
}: {
  kind: "entrada" | "despesa" | "funcionario";
  property: string;
}) {
  const [open, setOpen] = useState(false);

  const label =
    kind === "entrada"
      ? "+ Adicionar entrada"
      : kind === "despesa"
        ? "+ Adicionar despesa"
        : "+ Adicionar pagamento";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-white/80 transition hover:border-brand-cyan hover:text-white"
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-brand-navy-dark p-7 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">
              Em construção — v0.4.0
            </h3>
            <p className="mt-2 text-sm text-white/65">
              A criação de novas entradas (
              <span className="font-medium text-white">{kind}</span> em{" "}
              <span className="font-medium text-white">{property}</span>) chega
              na próxima release, assim que ligar a persistência (Vercel Blob).
              Para já vês os números reais do One For One House importados do
              spreadsheet, e a tabela já está pronta para receber escrita.
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-brand-cyan px-4 py-2.5 text-sm font-semibold text-brand-navy transition hover:opacity-90"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
