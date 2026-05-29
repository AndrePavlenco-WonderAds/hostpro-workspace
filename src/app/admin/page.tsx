import Link from "next/link";

export const metadata = {
  title: "Admin — HostPro Workspace",
};

export default function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-navy-dark px-6 py-16 text-center">
      <span className="rounded-full border border-brand-cyan/40 bg-brand-cyan/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-cyan">
        Em construção
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        Admin view
      </h1>
      <p className="mt-3 max-w-md text-sm text-white/60 sm:text-base">
        Painel de operações: reservas, calendário multi-plataforma, checkouts
        do dia, manutenção pendente, receita do mês.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm text-white/80 transition hover:border-brand-cyan hover:text-white"
      >
        ← Voltar
      </Link>
    </div>
  );
}
