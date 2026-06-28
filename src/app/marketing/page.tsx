import Link from "next/link";

import { getAllIdeas } from "@/lib/marketing-store";
import { MarketingBoard } from "@/components/marketing-board";

export const metadata = {
  title: "Postagem de conteúdo — HostPro",
};

export default async function MarketingPage() {
  const ideas = await getAllIdeas();

  return (
    <div className="min-h-screen bg-brand-navy-dark">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-10 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:border-brand-cyan hover:text-white"
          >
            ← Início
          </Link>
          <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55 ring-1 ring-white/10">
            Marketing HostPro
          </span>
        </div>

        <header className="mt-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">
            Postagem de conteúdo
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/65 sm:text-base">
            Banco de ideias para as redes da HostPro. Guarda aqui referências de
            outros criadores — TikToks, vídeos, links e imagens — para depois
            recriarmos à nossa maneira.
          </p>
        </header>

        <section className="mt-10">
          <MarketingBoard ideas={ideas} />
        </section>
      </main>
    </div>
  );
}
