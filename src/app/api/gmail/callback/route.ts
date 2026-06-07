// OAuth callback for the Gmail integration. Google redirects the browser
// back here with `?code=...&state=...`; we exchange the code for a refresh
// token and display it in a copy-friendly HTML page. The user copies the
// token into Vercel env vars (`GOOGLE_OAUTH_REFRESH_TOKEN`) and redeploys.
//
// We do NOT auto-persist the token to a blob — the refresh token is a
// production secret and lives next to its sibling client_id/secret in
// Vercel project settings, gated by Andre's Vercel team auth.

import { NextResponse } from "next/server";
import { exchangeCode } from "@/lib/gmail/oauth";

const OAUTH_STATE_COOKIE = "hostpro-gmail-oauth-state";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return errorPage(`Google devolveu um erro: ${error}`);
  }
  if (!code) {
    return errorPage("Sem ?code= na URL.");
  }

  // Anti-CSRF: state in cookie must match state in URL.
  const cookieState = req.headers
    .get("cookie")
    ?.split(/;\s*/)
    .find((c) => c.startsWith(`${OAUTH_STATE_COOKIE}=`))
    ?.split("=")[1];
  if (!state || state !== cookieState) {
    return errorPage("State inválido — recomeça em /admin/connect-gmail.");
  }

  let tokens;
  try {
    tokens = await exchangeCode(code);
  } catch (e) {
    return errorPage(`Falha na troca do code: ${(e as Error).message}`);
  }

  if (!tokens.refresh_token) {
    // Happens when the same Google account already authorised this client
    // and `prompt=consent` was not honoured. The fix is to revoke at
    // https://myaccount.google.com/permissions and retry.
    return errorPage(
      "Google não devolveu refresh_token. Revoga o acesso em https://myaccount.google.com/permissions e volta a tentar.",
    );
  }

  return new NextResponse(successHtml(tokens.refresh_token), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function successHtml(refreshToken: string): string {
  // The shell page is intentionally self-contained — no app shell, no nav —
  // so the secret is only on this one render.
  return `<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Gmail ligado — copia o token</title>
<style>
  :root { color-scheme: dark; }
  body { font-family: ui-sans-serif, system-ui, -apple-system; background: #142030; color: #fff; padding: 32px 20px; max-width: 720px; margin: 0 auto; }
  h1 { color: #00B5E2; font-size: 22px; }
  .ok { color: #6ee7b7; font-weight: 600; }
  .secret { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 14px; font-family: ui-monospace, Menlo, monospace; font-size: 12px; word-break: break-all; }
  button { background: #00B5E2; color: #142030; border: 0; border-radius: 999px; padding: 10px 18px; font-weight: 700; cursor: pointer; margin-top: 12px; }
  button:hover { opacity: 0.9; }
  ol { line-height: 1.7; }
  a { color: #00B5E2; }
  .warn { color: #fda4af; }
</style>
</head>
<body>
  <h1>✅ Gmail autorizado</h1>
  <p>O Google devolveu um <strong>refresh token</strong>. <span class="warn">Esta é a única vez que o vais ver — não fecha a página antes de o teres na Vercel.</span></p>

  <h2 style="font-size:14px; opacity:0.7; letter-spacing:0.15em; text-transform:uppercase; margin-top:24px;">refresh token</h2>
  <div id="token" class="secret">${escapeHtml(refreshToken)}</div>
  <button id="copy">Copiar</button>

  <h2 style="font-size:14px; opacity:0.7; letter-spacing:0.15em; text-transform:uppercase; margin-top:28px;">próximos passos</h2>
  <ol>
    <li>Abre <a href="https://vercel.com/host-pro-s-projects/hostpro-workspace/settings/environment-variables" target="_blank">Vercel → Environment Variables</a>.</li>
    <li>Adiciona uma nova var:<br>
      <strong>Key:</strong> <code>GOOGLE_OAUTH_REFRESH_TOKEN</code><br>
      <strong>Value:</strong> (cola o token acima)<br>
      <strong>Environments:</strong> Production + Preview + Development
    </li>
    <li>Faz <strong>Redeploy</strong> da produção (Dashboard → Deployments → ... → Redeploy).</li>
    <li>Volta a <a href="/admin/connect-gmail">/admin/connect-gmail</a> — deve dizer <strong>Conectado</strong>.</li>
  </ol>

<script>
  document.getElementById('copy').addEventListener('click', async () => {
    const t = document.getElementById('token').textContent || '';
    await navigator.clipboard.writeText(t);
    const b = document.getElementById('copy');
    b.textContent = 'Copiado ✓';
    setTimeout(() => { b.textContent = 'Copiar'; }, 1500);
  });
</script>
</body>
</html>`;
}

function errorPage(message: string): NextResponse {
  return new NextResponse(
    `<!doctype html><html lang="pt"><body style="font-family: system-ui; background: #142030; color: #fff; padding: 32px;">
      <h1 style="color:#fda4af;">Falha no callback</h1>
      <p>${escapeHtml(message)}</p>
      <p><a href="/admin/connect-gmail" style="color:#00B5E2;">Tentar outra vez</a></p>
    </body></html>`,
    { status: 400, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
