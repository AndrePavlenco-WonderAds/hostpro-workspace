"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addEntryAction } from "@/lib/pnl-actions";
import { PEOPLE } from "@/lib/pnl-types";

type Kind = "entrada" | "despesa" | "funcionario";

const LABELS: Record<Kind, { open: string; title: string; primary: string }> = {
  entrada: {
    open: "+ Adicionar entrada",
    title: "Nova entrada (reserva / receita)",
    primary: "Registar entrada",
  },
  despesa: {
    open: "+ Adicionar custo",
    title: "Novo custo",
    primary: "Registar custo",
  },
  funcionario: {
    open: "+ Adicionar pagamento",
    title: "Novo pagamento a funcionário",
    primary: "Registar pagamento",
  },
};

export function AddEntryDialog({
  kind,
  property,
  defaultDate,
}: {
  kind: Kind;
  property: string;
  /** ISO YYYY-MM-DD — defaults to today client-side. */
  defaultDate?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");

  const labels = LABELS[kind];
  const today = defaultDate ?? new Date().toISOString().slice(0, 10);

  function close() {
    if (isPending) return;
    setOpen(false);
    setError(null);
    setAmount("");
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addEntryAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setAmount("");
      router.refresh();
    });
  }

  // Auto-compute 6% IVA suggestion as the amount changes (entrada only).
  const ivaSuggestion =
    kind === "entrada" && amount
      ? (Number(amount.replace(",", ".")) * 0.06).toFixed(2)
      : "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-white/80 transition hover:border-brand-cyan hover:text-white"
      >
        {labels.open}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <form
            action={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-brand-navy-dark p-6 shadow-2xl"
          >
            <header className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">{labels.title}</h3>
              <button
                type="button"
                onClick={close}
                className="text-white/45 transition hover:text-white"
                aria-label="Fechar"
              >
                ✕
              </button>
            </header>

            <input type="hidden" name="property" value={property} />
            <input type="hidden" name="kind" value={kind} />

            <Field label="Data">
              <input
                type="date"
                name="date"
                defaultValue={today}
                required
                className="form-input"
              />
            </Field>

            {kind === "entrada" ? (
              <Field label="Janela da estadia">
                <input
                  type="text"
                  name="stayWindow"
                  placeholder="ex: 11/05-15/05"
                  required
                  className="form-input"
                />
              </Field>
            ) : (
              <Field label="Descrição">
                <input
                  type="text"
                  name="description"
                  required
                  placeholder={
                    kind === "despesa" ? "ex: Pingo Doce" : "ex: Limpeza"
                  }
                  className="form-input"
                />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Valor (€)">
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="form-input"
                />
              </Field>
              <Field
                label={
                  kind === "despesa" || kind === "funcionario"
                    ? "Pessoa pagou"
                    : "Pessoa"
                }
              >
                <select name="person" defaultValue="André" className="form-input">
                  {PEOPLE.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {kind === "entrada" && (
              <Field label="IVA (€) — sugestão 6 %">
                <input
                  type="number"
                  name="iva"
                  step="0.01"
                  min="0"
                  defaultValue={ivaSuggestion}
                  placeholder={ivaSuggestion}
                  className="form-input"
                />
              </Field>
            )}

            <div className="space-y-2">
              {kind === "despesa" && (
                <Check name="outOfAccount" label="Saiu da conta da empresa" />
              )}
              {kind === "funcionario" && (
                <>
                  <Check name="pago" label="Já pago" defaultChecked />
                  <Check name="outOfAccount" label="Saiu da conta da empresa" />
                </>
              )}
              {kind === "entrada" && (
                <>
                  <Check name="recebido" label="Recebido" defaultChecked />
                  <Check name="noBanco" label="Já entrou no banco" defaultChecked />
                  <Check name="inIvaVault" label="IVA já no Vault" />
                </>
              )}
            </div>

            {error && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-cyan px-4 py-2.5 text-sm font-semibold text-brand-navy transition hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "A guardar…" : labels.primary}
            </button>
          </form>
        </div>
      )}

      <style jsx global>{`
        .form-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.55rem 0.75rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
          transition: border-color 0.15s;
        }
        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }
        .form-input:focus {
          border-color: rgb(0, 181, 226);
        }
        .form-input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1) brightness(0.7);
        }
      `}</style>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
        {label}
      </span>
      {children}
    </label>
  );
}

function Check({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-white/75">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-white/20 bg-white/[0.05] text-brand-cyan focus:ring-brand-cyan"
      />
      {label}
    </label>
  );
}
