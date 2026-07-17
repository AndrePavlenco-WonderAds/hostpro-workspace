"use client";

// Botão da home + modal para adicionar um custo REPARTIDO por todos os
// alojamentos. O valor introduzido é dividido pelo número de alojamentos e
// cria uma linha de custo em cada um, com a mesma descrição e data.
// Cêntimos são repartidos de forma exacta no servidor (addSharedExpenseAction).

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addSharedExpenseAction } from "@/lib/pnl-actions";
import { PEOPLE } from "@/lib/pnl-types";
import { eur } from "@/lib/money";

const INPUT_CLASS =
  "w-full rounded-lg border border-white/12 bg-white/[0.05] px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-brand-cyan disabled:opacity-60 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-75";

const LABEL_CLASS =
  "flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50";

export function SharedExpenseButton({ propertyCount }: { propertyCount: number }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Fecha com Escape; devolve o foco ao fluxo normal ao fechar.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const n = Math.max(propertyCount, 1);
  const parsed = Number(amount.replace(",", "."));
  const perApartment =
    Number.isFinite(parsed) && parsed > 0 ? parsed / n : null;

  function reset() {
    setAmount("");
    setError(null);
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await addSharedExpenseAction(formData);
      if (res.ok) {
        setOpen(false);
        reset();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-brand-cyan hover:text-white"
      >
        <span aria-hidden>🧾</span>
        Custo partilhado
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Adicionar custo partilhado"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-brand-navy-dark/80 backdrop-blur-sm"
          />

          <div
            ref={dialogRef}
            className="relative z-10 w-full max-w-md rounded-2xl border border-white/12 bg-brand-navy-dark/95 p-5 shadow-2xl ring-1 ring-white/5"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Custo partilhado
                </h2>
                <p className="mt-0.5 text-xs text-white/50">
                  Dividido pelos {n} alojamentos — uma linha de custo em cada um.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="-mr-1 -mt-1 rounded-full p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={LABEL_CLASS}>
                  Data
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={today}
                    className={INPUT_CLASS}
                  />
                </label>
                <label className={LABEL_CLASS}>
                  Valor total (€)
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="ex: 90"
                    className={INPUT_CLASS}
                  />
                </label>
              </div>

              <label className={LABEL_CLASS}>
                Descrição
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="ex: Internet, seguro, contabilidade"
                  className={INPUT_CLASS}
                />
              </label>

              <label className={LABEL_CLASS}>
                Pessoa pagou
                <select name="person" defaultValue="André" className={INPUT_CLASS}>
                  {PEOPLE.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  name="outOfAccount"
                  className="h-4 w-4 rounded border-white/25 bg-white/10 accent-brand-cyan"
                />
                Saiu da conta da empresa
              </label>

              {perApartment !== null && (
                <p className="rounded-lg border border-brand-cyan/25 bg-brand-cyan/10 px-3 py-2 text-xs text-white/80">
                  Cada alojamento fica com{" "}
                  <span className="font-semibold text-white">
                    {eur(perApartment)}
                  </span>
                  .
                </p>
              )}

              {error && (
                <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  {error}
                </p>
              )}

              <div className="mt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white/70 transition hover:text-white"
                  disabled={isPending}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-brand-cyan px-5 py-2 text-sm font-semibold text-brand-navy transition hover:opacity-90 disabled:opacity-60"
                >
                  {isPending ? "A adicionar…" : "Adicionar custo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
