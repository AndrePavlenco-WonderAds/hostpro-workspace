import Link from "next/link";
import { ChangelogGate } from "@/components/changelog-gate";
import { CHANGELOG, type ChangelogEntry } from "@/lib/changelog";
import { isChangelogUnlocked } from "@/lib/changelog-auth";

export const metadata = {
  title: "Changelog — HostPro Workspace",
};

function BackHome() {
  return (
    <Link
      href="/"
      className="group inline-flex w-fit items-center gap-2 text-sm text-white/55 transition hover:text-white"
    >
      ← Voltar
    </Link>
  );
}

export default async function ChangelogPage() {
  const unlocked = await isChangelogUnlocked();

  return (
    <div className="relative min-h-screen bg-brand-navy-dark px-4 py-8 sm:px-10 sm:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <BackHome />

        {!unlocked ? (
          <ChangelogGate />
        ) : (
          <>
            <section className="mt-10 flex flex-col items-start gap-4 sm:mt-14">
              <span
                aria-hidden
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-cyan shadow-[0_10px_40px_-8px_rgba(0,181,226,0.7)]"
              >
                ✨
              </span>
              <h1 className="text-3xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl">
                Changelog
              </h1>
              <p className="max-w-2xl text-base text-white/65 sm:text-lg">
                Todas as releases do HostPro Workspace, da mais recente para a
                mais antiga.
              </p>
            </section>

            <ol className="relative mt-14 sm:mt-20">
              <span
                aria-hidden
                className="pointer-events-none absolute left-[14px] top-2 bottom-2 w-px sm:left-[18px]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0,181,226,0.85) 0%, rgba(0,181,226,0.2) 60%, rgba(0,181,226,0) 100%)",
                }}
              />
              {CHANGELOG.map((entry, i) => (
                <li
                  key={entry.version}
                  className="relative pb-10 pl-10 sm:pl-16"
                >
                  <TimelineDot isLatest={i === 0} />
                  <Entry entry={entry} isLatest={i === 0} />
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}

function TimelineDot({ isLatest }: { isLatest: boolean }) {
  return (
    <span
      aria-hidden
      className="absolute left-0 top-2.5 flex h-7 w-7 items-center justify-center sm:left-1"
    >
      {isLatest && (
        <span className="absolute inset-0 animate-ping rounded-full bg-brand-cyan opacity-50" />
      )}
      <span className="relative h-3 w-3 rounded-full bg-brand-cyan ring-2 ring-brand-navy-dark" />
    </span>
  );
}

function Entry({
  entry,
  isLatest,
}: {
  entry: ChangelogEntry;
  isLatest: boolean;
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-md transition hover:bg-white/[0.06] sm:p-7">
      {isLatest && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-cyan/30 opacity-50 blur-3xl"
        />
      )}

      <header className="relative flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-brand-cyan px-3 py-1 text-xs font-bold tracking-tight text-brand-navy shadow-[0_6px_22px_-4px_rgba(0,181,226,0.55)]">
          v{entry.version}
        </span>
        <time className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">
          {formatDate(entry.date)}
        </time>
        {isLatest && (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-brand-cyan shadow-[0_0_10px_rgba(0,181,226,0.85)]"
            />
            Latest
          </span>
        )}
      </header>

      <h2 className="relative mt-4 text-xl font-semibold tracking-tight text-white sm:text-2xl">
        {entry.title}
      </h2>

      <ul className="relative mt-4 space-y-2 text-sm text-white/75 sm:text-base">
        {entry.highlights.map((h, j) => (
          <li key={j} className="flex gap-3">
            <span
              aria-hidden
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cyan"
            />
            <span dangerouslySetInnerHTML={{ __html: renderInline(h) }} />
          </li>
        ))}
      </ul>
    </article>
  );
}

function renderInline(s: string): string {
  // Minimal markdown bold + inline code → HTML. Same lightweight approach as
  // Wonder Ads, scoped to changelog entries we control directly.
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`([^`]+)`/g, '<code class="rounded bg-white/10 px-1 py-0.5 text-[0.9em] text-brand-cyan">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white">$1</strong>');
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
