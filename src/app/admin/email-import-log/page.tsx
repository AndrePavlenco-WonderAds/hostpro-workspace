// Read-only audit of the Gmail import cron. Most-recent first, status badge
// per row, expandable parsed JSON. Server component reading the import-log
// blob directly — no client state.

import Link from "next/link";
import { revalidatePath } from "next/cache";
import { readImportLog, type ImportLogEntry, type ImportLogStatus } from "@/lib/gmail/import-log";

export const metadata = {
  title: "Email import log — HostPro Workspace",
};

export const dynamic = "force-dynamic";

/** Server actions — hit our own cron endpoint with the CRON_SECRET Bearer
 *  header so they run the exact same code path as the scheduled fire. */
async function runCronNow() {
  "use server";
  await callCron({ retry: false });
}

/** Re-process every labelled message even if it was already marked
 *  processado/falhou — useful after a parser deploy to catch up old emails
 *  the previous version got wrong. */
async function runCronRetry() {
  "use server";
  await callCron({ retry: true });
}

async function callCron({ retry }: { retry: boolean }) {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET missing");
  const base = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://hostpro-workspace.vercel.app";
  const qs = retry ? "?retry=true" : "";
  await fetch(`${base}/api/cron/import-emails${qs}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
  });
  revalidatePath("/admin/email-import-log");
}

export default async function EmailImportLogPage() {
  const log = await readImportLog(100);

  const counts: Record<ImportLogStatus, number> = {
    "dry-run": 0,
    "created": 0,
    "updated": 0,
    "skipped": 0,
    "ignored": 0,
    "unknown-listing": 0,
    "parse-failed": 0,
    "error": 0,
  };
  for (const e of log) counts[e.status]++;

  return (
    <div className="min-h-screen bg-brand-navy-dark px-4 py-10 sm:px-10 sm:py-14">
      <div className="mx-auto w-full max-w-5xl">
        <Link href="/admin" className="text-sm text-white/55 transition hover:text-white">
          ← Visão geral
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Email import log
            </h1>
            <p className="mt-2 text-sm text-white/55 sm:text-base">
              Cada linha é uma mensagem do Gmail que o cron tentou processar.
              Mostra as últimas {log.length}. Cron automático corre 1×/dia às
              06:00 UTC (limite do plano Hobby) — usa o botão abaixo para
              correr na hora.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={runCronNow}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-brand-cyan px-5 py-2 text-sm font-semibold text-brand-navy shadow-[0_10px_30px_-10px_rgba(0,181,226,0.7)] transition hover:opacity-90"
              >
                ▶ Correr cron agora
              </button>
            </form>
            <form action={runCronRetry}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-5 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/[0.08]"
                title="Reprocessa todos os emails com label hostpro/airbnb-* — útil depois de um deploy do parser"
              >
                ↻ Retry todos
              </button>
            </form>
          </div>
        </div>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          <Stat label="Dry-run" value={counts["dry-run"]} tone="cyan" />
          <Stat label="Criadas" value={counts.created} tone="green" />
          <Stat label="Actualizadas" value={counts.updated} tone="green" />
          <Stat label="Skipped" value={counts.skipped} tone="neutral" />
          <Stat label="Ignorado" value={counts.ignored} tone="neutral" />
          <Stat label="Listing ?" value={counts["unknown-listing"]} tone="amber" />
          <Stat label="Parse ✗" value={counts["parse-failed"]} tone="red" />
          <Stat label="Erro" value={counts.error} tone="red" />
        </section>

        <section className="mt-8 space-y-3">
          {log.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.025] p-8 text-center text-sm text-white/55">
              Ainda sem dados — assim que chegar o primeiro email com label{" "}
              <code className="text-brand-cyan">hostpro/airbnb-*</code> e o cron
              correr, aparece aqui.
            </p>
          ) : (
            log.map((e) => <Row key={e.id} entry={e} />)
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "cyan" | "green" | "red" | "amber" | "neutral";
}) {
  const toneClass =
    tone === "cyan"
      ? "text-brand-cyan"
      : tone === "green"
        ? "text-emerald-300"
        : tone === "red"
          ? "text-rose-300"
          : tone === "amber"
            ? "text-amber-200"
            : "text-white";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function Row({ entry }: { entry: ImportLogEntry }) {
  const tone =
    entry.status === "dry-run"
      ? "border-brand-cyan/30 bg-brand-cyan/[0.04]"
      : entry.status === "created" || entry.status === "updated"
        ? "border-emerald-300/30 bg-emerald-300/[0.04]"
        : entry.status === "unknown-listing"
          ? "border-amber-300/30 bg-amber-300/[0.04]"
          : entry.status === "parse-failed" || entry.status === "error"
            ? "border-rose-400/30 bg-rose-400/[0.04]"
            : entry.status === "skipped" || entry.status === "ignored"
              ? "border-white/10 bg-white/[0.025] opacity-60"
              : "border-white/10 bg-white/[0.025]";
  const ts = new Date(entry.ts);
  const tsLabel = ts.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <details className={`rounded-2xl border ${tone} backdrop-blur-md`}>
      <summary className="cursor-pointer list-none px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            {entry.kind}
          </span>
          <span className="text-[11px] text-white/55 tabular-nums">{tsLabel}</span>
        </div>
        <p className="mt-1.5 truncate text-sm text-white/90">
          {entry.emailSubject || "(sem subject)"}
        </p>
        <div className="mt-1.5 flex items-center gap-3 text-[11px]">
          <StatusPill status={entry.status} />
          {entry.error && <span className="truncate text-rose-200">{entry.error}</span>}
        </div>
      </summary>
      {(entry.parsed || entry.error) && (
        <pre className="overflow-x-auto border-t border-white/5 px-4 py-3 text-[11px] text-white/65">
{JSON.stringify(entry.parsed ?? { error: entry.error }, null, 2)}
        </pre>
      )}
    </details>
  );
}

function StatusPill({ status }: { status: ImportLogStatus }) {
  const map: Record<ImportLogStatus, { label: string; cls: string }> = {
    "dry-run": { label: "DRY-RUN", cls: "bg-brand-cyan/20 text-brand-cyan ring-brand-cyan/30" },
    created: { label: "CRIADA", cls: "bg-emerald-300/20 text-emerald-200 ring-emerald-300/30" },
    updated: { label: "ACTUALIZADA", cls: "bg-emerald-300/20 text-emerald-200 ring-emerald-300/30" },
    skipped: { label: "SKIPPED", cls: "bg-white/10 text-white/60 ring-white/20" },
    ignored: { label: "IGNORADO", cls: "bg-white/10 text-white/60 ring-white/20" },
    "unknown-listing": { label: "LISTING ?", cls: "bg-amber-300/20 text-amber-100 ring-amber-300/30" },
    "parse-failed": { label: "PARSE ✗", cls: "bg-rose-400/20 text-rose-100 ring-rose-400/30" },
    error: { label: "ERRO", cls: "bg-rose-500/25 text-rose-100 ring-rose-500/40" },
  };
  const p = map[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] ring-1 ${p.cls}`}
    >
      {p.label}
    </span>
  );
}
