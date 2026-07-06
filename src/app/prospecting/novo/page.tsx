import Link from "next/link";
import { ProspectingForm } from "@/components/prospecting/prospecting-form";

export const metadata = { title: "Nova análise — HostPro Workspace" };

export default function NovaAnalisePage() {
  return (
    <div className="min-h-screen bg-brand-navy-dark px-4 py-8 sm:px-10 sm:py-14">
      <div className="mx-auto w-full max-w-3xl">
        <header>
          <Link href="/prospecting" className="inline-flex items-center text-sm text-white/55 transition hover:text-white">
            ← Prospecting
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
            Nova análise de listing
          </h1>
          <p className="mt-2 text-sm text-white/55 sm:text-base">
            Cola o link do listing. A app lê e audita contra o checklist de otimização da HostPro.
          </p>
        </header>
        <div className="mt-8">
          <ProspectingForm />
        </div>
      </div>
    </div>
  );
}
