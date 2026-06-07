// Operator-facing page that orchestrates the Gmail OAuth dance. Two states:
//   - REFRESH_TOKEN missing → big "Ligar Gmail" button that POSTs to a
//     server action which sets an anti-CSRF state cookie and redirects to
//     Google's consent screen.
//   - REFRESH_TOKEN present → "Conectado" badge + the list of Gmail filters
//     Andre needs to create in the Gmail UI for the cron to pick anything up.

import Link from "next/link";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { buildAuthUrl } from "@/lib/gmail/oauth";

export const metadata = {
  title: "Ligar Gmail — HostPro Workspace",
};

const OAUTH_STATE_COOKIE = "hostpro-gmail-oauth-state";

async function startOAuth() {
  "use server";
  const state = randomBytes(24).toString("base64url");
  const store = await cookies();
  store.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10, // 10 min — just enough to round-trip Google
  });
  redirect(buildAuthUrl(state));
}

export default function ConnectGmailPage() {
  const hasRefreshToken = Boolean(process.env.GOOGLE_OAUTH_REFRESH_TOKEN);
  const hasClientId = Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID);
  const hasClientSecret = Boolean(process.env.GOOGLE_OAUTH_CLIENT_SECRET);
  const hasRedirect = Boolean(process.env.GOOGLE_OAUTH_REDIRECT_URI);
  const envReady = hasClientId && hasClientSecret && hasRedirect;

  return (
    <div className="min-h-screen bg-brand-navy-dark px-4 py-10 sm:px-10 sm:py-14">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/admin"
          className="text-sm text-white/55 transition hover:text-white"
        >
          ← Visão geral
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Ligar Gmail · auto-import de reservas
        </h1>
        <p className="mt-2 text-sm text-white/55 sm:text-base">
          Liga a inbox <strong className="text-white">hostpro.pt@gmail.com</strong> à
          app. Quando chegar um email de reserva Airbnb (ou Booking, mais tarde),
          o cron lê e regista a entrada sem intervenção tua.
        </p>

        <section className="mt-8 grid gap-3 sm:grid-cols-4">
          <EnvTile label="CLIENT_ID" ok={hasClientId} />
          <EnvTile label="CLIENT_SECRET" ok={hasClientSecret} />
          <EnvTile label="REDIRECT_URI" ok={hasRedirect} />
          <EnvTile label="REFRESH_TOKEN" ok={hasRefreshToken} emphasis />
        </section>

        {!envReady && (
          <p className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            Faltam env vars no projecto Vercel — completa o passo 6/7 antes de carregar em <em>Ligar Gmail</em>.
          </p>
        )}

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-6 backdrop-blur-md">
          {hasRefreshToken ? (
            <ConnectedBlock />
          ) : (
            <DisconnectedBlock envReady={envReady} startOAuth={startOAuth} />
          )}
        </section>

        <FiltersBlock />
      </div>
    </div>
  );
}

function EnvTile({
  label,
  ok,
  emphasis,
}: {
  label: string;
  ok: boolean;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        ok
          ? "border-emerald-300/30 bg-emerald-300/10"
          : "border-white/10 bg-white/[0.04]"
      } ${emphasis ? "sm:col-span-1" : ""}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-semibold ${
          ok ? "text-emerald-300" : "text-white/50"
        }`}
      >
        {ok ? "✓ presente" : "— em falta"}
      </p>
    </div>
  );
}

function DisconnectedBlock({
  envReady,
  startOAuth,
}: {
  envReady: boolean;
  startOAuth: () => Promise<void>;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
        Estado
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-rose-300">
        Não ligado
      </p>
      <p className="mt-3 text-sm text-white/65">
        Carrega no botão abaixo, autoriza o acesso à conta{" "}
        <strong className="text-white">hostpro.pt@gmail.com</strong> e cola o
        refresh token que aparece na Vercel.
      </p>
      <form action={startOAuth} className="mt-5">
        <button
          type="submit"
          disabled={!envReady}
          className="inline-flex items-center gap-2 rounded-full bg-brand-cyan px-6 py-2.5 text-sm font-semibold text-brand-navy shadow-[0_15px_40px_-12px_rgba(0,181,226,0.7)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ligar Gmail
          <span aria-hidden>→</span>
        </button>
      </form>
    </div>
  );
}

function ConnectedBlock() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
        Estado
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-300">
        ✓ Conectado
      </p>
      <p className="mt-3 text-sm text-white/65">
        Refresh token presente — o cron <code className="text-brand-cyan">/api/cron/import-emails</code>{" "}
        consegue ler emails e aplicar labels. Vê tudo o que apanhou em{" "}
        <Link href="/admin/email-import-log" className="text-brand-cyan underline">
          /admin/email-import-log
        </Link>
        .
      </p>
    </div>
  );
}

function FiltersBlock() {
  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-6 backdrop-blur-md">
      <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
        Filtros que tens de criar no Gmail (1 vez)
      </h2>
      <p className="mt-3 text-sm text-white/65">
        Estes filtros aplicam labels aos emails de interesse — sem labels, o
        cron não vê nada. Vai a{" "}
        <a
          href="https://mail.google.com/mail/u/0/#settings/filters"
          target="_blank"
          rel="noreferrer"
          className="text-brand-cyan underline"
        >
          Gmail → Settings → Filters
        </a>{" "}
        → <em>Create a new filter</em> e cria 2 filtros (por agora só Airbnb;
        Booking entra depois):
      </p>

      <FilterCard
        n={1}
        from="noreply@airbnb.com"
        subject={'"Reservation confirmed -"'}
        label="hostpro/airbnb-conf"
      />
      <FilterCard
        n={2}
        from="noreply@airbnb.com"
        subject={'"We sent a payout"'}
        label="hostpro/airbnb-payout"
      />

      <p className="mt-5 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-xs text-amber-100">
        ⚠️ Para cada filtro, na etapa final marca{" "}
        <strong>Apply the label</strong> + escreve o nome (cria a label nova se
        ainda não existir) e <strong>Apply filter to matching conversations</strong>{" "}
        — para apanhares os emails antigos que estão na inbox.
      </p>
    </section>
  );
}

function FilterCard({
  n,
  from,
  subject,
  label,
}: {
  n: number;
  from: string;
  subject: string;
  label: string;
}) {
  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-cyan">
        Filtro {n}
      </p>
      <dl className="mt-2 grid grid-cols-[120px_1fr] gap-x-3 gap-y-1.5 text-white/80">
        <dt className="text-white/45">From:</dt>
        <dd className="font-mono text-xs">{from}</dd>
        <dt className="text-white/45">Subject:</dt>
        <dd className="font-mono text-xs">{subject}</dd>
        <dt className="text-white/45">→ Label:</dt>
        <dd className="font-mono text-xs text-emerald-300">{label}</dd>
      </dl>
    </div>
  );
}
