// Workspace changelog — every version, newest first.
// When bumping the footer `v{version}`, prepend a new entry at the TOP of
// the CHANGELOG array (position 0 = latest).
//
// Versioning while we shape the foundation:
//   v0.X.Y — pre-launch iterations. Bump Y for small tweaks, X for shipping
//   new capabilities. Move to v1.0 the first time it serves a real reservation.

export type ChangelogEntry = {
  version: string;
  date: string; // ISO YYYY-MM-DD
  title: string;
  highlights: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.3.0",
    date: "2026-05-29",
    title:
      "/alojamentos hub · per-property dashboards · monthly P&L mirroring the Google Sheet",
    highlights: [
      "**🏘 `/alojamentos` now has the 3 active properties side-by-side.** Left → right: Sweet Escape 2, Sweet Escape 5, One For One House. Each card shows the location chip, a representative photo, the description, and a mini revenue/profit pair for the current month (falls back to the most recent month with data, so an empty current month doesn't leave the cards blank). Hovering lifts the card and tints the border with `brand-cyan`. Hero photos live under `/public/properties/{slug}.jpg`, each downscaled to ≤310 KB.",
      "**📊 `/alojamentos/[slug]` is a full property page.** Hero strip with the photo + name + location, then a `Dashboard` section (all-time records: maior reserva, maior despesa, melhor mês, receita acumulada, IVA acumulado, profit acumulado + a monthly bar trend of revenue vs total expenses), then the `P&L mensal` block. Mês actual aparece por defeito; se ainda não houver entradas neste mês, salta para o mês mais recente com dados.",
      "**🗓 Month picker** as a left/right arrow + dropdown with every month that tem dados plus current ± 1. URL state via `?m=YYYY-MM` so the page is shareable. Helpers in `src/lib/dates.ts` — `monthKey`, `shiftMonth`, `monthLabel` — converge on **DD/MM/YYYY** for display (per the user-wide rule).",
      "**🧮 P&L table mirrors the spreadsheet exactly, split into three sections — Entradas (💰), Despesas (💸), Funcionário (👷).** Each section has its own colour ring (cyan / rose / amber) and a `+ Adicionar` button (today opens a 'em construção · v0.4.0' modal — the persistence layer lands next). Per row: Data (DD/MM/YYYY), descrição/estadia, **Pessoa** as a colour-coded chip (André cyan · Carol fuchsia · Alex amber), Valor, IVA (entradas), and Estado chips that mirror the spreadsheet's flags (`Recebido`, `No banco`, `IVA Vault`, `Pago`, `Out of account`). Overview tiles on top: Revenue · Despesas · Funcionário · IVA · Profit, com delta vs mês anterior — sinal invertido para despesas (subida fica vermelha, descida fica verde).",
      "**🌱 One For One House comes seeded with the real numbers from your sheet.** 81 entries imported across Jan → Mai 2026 — para Mai o profit fica em €2.719,37 (€3.340,70 de revenue vs €621,33 de despesas totais), e a maior reserva de sempre é €1.975 (Renda em Fev, mas reservas: 20-27/05 com €834,86). Sweet Escape 2 e 5 ficam vazias até decidires se queres importar histórico ou começar a registar a partir de agora.",
      "**🔌 Storage layer ainda é in-memory.** `src/lib/pnl-store.ts` expõe `getEntries(slug)` + um `addEntry()` que é no-op com mensagem explícita; o objectivo desta release é validar a estrutura (colunas, secções, tiles, dashboard) antes de decidir o backend de persistência (Vercel Blob por JSON-por-propriedade vs. Upstash Redis). Quando a UI estiver aprovada, v0.4.0 troca o store por escrita real + server actions e mantém esta API.",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-05-29",
    title:
      "Password gate · home reshape (two CTAs over a blurred hero) · changelog wired",
    highlights: [
      "**🔒 App-wide password gate.** A new `proxy.ts` (the Next.js 16 rename of `middleware.ts`) intercepts every navigation and every API call. If the request doesn't carry a valid `hostpro-gate` cookie, it redirects to `/unlock`, preserving the original path as `?next=`. After a correct password the cookie is set `httpOnly · sameSite=lax · 30 days · secure in production`. Allow-list: `/unlock`, `/api/unlock`, static assets (`/_next/*`, `/favicon.*`, public images). Initial password is `superadmin` — override with the `HOSTPRO_GATE_PASSWORD` env var on Vercel.",
      "**🏠 Home is now a real entry point, not a placeholder.** Behind the content: the Sweet Escapes living-room photo at 1599×2072, served from `/public/hero-living-room.jpg` (downscaled to 443 KB), with `blur-2xl` + a navy-tinted overlay so the type stays legible. Two CTAs stacked around the existing brand block: **top — `Ver um alojamento específico` → `/alojamentos`**, **bottom — `Admin view` → `/admin`**. Both pages exist as stubs so nothing 404s.",
      "**📝 Changelog system mirroring Wonder Ads.** `src/lib/changelog.ts` is the single source of truth — prepend to the array, the footer auto-renders `v{CHANGELOG[0].version}` and links to `/changelog`. The page is gated behind the same superadmin password as the main app (separate cookie `hostpro-changelog` so the cadence can diverge later). Timeline UI re-themed to the HostPro palette (cyan dots + navy panels) instead of the WonderAds purple gradient.",
      "**🎨 Brand tokens unchanged**, but now exercised across more surfaces: `brand-navy` / `brand-navy-dark` for backgrounds, `brand-cyan` for the accent dot + the active CTA, `brand-cream` for body text on dark, `brand-ink` for body text on light.",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-05-29",
    title: "Initial scaffold — Next.js 16 + Tailwind v4 + Vercel Hobby",
    highlights: [
      "**🌱 `npx create-next-app@latest hostpro-workspace`** with TypeScript, ESLint, Tailwind v4, App Router, Turbopack, `src/` dir, `@/*` alias.",
      "**🔗 GitHub:** `AndrePavlenco-WonderAds/hostpro-workspace` (public). **Vercel:** `hostpro-workspace.vercel.app` on Hobby plan under the `HostPro's projects` team. `vercel git connect` ensured `main` auto-deploys to production.",
      "**🪲 Two snags hit and patched.** The Vercel project was created via dashboard before linking, so `framework` came up as `null` and `/` returned `NOT_FOUND` — fixed via `PATCH /v9/projects` with `framework: 'nextjs'`. Deployment Protection (`ssoProtection`) was on by default for the team — disabled.",
      "**🎨 HostPro branding applied to the scaffold.** Favicon (azul) + horizontal logos (azul + branco) copied into `/public`. Brand palette exposed as Tailwind tokens — `brand-navy` (#203247), `brand-navy-dark` (#142030), `brand-cyan` (#00B5E2), `brand-cream` (#F2F2EB), `brand-ink` (#0F0F0F). Landing page reuses the LinkedIn banner claim, *O seu alojamento, nas melhores mãos.*",
    ],
  },
];

export function getCurrentVersion(): string {
  return CHANGELOG[0]?.version ?? "0.0.0";
}
