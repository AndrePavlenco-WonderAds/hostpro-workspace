import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl flex flex-col items-center gap-10 text-center">
        <Image
          src="/hostpro-logo.png"
          alt="HostPro"
          width={320}
          height={88}
          priority
          className="dark:hidden"
        />
        <Image
          src="/hostpro-logo-white.png"
          alt="HostPro"
          width={320}
          height={88}
          priority
          className="hidden dark:block"
        />

        <div className="h-1 w-14 rounded-full bg-brand-cyan" />

        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-brand-navy dark:text-brand-cream">
          O seu alojamento,
          <br />
          nas melhores mãos.
        </h1>

        <p className="text-base sm:text-lg max-w-md text-brand-navy/70 dark:text-brand-cream/70">
          Workspace interno para gestão de alojamentos locais em Cascais, Monte
          Estoril, Estoril e São João do Estoril.
        </p>

        <p className="text-xs uppercase tracking-[0.2em] text-brand-navy/40 dark:text-brand-cream/40">
          v0.1.0 · Setup inicial
        </p>
      </div>
    </main>
  );
}
