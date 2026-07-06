import Link from "next/link";
import { NovoAlojamentoForm } from "@/components/novo-alojamento-form";

export const metadata = {
  title: "Novo alojamento — HostPro Workspace",
};

export default function NovoAlojamentoPage() {
  return (
    <div className="min-h-screen bg-brand-navy-dark px-4 py-8 sm:px-10 sm:py-14">
      <div className="mx-auto w-full max-w-3xl">
        <header>
          <Link
            href="/"
            className="inline-flex items-center text-sm text-white/55 transition hover:text-white"
          >
            ← Início
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
            Novo alojamento
          </h1>
          <p className="mt-2 text-sm text-white/55 sm:text-base">
            Adiciona um apartamento ao workspace. Fica logo disponível na página
            inicial, na visão geral e com página própria de P&amp;L e reservas.
          </p>
        </header>

        <div className="mt-8">
          <NovoAlojamentoForm />
        </div>
      </div>
    </div>
  );
}
