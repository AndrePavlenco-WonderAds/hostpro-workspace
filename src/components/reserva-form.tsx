"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { eur } from "@/lib/money";
import type { PropertyBilling } from "@/lib/property-billing";

type Banking = {
  bank: string;
  beneficiary: string;
  iban: string;
  swift: string;
};

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function checkinLabel(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "—";
  const [, m, d] = iso.split("-").map(Number);
  return `${d} de ${MONTHS_PT[m - 1]}`;
}

function checkoutISO(checkinISO: string, nights: number): string {
  if (!checkinISO) return "";
  const d = new Date(checkinISO + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + Math.max(0, Math.floor(nights)));
  return d.toISOString().slice(0, 10);
}

export function ReservaForm({
  property,
  billing,
  banking,
  tagline,
}: {
  property: { slug: string; name: string; shortName: string };
  billing: PropertyBilling;
  banking: Banking;
  tagline: string;
}) {
  // Form state
  const [clientName, setClientName] = useState("");
  const [checkinDate, setCheckinDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [nights, setNights] = useState(1);
  const [nightlyRate, setNightlyRate] = useState(billing.defaultNightlyRate);
  const [discount, setDiscount] = useState(0);
  const [cleaningFee, setCleaningFee] = useState(billing.defaultCleaningFee);
  const [otherTaxesPct, setOtherTaxesPct] = useState(0);
  const [notes, setNotes] = useState("");

  // Banking — editable in case Andre wants to send via a different account.
  const [bank, setBank] = useState(banking.bank);
  const [beneficiary, setBeneficiary] = useState(banking.beneficiary);
  const [iban, setIban] = useState(banking.iban);
  const [swift, setSwift] = useState(banking.swift);

  // Computed totals
  const totals = useMemo(() => {
    const ratePerNight = Math.max(0, nightlyRate);
    const discountPerNight = Math.max(0, discount);
    const finalRate = Math.max(0, ratePerNight - discountPerNight);
    const stayTotal = finalRate * Math.max(0, nights);
    const cleaning = Math.max(0, cleaningFee);
    const subtotal = stayTotal + cleaning;
    const otherTaxes = subtotal * (Math.max(0, otherTaxesPct) / 100);
    const total = subtotal + otherTaxes;
    return {
      ratePerNight,
      discountPerNight,
      finalRate,
      stayTotal,
      cleaning,
      subtotal,
      otherTaxes,
      total,
    };
  }, [nightlyRate, discount, nights, cleaningFee, otherTaxesPct]);

  const checkoutDate = checkoutISO(checkinDate, nights);

  return (
    <div className="reserva-page font-sans">
      <style jsx global>{`
        /* Print: hide everything except the invoice card, render at A4. */
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }
          html,
          body {
            background: #ffffff !important;
          }
          .reserva-form-aside,
          .reserva-toolbar {
            display: none !important;
          }
          .reserva-print-area {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            width: 100% !important;
          }
          .reserva-print-area,
          .reserva-print-area * {
            color: #111 !important;
          }
          .reserva-print-area .preco-noite-original {
            color: #444 !important;
          }
          /* Keep the bottom block (Obrigado! + bank info) on the same page as
             the totals. Without these the renderer would happily push the
             footer alone to page 2. */
          .reserva-print-area {
            font-size: 13px;
          }
          .reserva-bank-block,
          .reserva-footer-block,
          .reserva-totals-block {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .reserva-footer-block {
            break-before: avoid;
            page-break-before: avoid;
          }
        }
      `}</style>

      {/* Toolbar */}
      <header className="reserva-toolbar sticky top-0 z-20 border-b border-white/10 bg-brand-navy-dark/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-10">
          <Link
            href={`/alojamentos/${property.slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-brand-cyan hover:text-white"
          >
            ← {property.shortName}
          </Link>
          <h1 className="hidden text-sm font-semibold uppercase tracking-[0.18em] text-white/65 sm:inline sm:text-base">
            Nova reserva
          </h1>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-brand-cyan px-4 py-2 text-xs font-semibold text-brand-navy shadow-[0_10px_30px_-8px_rgba(0,181,226,0.6)] transition hover:opacity-90 sm:px-5"
          >
            🖨 <span className="hidden xs:inline sm:inline">Imprimir / Gravar PDF</span><span className="sm:hidden">PDF</span>
          </button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6 sm:gap-6 sm:px-10 sm:py-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start">
        {/* Form aside */}
        <aside className="reserva-form-aside space-y-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4 backdrop-blur-md sm:p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
            Dados da reserva
          </h2>

          <Field label="Nome do cliente">
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="ex: João Silva"
              className="rsv-input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Check-in">
              <input
                type="date"
                value={checkinDate}
                onChange={(e) => setCheckinDate(e.target.value)}
                className="rsv-input"
              />
            </Field>
            <Field label="Nº de noites">
              <input
                type="number"
                min={1}
                value={nights}
                onChange={(e) => setNights(Number(e.target.value) || 0)}
                className="rsv-input"
              />
            </Field>
          </div>

          {checkoutDate && (
            <p className="-mt-2 text-[11px] text-white/45">
              Check-out: {checkinLabel(checkoutDate)}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Preço / noite (€)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={nightlyRate}
                onChange={(e) => setNightlyRate(Number(e.target.value) || 0)}
                className="rsv-input"
              />
            </Field>
            <Field label="Desconto / noite (€)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="rsv-input"
              />
            </Field>
          </div>

          <Field label="Taxa de limpeza (€)">
            <input
              type="number"
              step="0.01"
              min="0"
              value={cleaningFee}
              onChange={(e) => setCleaningFee(Number(e.target.value) || 0)}
              className="rsv-input"
            />
          </Field>

          <Field label="Outras taxas (%)">
            <input
              type="number"
              step="0.1"
              min="0"
              value={otherTaxesPct}
              onChange={(e) => setOtherTaxesPct(Number(e.target.value) || 0)}
              className="rsv-input"
            />
          </Field>

          <details className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Dados bancários
            </summary>
            <div className="mt-3 space-y-3">
              <Field label="Banco">
                <input
                  type="text"
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="rsv-input"
                />
              </Field>
              <Field label="Beneficiário">
                <input
                  type="text"
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  className="rsv-input"
                />
              </Field>
              <Field label="IBAN">
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  className="rsv-input"
                />
              </Field>
              <Field label="SWIFT">
                <input
                  type="text"
                  value={swift}
                  onChange={(e) => setSwift(e.target.value)}
                  className="rsv-input"
                />
              </Field>
            </div>
          </details>

          <Field label="Observações (opcional, não aparece no PDF)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rsv-input resize-none"
            />
          </Field>

          <p className="rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-2 text-[11px] text-brand-cyan/85">
            💡 Carrega <strong>🖨 Imprimir / Gravar PDF</strong> e o teu browser
            mostra o diálogo de impressão. Em &quot;Destino&quot; escolhe
            &quot;Guardar como PDF&quot;.
          </p>
        </aside>

        {/* Invoice preview */}
        <section className="reserva-print-area rounded-2xl border border-white/10 bg-white p-5 text-zinc-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] sm:p-8 md:p-10">
          <InvoiceBody
            propertyName={property.name}
            clientName={clientName}
            addressLines={billing.addressLines}
            checkinLabel={checkinLabel(checkinDate)}
            nights={nights}
            nightlyRate={totals.ratePerNight}
            finalRate={totals.finalRate}
            discount={totals.discountPerNight}
            stayTotal={totals.stayTotal}
            cleaning={totals.cleaning}
            subtotal={totals.subtotal}
            otherTaxesPct={otherTaxesPct}
            otherTaxesAmount={totals.otherTaxes}
            total={totals.total}
            banking={{ bank, beneficiary, iban, swift }}
            tagline={tagline}
          />
        </section>
      </div>

      <style jsx global>{`
        .rsv-input {
          width: 100%;
          border-radius: 0.625rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.5rem 0.7rem;
          font-size: 0.85rem;
          color: white;
          outline: none;
          transition: border-color 0.15s;
        }
        .rsv-input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }
        .rsv-input:focus {
          border-color: rgb(0, 181, 226);
        }
        .rsv-input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1) brightness(0.7);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
        {label}
      </span>
      {children}
    </label>
  );
}

