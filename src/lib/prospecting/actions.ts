"use server";

import { revalidatePath, updateTag } from "next/cache";
import { scrapeListing, detectPlatform } from "./scrape";
import { runAudit } from "./audit";
import {
  addProspect,
  updateProspect,
  deleteProspect,
  getProspect,
  newProspectIds,
} from "./store";
import type { ListingData, ItemStatus, Prospect } from "./types";

function invalidate(id?: string) {
  updateTag("hostpro-prospects");
  revalidatePath("/prospecting");
  if (id) revalidatePath(`/prospecting/${id}`);
}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function lines(v: unknown): string[] {
  return asString(v)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export type CreateResult = { ok: true; id: string } | { ok: false; error: string };

export async function createProspectAction(formData: FormData): Promise<CreateResult> {
  const url = asString(formData.get("url"));
  if (!url || !/^https?:\/\//i.test(url)) {
    return { ok: false, error: "Cola um link válido (começado por http)." };
  }

  const operatorNotes = asString(formData.get("operatorNotes"));
  const pastedTitle = asString(formData.get("pastedTitle"));
  const pastedDescription = asString(formData.get("pastedDescription"));
  const pastedAmenities = lines(formData.get("pastedAmenities"));

  // 1) Tenta ler automaticamente.
  let listing: ListingData;
  try {
    listing = await scrapeListing(url);
  } catch {
    listing = {
      platform: detectPlatform(url),
      url,
      source: "scrape",
      amenities: [],
      photos: [],
      photoCaptions: [],
      needsPaste: true,
      note: "Falha inesperada na leitura automática.",
    };
  }

  // 2) Colado pelo operador preenche/enriquece o que o scrape não trouxe.
  const hasPaste = Boolean(pastedTitle || pastedDescription || pastedAmenities.length);
  if (hasPaste) {
    listing = {
      ...listing,
      source: listing.title || listing.description ? listing.source : "paste",
      title: listing.title || pastedTitle || undefined,
      description: listing.description || pastedDescription || undefined,
      amenities: listing.amenities.length ? listing.amenities : pastedAmenities,
      needsPaste: false,
    };
  }

  const audit = runAudit(listing);
  const { id, publicToken } = newProspectIds();
  const name =
    asString(formData.get("name")) || listing.title || `Prospect ${id}`;

  const prospect: Prospect = {
    id,
    publicToken,
    createdAt: new Date().toISOString().slice(0, 10),
    name,
    url,
    platform: listing.platform,
    operatorNotes,
    listing,
    audit,
    overrides: {},
  };

  try {
    await addProspect(prospect);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao guardar." };
  }
  invalidate(id);
  return { ok: true, id };
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function setOverrideAction(
  id: string,
  itemId: string,
  status: ItemStatus,
): Promise<ActionResult> {
  const p = await getProspect(id);
  if (!p) return { ok: false, error: "Prospect não encontrado." };
  const overrides = { ...p.overrides, [itemId]: status };
  try {
    await updateProspect(id, { overrides });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro" };
  }
  invalidate(id);
  return { ok: true };
}

export async function updateProspectMetaAction(
  id: string,
  patch: { name?: string; operatorNotes?: string },
): Promise<ActionResult> {
  try {
    await updateProspect(id, patch);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro" };
  }
  invalidate(id);
  return { ok: true };
}

/** Re-corre a auditoria automática (ex: depois de mexer em dados) sem perder
 *  os overrides manuais já feitos. */
export async function reanalyzeAction(id: string): Promise<ActionResult> {
  const p = await getProspect(id);
  if (!p) return { ok: false, error: "Prospect não encontrado." };
  try {
    const listing = await scrapeListing(p.url);
    const merged = listing.needsPaste ? p.listing : listing;
    await updateProspect(id, { listing: merged, audit: runAudit(merged) });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro" };
  }
  invalidate(id);
  return { ok: true };
}

export async function deleteProspectAction(id: string): Promise<ActionResult> {
  try {
    await deleteProspect(id);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro" };
  }
  invalidate(id);
  return { ok: true };
}
