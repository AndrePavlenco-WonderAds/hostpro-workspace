// Per-month P&L for one property, broken into three sections
// (Entradas / Custos / Funcionário) so the schema matches the spreadsheet
// mental model exactly.

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

export function PnLTable({
  entries,
  propertySlug,
}: {
  entries: PnLEntry[];
  propertySlug: string;
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
        onAdd={<AddEntryDialog kind="entrada" property={propertySlug} />}
        empty="Nenhuma entrada registada neste mês."
      >
        {entradas.length > 0 && <EntradaTable rows={entradas} property={propertySlug} />}
      </Section>

      <Section
        title="Custos"
        accent="rose"
        emoji="💸"
        count={despesas.length}
        onAdd={<AddEntryDialog kind="despesa" property={propertySlug} />}
        empty="Sem custos neste mês."
      >
        {despesas.length > 0 && <DespesaTable rows={despesas} property={propertySlug} />}
      </Section>

      <Section
        title="Funcionário"
        accent="amber"
        emoji="👷"
        count={funcionario.length}
        onAdd={<AddEntryDialog kind="funcionario" property={propertySlug} />}
        empty="Sem pagamentos a funcionários neste mês."
      >
        {funcionario.length > 0 && <FuncionarioTable rows={funcionario} property={propertySlug} />}
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

function PersonPill({ person }: { person: string }) {
  const tone =
    person === "André"
      ? "bg-brand-cyan/15 text-brand-cyan ring-brand-cyan/30"
      : person === "Carol"
        ? "bg-fuchsia-400/15 text-fuchsia-200 ring-fuchsia-400/30"
        : "bg-amber-300/15 text-amber-200 ring-amber-300/30";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${tone}`}
    >
      {person}
    </span>
  );
}

function StatusChip({
  label,
  active,
  tone = "neutral",
}: {
  label: string;
  active: boolean;
  tone?: "neutral" | "good" | "warn";
}) {
  if (!active) {
    return (
      <span className="inline-flex items-center rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/35 ring-1 ring-white/10">
        {label}
      </span>
    );
  }
  const cls =
    tone === "good"
      ? "bg-emerald-400/15 text-emerald-200 ring-emerald-400/30"
      : tone === "warn"
        ? "bg-amber-300/15 text-amber-200 ring-amber-300/30"
        : "bg-white/[0.08] text-white/80 ring-white/15";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${cls}`}>
      {label}
    </span>
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
              <PersonPill person={r.person} />
            </Td>
            <Td align="right" className="font-semibold text-brand-cyan">
              {eur(r.amount)}
            </Td>
            <Td align="right" className="text-white/65">
              {eur(r.iva)}
            </Td>
            <Td align="center">
              <div className="flex flex-wrap justify-center gap-1">
                <StatusChip label="Recebido" active={r.recebido} tone="good" />
                <StatusChip label="No banco" active={r.noBanco} tone="good" />
                <StatusChip label="IVA Vault" active={r.inIvaVault} tone="good" />
              </div>
            </Td>
            <Td align="center">
              <DeleteEntryButton id={r.id} property={property} />
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
          <Th>Pessoa</Th>
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
              <PersonPill person={r.person} />
            </Td>
            <Td align="right" className="font-semibold text-rose-200">
              −{eur(r.amount)}
            </Td>
            <Td align="center">
              <StatusChip
                label={r.outOfAccount ? "Conta empresa" : "Conta pessoal"}
                active
                tone={r.outOfAccount ? "neutral" : "warn"}
              />
            </Td>
            <Td align="center">
              <DeleteEntryButton id={r.id} property={property} />
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
          <Th>Pessoa</Th>
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
              <PersonPill person={r.person} />
            </Td>
            <Td align="right" className="font-semibold text-amber-200">
              −{eur(r.amount)}
            </Td>
            <Td align="center">
              <div className="flex flex-wrap justify-center gap-1">
                <StatusChip label="Pago" active={r.pago} tone="good" />
                <StatusChip
                  label={r.outOfAccount ? "Out of account" : "Conta HostPro"}
                  active
                  tone={r.outOfAccount ? "warn" : "neutral"}
                />
              </div>
            </Td>
            <Td align="center">
              <DeleteEntryButton id={r.id} property={property} />
            </Td>
          </tr>
        ))}
      </tbody>
    </>,
  );
}
