"use server";

// Server actions for the marketing content-idea board.

import { revalidatePath, updateTag } from "next/cache";
import { addIdea, updateIdea, deleteIdea, uploadIdeaImage } from "./marketing-store";
import { CONTENT_IDEA_KINDS, type ContentIdeaKind } from "./marketing-types";

function invalidate() {
  updateTag("hostpro-marketing");
  revalidatePath("/marketing");
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isKind(value: string): value is ContentIdeaKind {
  return (CONTENT_IDEA_KINDS as string[]).includes(value);
}

// Limite defensivo de upload (o body limit do server action está em 12mb no
// next.config; mantemos a validação mais apertada aqui para dar erro claro).
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addIdeaAction(formData: FormData): Promise<ActionResult> {
  const kind = asString(formData.get("kind"));
  const title = asString(formData.get("title"));
  const url = asString(formData.get("url"));

  if (!isKind(kind)) return { ok: false, error: "Tipo inválido" };
  if (!title) return { ok: false, error: "Escreve uma nota / descrição da ideia" };

  let imageUrl: string | undefined;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return { ok: false, error: "O ficheiro tem de ser uma imagem" };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: "Imagem demasiado grande (máx. 10 MB)" };
    }
    try {
      imageUrl = await uploadIdeaImage(file);
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Erro no upload" };
    }
  }

  // Data sem hora — a board não precisa de precisão ao segundo e mantém o
  // mesmo formato ISO YYYY-MM-DD do resto da app.
  const createdAt = new Date().toISOString().slice(0, 10);

  try {
    await addIdea({ kind, title, url: url || undefined, imageUrl, createdAt, recreated: false });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro" };
  }
  invalidate();
  return { ok: true };
}

export async function deleteIdeaAction(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "ID em falta" };
  try {
    await deleteIdea(id);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro" };
  }
  invalidate();
  return { ok: true };
}

export async function toggleRecreatedAction(id: string, next: boolean): Promise<ActionResult> {
  try {
    await updateIdea(id, { recreated: next });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro" };
  }
  invalidate();
  return { ok: true };
}
