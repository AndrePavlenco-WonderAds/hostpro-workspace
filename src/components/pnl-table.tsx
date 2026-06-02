"use client";

// Per-month P&L for one property, em quatro secções (Entradas / Custos /
// Lavandaria / Funcionário). Cada secção é um card que **expande
// inline** quando se clica em `+ Adicionar` ou `Editar` — sem modal, sem
// overlay, sem scroll lateral. O formulário aparece entre o header e a
// tabela, e a linha que está a ser editada fica destacada.
//
// v0.6.0 — refactor completo: deixou de haver `AddEntryDialog` e
// `EditEntryButton` (modais centrados). O estado de add/edit vive em cada
// `*Section` cliente e cai automaticamente assim que o server action
// regressa.

import {
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { ddmmyyyy } from "@/lib/dates";
import { eur } from "@/lib/money";
import { addEntryAction, updateEntryAction } from "@/lib/pnl-actions";
import {
  PEOPLE,
  type DespesaEntry,
  type EntradaEntry,
  type FuncionarioEntry,
  type LavandariaEntry,
  type PnLEntry,
} from "@/lib/pnl-types";

import { DeleteEntryButton } from "./delete-entry-button";
import { PersonPillEditable } from "./person-pill-editable";
import { ToggleChip } from "./toggle-chip";

// ──────────────────────────── tokens ────────────────────────────

type Accent = "cyan" | "rose" | "violet" | "amber";

const ACCENT: Record<
  Accent,
  {
    ring: string;
    formPanel: string;
    rowEditing: string;
    saveBtn: string;
    addBtn: string;
  }
> = {
  cyan: {
    ring: "ring-brand-cyan/30",
    formPanel: "border-brand-cyan/30 bg-brand-cyan/[0.05]",
    rowEditing: "bg-brand-cyan/[0.08]",
    saveBtn: "bg-brand-cyan text-brand-navy hover:opacity-90",
    addBtn:
      "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan hover:border-brand-cyan hover:bg-brand-cyan/20",
  },
  rose: {
    ring: "ring-rose-400/30",
    formPanel: "border-rose-400/30 bg-rose-500/[0.05]",
    rowEditing: "bg-rose-500/[0.08]",
    saveBtn: "bg-rose-300 text-brand-navy hover:opacity-90",
    addBtn:
      "border-rose-400/40 bg-rose-500/10 text-rose-200 hover:border-rose-300 hover:bg-rose-500/15",
  },
  violet: {
    ring: "ring-violet-300/30",
    formPanel: "border-violet-400/30 bg-violet-500/[0.05]",
    rowEditing: "bg-violet-500/[0.08]",
    saveBtn: "bg-violet-300 text-brand-navy hover:opacity-90",
    addBtn:
      "border-violet-400/40 bg-violet-500/10 text-violet-200 hover:border-violet-300 hover:bg-violet-500/15",
  },
  amber: {
    ring: "ring-amber-300/30",
    formPanel: "border-amber-300/30 bg-amber-500/[0.05]",
    rowEditing: "bg-amber-500/[0.08]",
    saveBtn: "bg-amber-300 text-brand-navy hover:opacity-90",
    addBtn:
      "border-amber-400/40 bg-amber-500/10 text-amber-200 hover:border-amber-300 hover:bg-amber-500/15",
  },
};

const INPUT_CLASS =
  "w-full rounded-lg border border-white/12 bg-white/[0.05] px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-brand-cyan disabled:opacity-60 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-75";

const formatKg = (n: number) =>
  n.toLocaleString("pt-PT", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });

// ──────────────────────────── entry point ────────────────────────────