// ------- Invoice body — matches the reference PDF -------

function InvoiceBody({
  propertyName,
  clientName,
  addressLines,
  checkinLabel,
  nights,
  nightlyRate,
  finalRate,
  discount,
  stayTotal,
  cleaning,
  subtotal,
  otherTaxesPct,
  otherTaxesAmount,
  total,
  banking,
  tagline,
}: {
  propertyName: string;
  clientName: string;
  addressLines: string[];
  checkinLabel: string;
  nights: number;
  nightlyRate: number;
  finalRate: number;
  discount: number;
  stayTotal: number;
  cleaning: number;
  subtotal: number;
  otherTaxesPct: number;
  otherTaxesAmount: number;
  total: number;
  banking: Banking;
  tagline: string;
}) {
  const hasDiscount = discount > 0;
  return (
    <div className="font-sans">
      {/* Top — logo + RESERVA title */}
      <header className="flex items-start justify-between gap-4">
        <Image
          src="/favicon.svg"
          alt="HostPro"
          width={64}
          height={64}
          className="h-10 w-10 sm:h-14 sm:w-14"
        />
        <h1
          className="font-serif text-4xl font-medium leading-none tracking-tight text-zinc-900 sm:text-6xl"
          style={{ fontFamily: "var(--font-cormorant), serif" }}
        >
          RESERVA
        </h1>
      </header>

      {/* CLIENTE | APARTAMENTO */}
      <section className="mt-6 grid grid-cols-2 gap-4 text-xs sm:mt-8 sm:gap-6 sm:text-sm">
        <div>
          <p className="font-bold uppercase tracking-wide">CLIENTE:</p>
          <p className="mt-2 whitespace-pre-line text-zinc-700">
            {clientName || "—"}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold uppercase tracking-wide">APARTAMENTO:</p>
          <div className="mt-2 text-zinc-700">
            {addressLines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="reserva-totals-block mt-6 sm:mt-8">
        <table className="w-full border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-zinc-300">
              <th className="py-3 text-left font-bold uppercase tracking-wide">Item</th>
              <th className="py-3 text-center font-bold uppercase tracking-wide">Preço Noite</th>
              <th className="py-3 text-center font-bold uppercase tracking-wide">Desconto</th>
              <th className="py-3 text-right font-bold uppercase tracking-wide">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-zinc-200">
              <td className="py-4 align-top">
                <p>{propertyName}</p>
                <p className="text-zinc-700">Check-in: {checkinLabel}</p>
                {nights > 1 && (
                  <p className="text-zinc-500">{nights} noites</p>
                )}
              </td>
              <td className="py-4 text-center">
                {hasDiscount ? (
                  <span className="preco-noite-original text-zinc-500 line-through">
                    {eurNoSpace(nightlyRate)}
                  </span>
                ) : (
                  <span>{eurNoSpace(nightlyRate)}</span>
                )}
              </td>
              <td className="py-4 text-center">
                {hasDiscount ? eurNoSpace(discount) : "—"}
              </td>
              <td className="py-4 text-right">
                {eurNoSpace(stayTotal)}
              </td>
            </tr>

            <tr className="border-b border-zinc-200">
              <td className="py-4 align-top">Taxa de Limpeza</td>
              <td />
              <td />
              <td className="py-4 text-right">
                {cleaning > 0 ? eurNoSpace(cleaning) : "-"}
              </td>
            </tr>

            <tr>
              <td colSpan={3} className="py-4 text-center font-bold">
                Subtotal
              </td>
              <td className="py-4 text-right">{eurNoSpace(subtotal)}</td>
            </tr>

            <tr className="border-b border-zinc-300">
              <td colSpan={3} className="py-4 text-center font-bold">
                Outras Taxas ({otherTaxesPct > 0 ? `+${otherTaxesPct}%` : "-%"})
              </td>
              <td className="py-4 text-right">
                {otherTaxesPct > 0 ? eurNoSpace(otherTaxesAmount) : "N/A"}
              </td>
            </tr>

            <tr>
              <td colSpan={3} className="py-6 text-center">
                <span className="text-2xl font-bold sm:text-3xl">Total</span>
              </td>
              <td className="py-6 text-right text-base font-bold">
                {eurNoSpace(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Dados Bancários */}
      <section className="reserva-bank-block mt-8 text-sm">
        <p className="font-bold uppercase tracking-wide">DADOS BANCÁRIOS</p>
        <p className="mt-3 text-zinc-700">{banking.bank}</p>
        <p className="text-zinc-700">Beneficiário: {banking.beneficiary}</p>
        <p className="text-zinc-700">IBAN: {banking.iban}</p>
        <p className="text-zinc-700">SWIFT: {banking.swift}</p>
      </section>

      {/* Footer — kept tight + tagged 'break-before: avoid' so it never
          gets bumped to a fresh page on its own. */}
      <footer className="reserva-footer-block mt-8 flex flex-wrap items-end justify-between gap-4 sm:mt-10">
        <p
          className="font-serif text-3xl font-medium text-zinc-900 sm:text-5xl"
          style={{ fontFamily: "var(--font-cormorant), serif" }}
        >
          Obrigado!
        </p>
        <div className="flex flex-col items-end">
          <Image
            src="/hostpro-logo.png"
            alt="HostPro"
            width={140}
            height={38}
            className="h-8 w-auto sm:h-10"
          />
          <p
            className="mt-1 text-[10px] italic text-zinc-600 sm:text-xs"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            {tagline}
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Compact EUR like "110€" (no thousand separator quirks for small invoices). */
function eurNoSpace(amount: number): string {
  // Match the reference PDF that uses "110€" not "€110,00".
  const rounded = Math.round(amount * 100) / 100;
  const isInt = Number.isInteger(rounded);
  if (isInt) return `${rounded}€`;
  return eur(rounded).replace("€", "").trim() + "€";
}
