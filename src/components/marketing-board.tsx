"use client";

// Board de ideias de conteúdo (Postagem de conteúdo). Form inline para
// adicionar uma referência (TikTok / vídeo / link / imagem) + grelha de
// cartões com o que já guardámos para recriar mais tarde.

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { ddmmyyyy } from "@/lib/dates";
import {
  addIdeaAction,
  deleteIdeaAction,
  toggleRecreatedAction,
} from "@/lib/marketing-actions";
import {
  CONTENT_IDEA_KINDS,
  KIND_META,
  type ContentIdea,
} from "@/lib/marketing-types";

const INPUT_CLASS =
  "w-full rounded-lg border border-white/12 bg-white/[0.05] px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-brand-cyan disabled:opacity-60";

export function MarketingBoard({ ideas }: { ideas: ContentIdea[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setError(null);
    startTransition(async () => {
      const result = await addIdeaAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      form.reset();
      setOpen(false);
      router.refresh();
    });
  }

  // Mais recentes primeiro; por recriar antes das já recriadas.
  const sorted = [...ideas].sort((a, b) => {
    if (a.recreated !== b.recreated) return a.recreated ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
  const pending = ideas.filter((i) => !i.recreated).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold text-white sm:text-lg">
            Ideias de conteúdo
          </h2>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
            {ideas.length} {ideas.length === 1 ? "ideia" : "ideias"}
          </span>
          {pending > 0 && (
            <span className="rounded-full border border-brand-cyan/40 bg-brand-cyan/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-cyan">
              {pending} por recriar
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setOpen((v) => !v);
          }}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-cyan/40 bg-brand-cyan/10 px-3.5 py-1.5 text-xs font-semibold text-brand-cyan transition hover:border-brand-cyan hover:bg-brand-cyan/20 disabled:opacity-40"
        >
          {open ? "Fechar" : "+ Nova ideia"}
        </button>
      </div>

      {open && (
        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-brand-cyan/30 bg-brand-cyan/[0.05] p-4 sm:p-5"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Tipo
              </span>
              <select name="kind" defaultValue="tiktok" className={INPUT_CLASS}>
                {CONTENT_IDEA_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_META[k].emoji} {KIND_META[k].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Link (TikTok / vídeo / página) — opcional
              </span>
              <input
                type="url"
                name="url"
                placeholder="https://..."
                className={INPUT_CLASS}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Nota / o que gostámos (para recriar)
            </span>
            <textarea
              name="title"
              required
              rows={2}
              placeholder="ex: transição de quarto arrumado → vista mar, com música calma"
              className={`${INPUT_CLASS} resize-y`}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Imagem (upload) — opcional · máx. 10 MB
            </span>
            <input
              type="file"
              name="image"
              accept="image/*"
              className="block w-full text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-brand-cyan/15 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand-cyan hover:file:bg-brand-cyan/25"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-full bg-brand-cyan px-5 py-2 text-xs font-semibold text-brand-navy transition hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "A guardar…" : "Guardar ideia"}
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-10 text-center">
          <p className="text-sm text-white/55">
            Ainda sem ideias guardadas. Carrega em{" "}
            <span className="text-brand-cyan">+ Nova ideia</span> para guardar a
            primeira referência (TikTok, vídeo, link ou imagem).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  );
}

function IdeaCard({ idea }: { idea: ContentIdea }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const meta = KIND_META[idea.kind];

  function toggleRecreated() {
    startTransition(async () => {
      await toggleRecreatedAction(idea.id, !idea.recreated);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm("Apagar esta ideia?")) return;
    startTransition(async () => {
      await deleteIdeaAction(idea.id);
      router.refresh();
    });
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border bg-white/[0.025] backdrop-blur-md transition ${
        idea.recreated
          ? "border-emerald-300/30"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      {idea.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- Blob URL remoto, evita config de remotePatterns
        <img
          src={idea.imageUrl}
          alt={idea.title}
          loading="lazy"
          className="h-44 w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">
            <span aria-hidden>{meta.emoji}</span>
            {meta.label}
          </span>
          {idea.recreated && (
            <span className="rounded-full bg-emerald-300/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200 ring-1 ring-emerald-300/30">
              Recriado
            </span>
          )}
        </div>

        <p className="flex-1 whitespace-pre-wrap text-sm text-white/85">
          {idea.title}
        </p>

        {idea.url && (
          <a
            href={idea.url}
            target="_blank"
            rel="noreferrer"
            className="truncate text-xs font-medium text-brand-cyan transition hover:underline"
            title={idea.url}
          >
            🔗 {idea.url}
          </a>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-3">
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">
            {ddmmyyyy(idea.createdAt)}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleRecreated}
              disabled={isPending}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition disabled:opacity-50 ${
                idea.recreated
                  ? "border-white/15 bg-white/[0.04] text-white/65 hover:text-white"
                  : "border-emerald-300/40 bg-emerald-300/10 text-emerald-200 hover:bg-emerald-300/20"
              }`}
            >
              {idea.recreated ? "↩︎ Por recriar" : "✓ Recriado"}
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={isPending}
              title="Apagar"
              className="rounded-full border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 text-[10px] font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
            >
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