export function PnLTable({
  entries,
  propertySlug,
  defaultDate,
}: {
  entries: PnLEntry[];
  propertySlug: string;
  defaultDate?: string;
}) {
  const entradas = entries.filter(
    (e): e is EntradaEntry => e.kind === "entrada",
  );
  const despesas = entries.filter(
    (e): e is DespesaEntry => e.kind === "despesa",
  );
  const lavandaria = entries.filter(
    (e): e is LavandariaEntry => e.kind === "lavandaria",
  );
  const funcionario = entries.filter(
    (e): e is FuncionarioEntry => e.kind === "funcionario",
  );

  return (
    <div className="space-y-10">
      <EntradaSection
        rows={entradas}
        property={propertySlug}
        defaultDate={defaultDate}
      />
      <DespesaSection
        rows={despesas}
        property={propertySlug}
        defaultDate={defaultDate}
      />
      <LavandariaSection
        rows={lavandaria}
        property={propertySlug}
        defaultDate={defaultDate}
      />
      <FuncionarioSection
        rows={funcionario}
        property={propertySlug}
        defaultDate={defaultDate}
      />
    </div>
  );
}

// ──────────────────────────── shell + state hook ────────────────────────────

type SectionMode =
  | { kind: "idle" }
  | { kind: "adding" }
  | { kind: "editing"; id: string };

function useSectionForm() {
  const router = useRouter();
  const [mode, setMode] = useState<SectionMode>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function open(next: SectionMode) {
    if (isPending) return;
    setError(null);
    setMode(next);
  }

  function close() {
    if (isPending) return;
    setMode({ kind: "idle" });
    setError(null);
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (mode.kind === "idle") return;
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result =
        mode.kind === "adding"
          ? await addEntryAction(formData)
          : await updateEntryAction(mode.id, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMode({ kind: "idle" });
      router.refresh();
    });
  }

  return { mode, open, close, submit, isPending, error };
}

