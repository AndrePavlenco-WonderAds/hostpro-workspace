import Link from "next/link";
import { getCurrentVersion } from "@/lib/changelog";

/**
 * Persistent footer rendered by the root layout — visible on every page so
 * the user always knows which version is live and can jump to the changelog.
 * Hidden when printing (the /reserva page produces a PDF and doesn't want it).
 */
export function AppFooter() {
  const version = getCurrentVersion();
  return (
    <footer className="relative z-30 flex items-center justify-center gap-3 px-6 pb-4 pt-2 text-[11px] uppercase tracking-[0.22em] text-white/40 print:hidden">
      <span>HostPro Workspace</span>
      <span aria-hidden className="text-white/20">·</span>
      <Link
        href="/changelog"
        className="transition hover:text-brand-cyan"
        title="Ver histórico de versões"
      >
        v{version}
      </Link>
    </footer>
  );
}
