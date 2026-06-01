// Per-month P&L for one property, broken into three sections
// (Entradas / Custos / Funcionário) so the schema matches the spreadsheet
// mental model exactly.
//
// v0.5.3 — chips de estado e pill da pessoa passam a ser clicáveis para
// permitir editar inline sem abrir o modal completo. Cada um chama uma
// server action específica (toggleFlagAction / changePersonAction) com
// optimistic UI.

import { ddmmyyyy } from "@/lib/dates";
import { eur } from "@/lib/money";
import type {
  PnLEntry,
  DespesaEntry,
  EntradaEntry,
  FuncionarioEntry,
} from "@/lib/pnl-types";
import { AddEntryDialog } from "./add-entry-dialog";
import { DeleteEntryButton } from "./delete-entry-button";
import { EditEntryButton } from "./edit-entry-button";
import { ToggleChip } from "./toggle-chip";
import { PersonPillEditable } from "./person-pill-editable";

export function PnLTable({
  entries,
  propertySlug,
  defaultDate,
}: {
  entries: PnLEntry[];
  propertySlug: string;
  /** ISO date to pre-fill in the Add Entry dialog — derived from the viewed
   *  month so adding a custo while looking at May lands in May, not June. */
  defaultDate?: string;
}) {
  const entradas = entries.filter((e): e is EntradaEntry => e.kind === "entrada");
  const despesas = entries.filter((e): e is DespesaEntry => e.kind === "despesa");
  const funcionario = entries.filter(
    (e): e is FuncionarioEntry => e.kind === "funcionario",
  );

  return (
    <div className="space-y-10">
      <Section
        title="Entradas"
        accent="cyan"
        emoji="💰"
        count={entradas.length}
        onAdd={<AddEntryDialog kind="entrada" property={propertySlug} defaultDate={defaultDate} />}
        empty="Nenhuma entrada registada neste mês."
      >
        {entradas.length > 0 && (
          <EntradaTable rows={entradas} property={propertySlug} />
        )}
      </Section>

      <Section
        title="Custos"
        accent="rose"
        emoji="💸"
        count={despesas.length}
        onAdd={<AddEntryDialog kind="despesa" property={propertySlug} defaultDate={defaultDate} />}
        empty="Sem custos neste mês."
      >
        {despesas.length > 0 && (
          <DespesaTable rows={despesas} property={propertySlug} />
        )}
      </Section>

      <Section
        title="Funcionário"
        accent="amber"
        emoji="👷"
        count={funcionario.length}
        onAdd={<AddEntryDialog kind="funcionario" property={propertySlug} defaultDate={defaultDate} />}
        empty="Sem pagamentos a funcionários neste mês."
      >
        {funcionario.length > 0 && (
          <FuncionarioTable rows={funcionario} property={propertySlug} />
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  emoji,
  accent,
  count,
  children,
  onAdd,
  empty,
}: {
  title: string;
  emoji: string;
  accent: "cyan" | "rose" | "amber";
  count: number;
  children: React.ReactNode;
  onAdd: React.ReactNode;
  empty: string;
}) {
  const accentRing =
    accent === "cyan"
      ? "ring-brand-cyan/30"
      : accent === "rose"
        ? "ring-rose-400/30"
        : "ring-amber-300/30";
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-white/[0.025] backdrop-blur-md ring-1 ${accentRing}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-xl">
            {emoji}
          </span>
          <h2 className="text-base font-semibold text-white sm:text-lg">{title}</h2>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
            {count} {count === 1 ? "entrada" : "entradas"}
          </span>
        </div>
        {onAdd}
      </header>
      <div className="border-t border-white/5">
        {count === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-white/45 sm:px-6">{empty}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function tableWrap(children: React.ReactNode) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-white/5 text-sm">{children}</table>
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" | "center" }) {
  return (
    <th
      scope="col"
      className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
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
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <td
      className={`whitespace-nowrap px-5 py-3 ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
      } ${className}`}
    >
      {children}
    </td>
  );
}

function EntradaTable({ rows, property }: { rows: EntradaEntry[]; property: string }) {
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
        {sorted.map((r) => (
          <tr key={r.id} className="transition hover:bg-white/[0.025]">
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
                <EditEntryButton entry={r} />
                <DeleteEntryButton id={r.id} property={property} />
              </div>
            </Td>
          </tr>
        ))}
      </tbody>
    </>,
  );
}

function DespesaTable({ rows, property }: { rows: DespesaEntry[]; property: string }) {
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
        {sorted.map((r) => (
          <tr key={r.id} className="transition hover:bg-white/[0.025]">
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
                <EditEntryButton entry={r} />
                <DeleteEntryButton id={r.id} property={property} />
              </div>
            </Td>
          </tr>
        ))}
      </tbody>
    </>,
  );
}

function FuncionarioTable({ rows, property }: { rows: FuncionarioEntry[]; property: string }) {
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
        {sorted.map((r) => (
          <tr key={r.id} className="transition hover:bg-white/[0.025]">
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
                <EditEntryButton entry={r} />
                <DeleteEntryButton id={r.id} property={property} />
              </div>
            </Td>
          </tr>
        ))}
      </tbody>
    </>,
  );
}
