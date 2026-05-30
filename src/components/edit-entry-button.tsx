"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateEntryAction } from "@/lib/pnl-actions";
import { PEOPLE, type PnLEntry } from "@/lib/pnl-types";

/**
 * Pencil-icon button on every row that opens a modal pre-filled with the
 * existing entry's values. On submit it calls updateEntryAction and the
 * page re-renders via revalidatePath.
 */
export function EditEntryButton({ entry }: { entry: PnLEntry }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState(String(entry.amount));

  const title =
    entry.kind === "entrada"
      ? "Editar entrada"
      : entry.kind === "despesa"
        ? "Editar custo"
        : "Editar pagamento";

  function close() {
    if (isPending) return;
    setOpen(false);
    setError(null);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateEntryAction(entry.id, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Editar entrada"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs text-white/35 transition hover:bg-white/[0.06] hover:text-brand-cyan"
      >
        ✎
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-brand-navy-dark p-6 shadow-2xl"
          >
            <header className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-0.5 text-[11px] text-white/45">
                  ID interno: {entry.id}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="text-white/45 transition hover:text-white"
                aria-label="Fechar"
              >
                ✕
              </button>
            </header>

            <input type="hidden" name="property" value={entry.property} />
            <input type="hidden" name="kind" value={entry.kind} />

            <Field label="Data">
              <input
                type="date"
                name="date"
                defaultValue={entry.date}
                required
                className="rsv-input"
              />
            </Field>

            {entry.kind === "entrada" ? (
              <Field label="Janela da estadia">
                <input
                  type="text"
                  name="stayWindow"
                  defaultValue={entry.stayWindow ?? entry.description}
                  required
                  className="rsv-input"
                />
              </Field>
            ) : (
              <Field label="Descrição">
                <input
                  type="text"
                  name="description"
                  defaultValue={entry.description}
                  required
                  className="rsv-input"
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
                  className="rsv-input"
                />
              </Field>
              <Field
                label={
                  entry.kind === "despesa" || entry.kind === "funcionario"
                    ? "Pessoa pagou"
                    : "Pessoa"
                }
              >
                <select
                  name="person"
                  defaultValue={entry.person}
                  className="rsv-input"
                >
                  {PEOPLE.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {entry.kind === "entrada" && (
              <Field label="IVA (€)">
                <input
                  type="number"
                  name="iva"
                  step="0.01"
                  min="0"
                  defaultValue={entry.iva}
                  className="rsv-input"
                />
              </Field>
            )}

            <div className="space-y-2">
              {entry.kind === "despesa" && (
                <Check
                  name="outOfAccount"
                  label="Saiu da conta da empresa"
                  defaultChecked={entry.outOfAccount}
                />
              )}
              {entry.kind === "funcionario" && (
                <>
                  <Check name="pago" label="Já pago" defaultChecked={entry.pago} />
                  <Check
                    name="outOfAccount"
                    label="Saiu da conta da empresa"
                    defaultChecked={entry.outOfAccount}
                  />
                </>
              )}
              {entry.kind === "entrada" && (
                <>
                  <Check
                    name="recebido"
                    label="Recebido"
                    defaultChecked={entry.recebido}
                  />
                  <Check
                    name="noBanco"
                    label="Já entrou no banco"
                    defaultChecked={entry.noBanco}
                  />
                  <Check
                    name="inIvaVault"
                    label="IVA já no Vault"
                    defaultChecked={entry.inIvaVault}
                  />
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
              {isPending ? "A guardar…" : "Guardar alterações"}
            </button>
          </form>
        </div>
      )}
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
