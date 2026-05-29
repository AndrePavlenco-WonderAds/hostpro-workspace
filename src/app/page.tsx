import Image from "next/image";
import Link from "next/link";
import { getCurrentVersion } from "@/lib/changelog";

export default function Home() {
  const version = getCurrentVersion();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-brand-navy-dark">
      {/* Blurred hero photo behind everything. */}
      <Image
        src="/hero-living-room.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover scale-110 blur-2xl opacity-30"
      />
      {/* Navy wash so the content stays legible. */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-navy-dark/75 via-brand-navy-dark/85 to-brand-navy-dark/95" />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="flex w-full max-w-xl flex-col items-center gap-8 text-center">
          {/* Top CTA — view a specific accommodation */}
          <Link
            href="/alojamentos"
            className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/80 backdrop-blur-md transition hover:border-brand-cyan hover:bg-white/[0.08] hover:text-white"
          >
            <span aria-hidden className="text-brand-cyan">◉</span>
            Ver um alojamento específico
            <span
              aria-hidden
              className="transition-transform group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>

          {/* Logo block */}
          <Image
            src="/hostpro-logo-white.png"
            alt="HostPro"
            width={320}
            height={88}
            priority
          />
          <div className="h-1 w-14 rounded-full bg-brand-cyan" />

          {/* Claim */}
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl">
            O seu alojamento,
            <br />
            nas melhores mãos.
          </h1>

          <p className="max-w-md text-sm sm:text-base text-white/65">
            Workspace interno para gestão de alojamentos locais em Cascais,
            Monte Estoril, Estoril e São João do Estoril.
          </p>

          {/* Bottom CTA — admin entry */}
          <Link
            href="/admin"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand-cyan px-6 py-3 text-sm font-semibold text-brand-navy shadow-[0_15px_40px_-12px_rgba(0,181,226,0.7)] transition hover:opacity-90"
          >
            Admin view
            <span aria-hidden>→</span>
          </Link>
        </div>
      </main>

      <footer className="relative z-10 flex items-center justify-center gap-3 px-6 pb-8 text-[11px] uppercase tracking-[0.22em] text-white/40">
        <span>HostPro Workspace</span>
        <span aria-hidden className="text-white/20">·</span>
        <Link
          href="/changelog"
          className="transition hover:text-brand-cyan"
        >
          v{version}
        </Link>
      </footer>
    </div>
  );
}
