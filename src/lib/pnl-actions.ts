"use server";

// Server actions for adding / deleting / updating P&L entries.
// Called directly from client components — Next.js handles the RPC.
// All mutations go through src/lib/pnl-store.ts which is server-only.

import { revalidatePath, updateTag } from "next/cache";
import { addEntry, deleteEntry, updateEntry } from "./pnl-store";

// Centralised cache invalidation. Every mutation calls this AFTER the
// Blob write succeeds so the cached `getAllEntries` result is dropped
// and the next read returns fresh data. v0.10.3: required because
// `getAllEntries` is now wrapped in `unstable_cache` (tag: hostpro-pnl).
// Uses `updateTag` (not `revalidateTag`) — server-action-only API with
// read-your-own-writes guarantees, so the redirect after the mutation
// sees the fresh data without a race window.
function invalidatePnlCaches(property: string) {
  updateTag("hostpro-pnl");
  revalidatePath(`/alojamentos/${property}`);
  revalidatePath("/admin");
  revalidatePath("/");
}
import type { PropertySlug } from "./properties";
import type { Person, EntryKind, ReservationSource } from "./pnl-types";
import { PEOPLE, RESERVATION_SOURCES } from "./pnl-types";

// ---------- shared validation ----------

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number {
  const n = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isPerson(value: string): value is Person {
  return (PEOPLE as readonly string[]).includes(value);
}

function isSource(value: string): value is ReservationSource {
  return (RESERVATION_SOURCES as string[]).includes(value);
}

function isISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

const PROPERTY_SLUGS: PropertySlug[] = [
  "sweet-escape-2",
  "sweet-escape-5",
  "one-for-one-house",
];

function isPropertySlug(value: string): value is PropertySlug {
  return (PROPERTY_SLUGS as string[]).includes(value);
}

export type ActionResult = { ok: true } | { ok: false; error: string };

// ---------- add ----------

export async function addEntryAction(formData: FormData): Promise<ActionResult> {
  const property = asString(formData.get("property"));
  const kind = asString(formData.get("kind")) as EntryKind;
  const date = asString(formData.get("date"));

  if (!isPropertySlug(property)) return { ok: false, error: "Alojamento inválido" };
  if (!isISODate(date)) return { ok: false, error: "Data inválida (YYYY-MM-DD)" };

  // Lavandaria has its own shape — apenas data + peso (kg). Tratamos antes
  // das validações que assumem pessoa / valor em euros.
  if (kind === "lavandaria") {
    const weightKg = asNumber(formData.get("weightKg"));
    if (weightKg <= 0) return { ok: false, error: "Peso tem de ser positivo (kg)" };
    try {
      await addEntry({
        kind: "lavandaria",
        property,
        date,
        weightKg,
        description: "Lavandaria",
      });
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Erro" };
    }
    invalidatePnlCaches(property);
    return { ok: true };
  }

  const description = asString(formData.get("description"));
  const person = asString(formData.get("person"));
  const amount = asNumber(formData.get("amount"));

  if (!isPerson(person)) return { ok: false, error: "Pessoa inválida" };
  if (amount <= 0) return { ok: false, error: "Valor tem de ser positivo" };
  // v0.10.4: `funcionario` (now "Limpezas" UI) also bypasses this — the
  // form no longer has a description input and we hard-code "Limpeza".
  if (!description && kind !== "entrada" && kind !== "funcionario") {
    return { ok: false, error: "Descrição obrigatória" };
  }

  const outOfAccount = formData.get("outOfAccount") === "on";

  try {
    if (kind === "despesa") {
      await addEntry({
        kind: "despesa",
        property,
        date,
        amount,
        description,
        person,
        outOfAccount,
      });
    } else if (kind === "funcionario") {
      // v0.10.4: section renamed to "Limpezas" and the description column
      // was dropped (always "Limpeza" in practice). The form no longer
      // sends `description`, so we default it here. `cleaningDate` is the
      // new field — falls back to `date` if the form omits it.
      const cleaningDate = asString(formData.get("cleaningDate")) || date;
      if (!isISODate(cleaningDate)) return { ok: false, error: "Data de limpeza inválida (YYYY-MM-DD)" };
      await addEntry({
        kind: "funcionario",
        property,
        date,
        amount,
        description: description || "Limpeza",
        person,
        outOfAccount,
        pago: formData.get("pago") === "on",
        cleaningDate,
      });
    } else if (kind === "entrada") {
      const stayWindow = asString(formData.get("stayWindow"));
      const noIva = formData.get("noIva") === "on";
      // Defensive: even if the disabled IVA input somehow leaks a value,
      // noIva=true always forces iva=0 server-side.
      const iva = noIva ? 0 : asNumber(formData.get("iva"));
      if (!stayWindow) return { ok: false, error: "Janela da estadia obrigatória" };
      // Valor recebido na conta — opcional. Vazio = undefined (conta 0 nos Ganhos).
      const valorRecebidoRaw = asString(formData.get("valorRecebido"));
      const valorRecebido = valorRecebidoRaw ? asNumber(formData.get("valorRecebido")) : undefined;
      // Canal da reserva. VAT invoice só faz sentido para Airbnb.
      const sourceRaw = asString(formData.get("source"));
      const source: ReservationSource = isSource(sourceRaw) ? sourceRaw : "interno";
      const vatInvoiceInDrive = source === "airbnb" ? formData.get("vatInvoiceInDrive") === "on" : undefined;
      await addEntry({
        kind: "entrada",
        property,
        date,
        amount,
        description: stayWindow,
        person,
        outOfAccount: false,
        stayWindow,
        valorRecebido,
        iva,
        noIva,
        source,
        vatInvoiceInDrive,
        recebido: formData.get("recebido") === "on",
        noBanco: formData.get("noBanco") === "on",
        inIvaVault: formData.get("inIvaVault") === "on",
      });
    } else {
      return { ok: false, error: "Tipo inválido" };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro" };
  }

  // Refresh the property page + admin overview.
  invalidatePnlCaches(property);
  return { ok: true };
}

// ---------- update ----------

export async function updateEntryAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const property = asString(formData.get("property"));
  const kind = asString(formData.get("kind")) as EntryKind;
  const date = asString(formData.get("date"));

  if (!isPropertySlug(property)) return { ok: false, error: "Alojamento inválido" };
  if (!isISODate(date)) return { ok: false, error: "Data inválida (YYYY-MM-DD)" };

  // Lavandaria — fields são apenas data + peso. Mesma lógica do add.
  if (kind === "lavandaria") {
    const weightKg = asNumber(formData.get("weightKg"));
    if (weightKg <= 0) return { ok: false, error: "Peso tem de ser positivo (kg)" };
    try {
      await updateEntry(id, { date, weightKg } as never);
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Erro" };
    }
    invalidatePnlCaches(property);
    return { ok: true };
  }

  const description = asString(formData.get("description"));
  const person = asString(formData.get("person"));
  const amount = asNumber(formData.get("amount"));

  if (!isPerson(person)) return { ok: false, error: "Pessoa inválida" };
  if (amount <= 0) return { ok: false, error: "Valor tem de ser positivo" };

  const outOfAccount = formData.get("outOfAccount") === "on";

  try {
    if (kind === "despesa") {
      await updateEntry(id, { date, amount, description, person, outOfAccount } as never);
    } else if (kind === "funcionario") {
      // v0.10.4: keep whatever description was saved (don't overwrite with
      // empty string from the now-absent form input); add `cleaningDate`.
      const cleaningDate = asString(formData.get("cleaningDate")) || date;
      if (!isISODate(cleaningDate)) return { ok: false, error: "Data de limpeza inválida (YYYY-MM-DD)" };
      const patch: Record<string, unknown> = {
        date,
        amount,
        person,
        outOfAccount,
        pago: formData.get("pago") === "on",
        cleaningDate,
      };
      if (description) patch.description = description;
      await updateEntry(id, patch as never);
    } else if (kind === "entrada") {
      const stayWindow = asString(formData.get("stayWindow"));
      const noIva = formData.get("noIva") === "on";
      const iva = noIva ? 0 : asNumber(formData.get("iva"));
      if (!stayWindow) return { ok: false, error: "Janela da estadia obrigatória" };
      const valorRecebidoRaw = asString(formData.get("valorRecebido"));
      const valorRecebido = valorRecebidoRaw ? asNumber(formData.get("valorRecebido")) : undefined;
      const sourceRaw = asString(formData.get("source"));
      const source: ReservationSource = isSource(sourceRaw) ? sourceRaw : "interno";
      const vatInvoiceInDrive = source === "airbnb" ? formData.get("vatInvoiceInDrive") === "on" : undefined;
      await updateEntry(id, {
        date,
        amount,
        description: stayWindow,
        person,
        stayWindow,
        valorRecebido,
        iva,
        noIva,
        source,
        vatInvoiceInDrive,
        recebido: formData.get("recebido") === "on",
        noBanco: formData.get("noBanco") === "on",
        inIvaVault: formData.get("inIvaVault") === "on",
      } as never);
    } else {
      return { ok: false, error: "Tipo inválido" };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro" };
  }

  invalidatePnlCaches(property);
  return { ok: true };
}

// ---------- delete ----------

export async function deleteEntryAction(id: string, property: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "ID em falta" };
  try {
    await deleteEntry(id);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro" };
  }
  invalidatePnlCaches(property);
  return { ok: true };
}

// ---------- toggle flag (Pago / Recebido / No banco / IVA Vault) ----------

export async function toggleFlagAction(
  id: string,
  flag: "pago" | "recebido" | "noBanco" | "inIvaVault" | "outOfAccount" | "vatInvoiceInDrive",
  next: boolean,
  property: string,
): Promise<ActionResult> {
  try {
    await updateEntry(id, { [flag]: next } as never);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro" };
  }
  invalidatePnlCaches(property);
  return { ok: true };
}

// ---------- change person (inline pill dropdown) ----------

export async function changePersonAction(
  id: string,
  next: string,
  property: string,
): Promise<ActionResult> {
  if (!isPerson(next)) return { ok: false, error: "Pessoa inválida" };
  try {
    await updateEntry(id, { person: next } as never);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro" };
  }
  invalidatePnlCaches(property);
  return { ok: true };
}
