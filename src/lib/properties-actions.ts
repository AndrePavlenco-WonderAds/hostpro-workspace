"use server";

// Server actions for managing alojamentos (add / edit / remove).

import { revalidatePath, updateTag } from "next/cache";
import {
  addProperty,
  updateProperty,
  deleteProperty,
  uploadPropertyPhoto,
} from "./properties-store";

// Uses `updateTag` (server-action-only API) so reads see the write within the
// same request, plus revalidatePath for every surface that lists properties.
function invalidate() {
  updateTag("hostpro-properties");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/alojamentos/[slug]", "page");
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asMoney(value: unknown): number {
  const n = Number(asString(value).replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export type ActionResult = { ok: true; slug: string } | { ok: false; error: string };

export async function createPropertyAction(formData: FormData): Promise<ActionResult> {
  const name = asString(formData.get("name"));
  const shortName = asString(formData.get("shortName")) || name;
  const location = asString(formData.get("location"));
  const description = asString(formData.get("description"));

  if (!name) return { ok: false, error: "O nome do alojamento é obrigatório" };
  if (!location) return { ok: false, error: "A localização é obrigatória" };

  // Address: one line per textarea row.
  const addressLines = asString(formData.get("address"))
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const defaultNightlyRate = asMoney(formData.get("nightlyRate"));
  const defaultCleaningFee = asMoney(formData.get("cleaningFee"));
  const defaultCleaningPaymentEur = asMoney(formData.get("cleaningPayment"));

  // Photo é opcional — sem foto, o card mostra um fundo neutro (fallback no
  // componente). Com foto, sobe para o Blob (prefixo próprio, GC-safe).
  let photo = "";
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return { ok: false, error: "O ficheiro tem de ser uma imagem" };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: "Imagem demasiado grande (máx. 10 MB)" };
    }
    try {
      photo = await uploadPropertyPhoto(file);
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Erro no upload da foto" };
    }
  }

  try {
    const created = await addProperty({
      name,
      shortName,
      location,
      description,
      photo,
      addressLines,
      defaultNightlyRate,
      defaultCleaningFee,
      defaultCleaningPaymentEur,
    });
    invalidate();
    return { ok: true, slug: created.slug };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao criar alojamento" };
  }
}

export async function updatePropertyAction(
  slug: string,
  patch: Parameters<typeof updateProperty>[1],
): Promise<ActionResult> {
  if (!slug) return { ok: false, error: "Alojamento em falta" };
  try {
    await updateProperty(slug, patch);
    invalidate();
    return { ok: true, slug };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro" };
  }
}

export async function deletePropertyAction(slug: string): Promise<ActionResult> {
  if (!slug) return { ok: false, error: "Alojamento em falta" };
  try {
    await deleteProperty(slug);
    invalidate();
    return { ok: true, slug };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro" };
  }
}