function SectionShell({
  title,
  emoji,
  accent,
  count,
  addLabel,
  mode,
  onAdd,
  onCancelForm,
  formTitle,
  formContent,
  formSubmit,
  isPending,
  error,
  empty,
  meta,
  children,
}: {
  title: string;
  emoji: string;
  accent: Accent;
  count: number;
  addLabel: string;
  mode: SectionMode;
  onAdd: () => void;
  onCancelForm: () => void;
  formTitle: string;
  formContent: ReactNode;
  formSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  error: string | null;
  empty: string;
  /** Extra chip next to the count badge — e.g. "7,0 KG ESTE MÊS". */
  meta?: ReactNode;
  children: ReactNode;
}) {
  const acc = ACCENT[accent];
  const isOpen = mode.kind !== "idle";
  const isEditing = mode.kind === "editing";
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-white/[0.025] backdrop-blur-md ring-1 ${acc.ring}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <span aria-hidden className="text-xl">
            {emoji}
          </span>
          <h2 className="text-base font-semibold text-white sm:text-lg">
            {title}
          </h2>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
            {count} {count === 1 ? "entrada" : "entradas"}
          </span>
          {meta}
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={mode.kind === "adding" || isPending}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-white/80 transition hover:border-brand-cyan hover:text-white disabled:opacity-40"
        >
          {addLabel}
        </button>
      </header>

      {isOpen && (
        <div className="border-t border-white/5 px-5 py-5 sm:px-6">
          <form
            // Remount when switching between add / different editing rows so
            // defaultValue applies cleanly.
            key={mode.kind === "editing" ? `e-${mode.id}` : "adding"}
            onSubmit={formSubmit}
            className={`space-y-4 rounded-xl border p-4 sm:p-5 ${acc.formPanel}`}
          >
            <header className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">{formTitle}</h3>
              <button
                type="button"
                onClick={onCancelForm}
                disabled={isPending}
                className="text-white/45 transition hover:text-white disabled:opacity-50"
                aria-label="Fechar"
              >
                ✕
              </button>
            </header>

            {formContent}

            {error && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onCancelForm}
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-semibold transition disabled:opacity-50 ${acc.saveBtn}`}
              >
                {isPending
                  ? "A guardar…"
                  : isEditing
                    ? "Guardar alterações"
                    : "Registar"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="border-t border-white/5">
        {count === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-white/45 sm:px-6">
            {empty}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

// ──────────────────────────── shared bits ────────────────────────────

function Field({ label, children }: { label: string; children: ReactNode }) {
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
    <label className="inline-flex items-center gap-2 text-sm text-white/75">
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

function tableWrap(children: ReactNode) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-white/5 text-sm">
        {children}
      </table>
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      scope="col"
      className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 ${
        align === "right"
          ? "text-right"
          : align === "center"
            ? "text-center"
            : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  className = "",
}: {
  children: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <td
      className={`whitespace-nowrap px-5 py-3 ${
        align === "right"
          ? "text-right"
          : align === "center"
            ? "text-center"
            : "text-left"
      } ${className}`}
    >
      {children}
    </td>
  );
}

function EditButton({
  active,
  onClick,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={active ? "A editar esta entrada" : "Editar entrada"}
      className={`inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-semibold transition disabled:opacity-50 ${
        active
          ? "border-brand-cyan bg-brand-cyan/25 text-white"
          : "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan hover:border-brand-cyan hover:bg-brand-cyan/20"
      }`}
    >
      <span aria-hidden className="text-sm leading-none">
        ✎
      </span>
      {active ? "A editar" : "Editar"}
    </button>
  );
}

// ──────────────────────────── ENTRADA ────────────────────────────

function EntradaSection({
  rows,
  property,
  defaultDate,
}: {
  rows: EntradaEntry[];
  property: string;
  defaultDate?: string;
}) {
  const { mode, open, close, submit, isPending, error } = useSectionForm();
  const editing =
    mode.kind === "editing" ? rows.find((r) => r.id === mode.id) : undefined;
  const today = defaultDate ?? new Date().toISOString().slice(0, 10);

  const formTitle =
    mode.kind === "editing" && editing
      ? `Editar entrada · ${ddmmyyyy(editing.date)}`
      : "Nova entrada (reserva / receita)";

  return (
    <SectionShell
      title="Entradas"
      emoji="💰"
      accent="cyan"
      count={rows.length}
      addLabel="+ Adicionar entrada"
      mode={mode}
      onAdd={() => open({ kind: "adding" })}
      onCancelForm={close}
      formTitle={formTitle}
      formContent={
        <EntradaFormFields
          property={property}
          editing={editing}
          today={today}
        />
      }
      formSubmit={submit}
      isPending={isPending}
      error={error}
      empty="Nenhuma entrada registada neste mês."
    >
      <EntradaTable
        rows={rows}
        property={property}
        editingId={mode.kind === "editing" ? mode.id : null}
        isPending={isPending}
        onEdit={(id) => open({ kind: "editing", id })}
      />
    </SectionShell>
  );
}

function EntradaFormFields({
  property,
  editing,
  today,
}: {
  property: string;
  editing: EntradaEntry | undefined;
  today: string;
}) {
  // Mounts fresh whenever the parent <form> remounts (via its key), so
  // useState seeds correctly off `editing`.
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const ivaSuggestion = amount
    ? (Number(amount.replace(",", ".")) * 0.06).toFixed(2)
    : "";
  return (
    <>
      <input type="hidden" name="property" value={property} />
      <input type="hidden" name="kind" value="entrada" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Data">
          <input
            type="date"
            name="date"
            required
            defaultValue={editing?.date ?? today}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Janela da estadia">
          <input
            type="text"
            name="stayWindow"
            required
            placeholder="ex: 11/05-15/05"
            defaultValue={editing?.stayWindow ?? editing?.description ?? ""}
            className={INPUT_CLASS}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Valor (€)">
          <input
            type="number"
            name="amount"
            step="0.01"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Pessoa">
          <select
            name="person"
            defaultValue={editing?.person ?? "André"}
            className={INPUT_CLASS}
          >
            {PEOPLE.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="IVA (€) — sugestão 6%">
          <input
            type="number"
            name="iva"
            step="0.01"
            min="0"
            defaultValue={editing?.iva ?? ivaSuggestion}
            placeholder={ivaSuggestion}
            className={INPUT_CLASS}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Check
          name="recebido"
          label="Recebido"
          defaultChecked={editing ? editing.recebido : true}
        />
        <Check
          name="noBanco"
          label="Já entrou no banco"
          defaultChecked={editing ? editing.noBanco : true}
        />
        <Check
          name="inIvaVault"
          label="IVA já no Vault"
          defaultChecked={editing ? editing.inIvaVault : false}
        />
      </div>
    </>
  );
}

function EntradaTable({
  rows,
  property,
  editingId,
  isPending,
  onEdit,
}: {
  rows: EntradaEntry[];
  property: string;
  editingId: string | null;
  isPending: boolean;
  onEdit: (id: string) => void;
}) {
  const sorted = [...rows].sort((a, b) => (a.date < b.date ? -1 : 1));
  return tableWrap(
    <>
      <thead>
        <tr>
          <Th>Data</Th>
          <Th>Estadia</Th>
          <Th>Pessoa</Th>
          <Th align="right">Valor</Th>
          <Th align="right">IVA</Th>
          <Th align="center">Estado</Th>
          <Th align="center"> </Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {sorted.map((r) => {
          const editing = editingId === r.id;
          return (
            <tr
              key={r.id}
              className={`transition ${editing ? ACCENT.cyan.rowEditing : "hover:bg-white/[0.025]"}`}
            >
              <Td className="text-white/65">{ddmmyyyy(r.date)}</Td>
              <Td className="text-white">{r.stayWindow ?? r.description}</Td>
              <Td>
                <PersonPillEditable
                  entryId={r.id}
                  property={property}
                  person={r.person}
                />
              </Td>
              <Td align="right" className="font-semibold text-brand-cyan">
                {eur(r.amount)}
              </Td>
              <Td align="right" className="text-white/65">
                {eur(r.iva)}
              </Td>
              <Td align="center">
                <div className="flex flex-wrap justify-center gap-1">
                  <ToggleChip
                    entryId={r.id}
                    property={property}
                    flag="recebido"
                    active={r.recebido}
                    label="Recebido"
                    tone="good"
                  />
                  <ToggleChip
                    entryId={r.id}
                    property={property}
                    flag="noBanco"
                    active={r.noBanco}
                    label="No banco"
                    tone="good"
                  />
                  <ToggleChip
                    entryId={r.id}
                    property={property}
                    flag="inIvaVault"
                    active={r.inIvaVault}
                    label="IVA Vault"
                    tone="good"
                  />
                </div>
              </Td>
              <Td align="center">
                <div className="inline-flex items-center gap-1">
                  <EditButton
                    active={editing}
                    disabled={isPending}
                    onClick={() => onEdit(r.id)}
                  />
                  <DeleteEntryButton id={r.id} property={property} />
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </>,
  );
}

// ──────────────────────────── DESPESA ────────────────────────────

function DespesaSection({
  rows,
  property,
  defaultDate,
}: {
  rows: DespesaEntry[];
  property: string;
  defaultDate?: string;
}) {
  const { mode, open, close, submit, isPending, error } = useSectionForm();
  const editing =
    mode.kind === "editing" ? rows.find((r) => r.id === mode.id) : undefined;
  const today = defaultDate ?? new Date().toISOString().slice(0, 10);

  const formTitle =
    mode.kind === "editing" && editing
      ? `Editar custo · ${ddmmyyyy(editing.date)}`
      : "Novo custo";

  const formContent = (
    <>
      <input type="hidden" name="property" value={property} />
      <input type="hidden" name="kind" value="despesa" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Data">
          <input
            type="date"
            name="date"
            required
            defaultValue={editing?.date ?? today}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Descrição">
          <input
            type="text"
            name="description"
            required
            placeholder="ex: Pingo Doce"
            defaultValue={editing?.description ?? ""}
            className={INPUT_CLASS}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Valor (€)">
          <input
            type="number"
            name="amount"
            step="0.01"
            min="0"
            required
            defaultValue={editing?.amount}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Pessoa pagou">
          <select
            name="person"
            defaultValue={editing?.person ?? "André"}
            className={INPUT_CLASS}
          >
            {PEOPLE.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Check
        name="outOfAccount"
        label="Saiu da conta da empresa"
        defaultChecked={editing ? editing.outOfAccount : false}
      />
    </>
  );

  return (
    <SectionShell
      title="Custos"
      emoji="💸"
      accent="rose"
      count={rows.length}
      addLabel="+ Adicionar custo"
      mode={mode}
      onAdd={() => open({ kind: "adding" })}
      onCancelForm={close}
      formTitle={formTitle}
      formContent={formContent}
      formSubmit={submit}
      isPending={isPending}
      error={error}
      empty="Sem custos neste mês."
    >
      <DespesaTable
        rows={rows}
        property={property}
        editingId={mode.kind === "editing" ? mode.id : null}
        isPending={isPending}
        onEdit={(id) => open({ kind: "editing", id })}
      />
    </SectionShell>
  );
}

function DespesaTable({
  rows,
  property,
  editingId,
  isPending,
  onEdit,
}: {
  rows: DespesaEntry[];
  property: string;
  editingId: string | null;
  isPending: boolean;
  onEdit: (id: string) => void;
}) {
  const sorted = [...rows].sort((a, b) => (a.date < b.date ? -1 : 1));
  return tableWrap(
    <>
      <thead>
        <tr>
          <Th>Data</Th>
          <Th>Descrição</Th>
          <Th>Pessoa pagou</Th>
          <Th align="right">Valor</Th>
          <Th align="center">Conta</Th>
          <Th align="center"> </Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {sorted.map((r) => {
          const editing = editingId === r.id;
          return (
            <tr
              key={r.id}
              className={`transition ${editing ? ACCENT.rose.rowEditing : "hover:bg-white/[0.025]"}`}
            >
              <Td className="text-white/65">{ddmmyyyy(r.date)}</Td>
              <Td className="text-white">{r.description}</Td>
              <Td>
                <PersonPillEditable
                  entryId={r.id}
                  property={property}
                  person={r.person}
                />
              </Td>
              <Td align="right" className="font-semibold text-rose-200">
                −{eur(r.amount)}
              </Td>
              <Td align="center">
                <ToggleChip
                  entryId={r.id}
                  property={property}
                  flag="outOfAccount"
                  active={r.outOfAccount}
                  label={r.outOfAccount ? "Conta empresa" : "Conta pessoal"}
                  tone={r.outOfAccount ? "neutral" : "warn"}
                />
              </Td>
              <Td align="center">
                <div className="inline-flex items-center gap-1">
                  <EditButton
                    active={editing}
                    disabled={isPending}
                    onClick={() => onEdit(r.id)}
                  />
                  <DeleteEntryButton id={r.id} property={property} />
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </>,
  );
}

// ──────────────────────────── LAVANDARIA ────────────────────────────

function LavandariaSection({
  rows,
  property,
  defaultDate,
}: {
  rows: LavandariaEntry[];
  property: string;
  defaultDate?: string;
}) {
  const { mode, open, close, submit, isPending, error } = useSectionForm();
  const editing =
    mode.kind === "editing" ? rows.find((r) => r.id === mode.id) : undefined;
  const today = defaultDate ?? new Date().toISOString().slice(0, 10);

  const totalKg = rows.reduce((sum, r) => sum + r.weightKg, 0);
  const meta =
    totalKg > 0 ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200">
        <span aria-hidden>🧮</span>
        {formatKg(totalKg)} kg este mês
      </span>
    ) : null;

  const formTitle =
    mode.kind === "editing" && editing
      ? `Editar lavandaria · ${ddmmyyyy(editing.date)}`
      : "Nova ida à lavandaria";

  const formContent = (
    <>
      <input type="hidden" name="property" value={property} />
      <input type="hidden" name="kind" value="lavandaria" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Data">
          <input
            type="date"
            name="date"
            required
            defaultValue={editing?.date ?? today}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Descrição">
          <input
            type="text"
            value="Lavandaria"
            disabled
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Peso de roupa (kg)">
          <input
            type="number"
            name="weightKg"
            step="0.1"
            min="0"
            required
            defaultValue={editing?.weightKg}
            placeholder="ex: 12.5"
            className={INPUT_CLASS}
          />
        </Field>
      </div>
    </>
  );

  return (
    <SectionShell
      title="Lavandaria"
      emoji="🧺"
      accent="violet"
      count={rows.length}
      addLabel="+ Adicionar lavandaria"
      mode={mode}
      onAdd={() => open({ kind: "adding" })}
      onCancelForm={close}
      formTitle={formTitle}
      formContent={formContent}
      formSubmit={submit}
      isPending={isPending}
      error={error}
      empty="Sem idas à lavandaria neste mês."
      meta={meta}
    >
      <LavandariaTable
        rows={rows}
        property={property}
        editingId={mode.kind === "editing" ? mode.id : null}
        isPending={isPending}
        onEdit={(id) => open({ kind: "editing", id })}
      />
    </SectionShell>
  );
}

function LavandariaTable({
  rows,
  property,
  editingId,
  isPending,
  onEdit,
}: {
  rows: LavandariaEntry[];
  property: string;
  editingId: string | null;
  isPending: boolean;
  onEdit: (id: string) => void;
}) {
  const sorted = [...rows].sort((a, b) => (a.date < b.date ? -1 : 1));
  const totalKg = sorted.reduce((sum, r) => sum + r.weightKg, 0);
  return tableWrap(
    <>
      <thead>
        <tr>
          <Th>Data</Th>
          <Th>Descrição</Th>
          <Th align="right">Peso (kg)</Th>
          <Th align="center"> </Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {sorted.map((r) => {
          const editing = editingId === r.id;
          return (
            <tr
              key={r.id}
              className={`transition ${editing ? ACCENT.violet.rowEditing : "hover:bg-white/[0.025]"}`}
            >
              <Td className="text-white/65">{ddmmyyyy(r.date)}</Td>
              <Td className="text-white">{r.description}</Td>
              <Td align="right" className="font-semibold text-violet-200">
                {formatKg(r.weightKg)} kg
              </Td>
              <Td align="center">
                <div className="inline-flex items-center gap-1">
                  <EditButton
                    active={editing}
                    disabled={isPending}
                    onClick={() => onEdit(r.id)}
                  />
                  <DeleteEntryButton id={r.id} property={property} />
                </div>
              </Td>
            </tr>
          );
        })}
        {sorted.length > 1 && (
          <tr className="bg-white/[0.02]">
            <Td className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Total
            </Td>
            <Td className="text-white/55"> </Td>
            <Td align="right" className="font-semibold text-violet-200">
              {formatKg(totalKg)} kg
            </Td>
            <Td className="text-white/55"> </Td>
          </tr>
        )}
      </tbody>
    </>,
  );
}

// ──────────────────────────── FUNCIONÁRIO ────────────────────────────

function FuncionarioSection({
  rows,
  property,
  defaultDate,
}: {
  rows: FuncionarioEntry[];
  property: string;
  defaultDate?: string;
}) {
  const { mode, open, close, submit, isPending, error } = useSectionForm();
  const editing =
    mode.kind === "editing" ? rows.find((r) => r.id === mode.id) : undefined;
  const today = defaultDate ?? new Date().toISOString().slice(0, 10);

  const formTitle =
    mode.kind === "editing" && editing
      ? `Editar pagamento · ${ddmmyyyy(editing.date)}`
      : "Novo pagamento a funcionário";

  const formContent = (
    <>
      <input type="hidden" name="property" value={property} />
      <input type="hidden" name="kind" value="funcionario" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Data">
          <input
            type="date"
            name="date"
            required
            defaultValue={editing?.date ?? today}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Descrição">
          <input
            type="text"
            name="description"
            required
            placeholder="ex: Limpeza"
            defaultValue={editing?.description ?? ""}
            className={INPUT_CLASS}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Valor (€)">
          <input
            type="number"
            name="amount"
            step="0.01"
            min="0"
            required
            defaultValue={editing?.amount}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Pessoa pagou">
          <select
            name="person"
            defaultValue={editing?.person ?? "André"}
            className={INPUT_CLASS}
          >
            {PEOPLE.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Check
          name="pago"
          label="Já pago"
          defaultChecked={editing ? editing.pago : true}
        />
        <Check
          name="outOfAccount"
          label="Saiu da conta da empresa"
          defaultChecked={editing ? editing.outOfAccount : false}
        />
      </div>
    </>
  );

  return (
    <SectionShell
      title="Funcionário"
      emoji="👷"
      accent="amber"
      count={rows.length}
      addLabel="+ Adicionar pagamento"
      mode={mode}
      onAdd={() => open({ kind: "adding" })}
      onCancelForm={close}
      formTitle={formTitle}
      formContent={formContent}
      formSubmit={submit}
      isPending={isPending}
      error={error}
      empty="Sem pagamentos a funcionários neste mês."
    >
      <FuncionarioTable
        rows={rows}
        property={property}
        editingId={mode.kind === "editing" ? mode.id : null}
        isPending={isPending}
        onEdit={(id) => open({ kind: "editing", id })}
      />
    </SectionShell>
  );
}

function FuncionarioTable({
  rows,
  property,
  editingId,
  isPending,
  onEdit,
}: {
  rows: FuncionarioEntry[];
  property: string;
  editingId: string | null;
  isPending: boolean;
  onEdit: (id: string) => void;
}) {
  const sorted = [...rows].sort((a, b) => (a.date < b.date ? -1 : 1));
  return tableWrap(
    <>
      <thead>
        <tr>
          <Th>Data</Th>
          <Th>Descrição</Th>
          <Th>Pessoa pagou</Th>
          <Th align="right">Valor</Th>
          <Th align="center">Estado</Th>
          <Th align="center"> </Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {sorted.map((r) => {
          const editing = editingId === r.id;
          return (
            <tr
              key={r.id}
              className={`transition ${editing ? ACCENT.amber.rowEditing : "hover:bg-white/[0.025]"}`}
            >
              <Td className="text-white/65">{ddmmyyyy(r.date)}</Td>
              <Td className="text-white">{r.description}</Td>
              <Td>
                <PersonPillEditable
                  entryId={r.id}
                  property={property}
                  person={r.person}
                />
              </Td>
              <Td align="right" className="font-semibold text-amber-200">
                −{eur(r.amount)}
              </Td>
              <Td align="center">
                <div className="flex flex-wrap justify-center gap-1">
                  <ToggleChip
                    entryId={r.id}
                    property={property}
                    flag="pago"
                    active={r.pago}
                    label="Pago"
                    tone="good"
                  />
                  <ToggleChip
                    entryId={r.id}
                    property={property}
                    flag="outOfAccount"
                    active={r.outOfAccount}
                    label={r.outOfAccount ? "Conta empresa" : "Conta pessoal"}
                    tone={r.outOfAccount ? "neutral" : "warn"}
                  />
                </div>
              </Td>
              <Td align="center">
                <div className="inline-flex items-center gap-1">
                  <EditButton
                    active={editing}
                    disabled={isPending}
                    onClick={() => onEdit(r.id)}
                  />
                  <DeleteEntryButton id={r.id} property={property} />
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </>,
  );
}

