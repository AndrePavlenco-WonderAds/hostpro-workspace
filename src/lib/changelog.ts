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
    version: "0.5.0",
    date: "2026-05-30",
    title:
      "Gerar reserva — formulário com preview ao vivo e imprimir para PDF",
    highlights: [
      "**🧾 Cada alojamento ganha uma página de geração de reserva.** Botão `🧾 Gerar reserva` aparece no canto superior direito da página do alojamento, abre `/alojamentos/[slug]/reserva`. Layout: barra de ferramentas em cima (back para o alojamento, título, e o botão grande `🖨 Imprimir / Gravar PDF`); duas colunas em baixo — esquerda é o **formulário**, direita é a **factura ao vivo**. Tudo o que escreves actualiza a preview imediatamente.",
      "**📋 Campos do formulário** (todos pré-preenchidos com o default certo, editáveis por reserva): Nome do cliente · Check-in (date) · Nº de noites (auto-calcula check-out por baixo) · Preço por noite (€) · Desconto por noite (€) · Taxa de limpeza (€) · Outras taxas (%) · bloco colapsável `Dados bancários` com Banco / Beneficiário / IBAN / SWIFT · Observações (não aparecem no PDF).",
      "**🖨 Imprimir/Gravar PDF directo do browser, zero infra extra.** `@media print` esconde tudo menos a área da factura, define A4 com 12 mm de margem, força fundo branco e texto preto. Clica no botão, o teu Chrome/Safari mostra o diálogo de impressão — em *Destino* escolhes *Guardar como PDF*. Sem dependências de Puppeteer ou react-pdf.",
      "**📐 Factura calcada na referência que enviaste.** Topo: ícone HostPro (azul) + **RESERVA** em serif (Cormorant Garamond, importada via `next/font/google`). Bloco `CLIENTE: ` à esquerda + `APARTAMENTO:` à direita com a morada multi-linha. Tabela `Item | Preço Noite | Desconto | Total` — preço por noite com risco quando há desconto, total da estadia automaticamente noites × preço-final. Linhas Taxa de Limpeza, Subtotal, Outras Taxas (-%), Total (grande). `DADOS BANCÁRIOS` por baixo. Rodapé: **Obrigado!** em serif à esquerda e logo HostPro horizontal + *With you all over Portugal* à direita.",
      "**🏢 Moradas e bancário em `src/lib/property-billing.ts`.** One For One House já tem a morada exacta da factura de referência (Rua Gil Vicente Nº141, R/C B, São João Do Estoril). 🔴 **Para Sweet Escape 2 e 5 falta-me o número da Avenida de Saboia** — coloquei placeholders \"[nº a confirmar]\" que precisas de me dar quando puderes. Os dados bancários (Revolut UAB · André Pavlenco Garnytskyy · IBAN PT50… · SWIFT REVOPTP2) ficaram constantes mas editáveis no form caso queiras enviar via outra conta.",
      "**🔢 Cálculo automático**: `Final/noite = Preço − Desconto`; `Estadia = Final × Noites`; `Subtotal = Estadia + Limpeza`; `Outras Taxas = Subtotal × %`; `Total = Subtotal + Outras Taxas`. Formatação dos preços calca o PDF (`110€` em vez de `€110,00`).",
    ],
  },
  {
    version: "0.4.1",
    date: "2026-05-30",
    title:
      "Home sem scroll com typewriter · tiles a vermelho · Lucro · Lilia · admin 100% pt-PT",
    highlights: [
      "**🏠 Home compactada para caber numa só viewport.** `h-screen overflow-hidden`, paddings encolhidos, logo mais pequeno (240×66), barra cyan mais curta. O fundo já estava lá mas com `opacity-30` ficava quase invisível — subiu para `opacity-50` e o overlay navy passou de 75/85/95 para 55/70/85. Botão CTA agora diz **\"Visão Geral\"** em vez de \"Admin view\".",
      "**⌨️ Claim com efeito de máquina de escrever.** O h1 \"O seu alojamento, nas melhores mãos.\" deixou de partir em duas linhas (`whitespace-nowrap`, tamanho desceu para `text-2xl sm:text-3xl`) e é renderizado por um novo `<Typewriter>` client component que escreve um caracter de cada vez com cursor a piscar quando termina.",
      "**🏘 Sweet Escape 2 com foto diferente.** A imagem antes era da Sweet Escape 5 (mesma pasta) — agora aponta para a cozinha (`IMG_5935`) para visualmente se distinguirem. **🔴 Precisas de me enviar fotos reais do Sweet Escape 2** — `/Desktop/HOSTPRO/Apartamentos/Sweet Escapes/2º` só tem PDFs (contratos, RNAL, caderneta), nenhuma foto. Quando me mandares, troco.",
      "**🔴 Tiles de custo agora vermelhos.** `Custos`, `Funcionário` e `IVA` no `OverviewTiles` herdaram `accent=\"red\"`. **`Profit` foi renomeado para `Lucro`** no tile final, e no dashboard de cada alojamento o card *Profit acumulado* passou a *Lucro acumulado* (vermelho automático quando negativo, verde quando positivo).",
      "**📊 Ganhos acumulados ganhou gráfico mensal.** O tile cresce em duas colunas — esquerda mantém o valor + subtítulo *Desde 01/01/{ano} · N entradas*; direita renderiza 12 barras (Jan→Dez) com a receita de cada mês do ano corrente. Meses sem dados aparecem em barras finas cinza para a forma do ano se manter comparável à medida que se preenche. Label do tile agora explicita *Ganhos acumulados em {ano}*.",
      "**👥 Lilia entrou na equipa.** `PEOPLE` em `pnl-types.ts` passou de `[\"André\", \"Carol\", \"Alex\"]` para `[\"André\", \"Carol\", \"Alex\", \"Lilia\"]` — aparece no dropdown de todos os formulários e no `PersonPill` da tabela.",
      "**💸 \"Pessoa\" → \"Pessoa pagou\" para custos e funcionário.** Form dialog e cabeçalho das tabelas alteram dinamicamente o label só nas secções `Custos` e `Funcionário`. Em `Entradas` mantém-se `Pessoa` (é quem recebeu a reserva, não quem pagou).",
      "**🏢 Etiqueta \"Out of account\" abolida.** Checkbox do formulário passou a `Saiu da conta da empresa` (PT-PT directo). Chip da tabela: quando ligada → `Conta empresa` (neutro), quando desligada → `Conta pessoal` (amber, sinaliza reembolso pendente).",
      "**🇵🇹 /admin agora é 100 % pt-PT.** Tinha vestígios de inglês — `Admin overview`, `YTD`, `Live · v0.4.0`, `Top X expenses ever` mascarado, `Ganhos YTD` etc. Tudo passou: *Visão geral · Acumulado de 2026 · Ganhos 2026 · Custos 2026 · Lucro 2026 · Margem · Por alojamento · Ao vivo*. Card de comparação por alojamento mostra `Lucro {ano}` em vez de `YTD {valor}`. Memória gravada: *HostPro Workspace é estritamente pt-PT, nada de inglês mesmo para dev-speak.*",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-05-30",
    title:
      "Persistência real (Vercel Blob) · home com cards · admin overview · termo GANHOS/CUSTOS",
    highlights: [
      "**🗄 Persistência real com Vercel Blob.** Store privado `hostpro-data` ligado ao projecto, `BLOB_READ_WRITE_TOKEN` injectado nos três ambientes. `src/lib/pnl-store.ts` substituiu o stub in-memory por leitura/escrita em `data/pnl.json`: `getAllEntries` é cacheado com tag `pnl-data`, mutações invalidam via `updateTag` (a nova API do Next 16 para read-your-own-writes em server actions). Primeira leitura sem ficheiro semeia automaticamente a partir do `pnl-seed.ts` (as 81 entradas do One For One House importadas do Google Sheet) — assim podes adicionar a tua primeira entrada sem perder histórico.",
      "**✍️ CRUD completo nas tabelas.** O modal *em construção* foi-se. `+ Adicionar entrada/custo/pagamento` abre agora um diálogo real com data (default hoje), descrição/janela de estadia, valor, pessoa (dropdown), IVA com sugestão automática de 6 % para entradas, e os flags certos para cada tipo (Out of account, Pago, Recebido, No banco, IVA Vault). Submit chama uma server action que valida → escreve no Blob → revalida. Cada linha do P&L tem um 🗑 no fim — clica uma vez para armar (anel rosa), clica de novo para apagar.",
      "**🏠 Home reorganizada.** A descrição longa por baixo do claim desapareceu — agora estão os 3 cards de alojamento directamente na primeira página, e o botão *Admin view* fica logo abaixo. A rota `/alojamentos` foi removida (passou a ser redundante); cada card vai directo para `/alojamentos/[slug]`, e o back-link da página de alojamento aponta para `/`.",
      "**🗺 Localizações corrigidas.** Sweet Escape 2 e Sweet Escape 5 — **Monte Estoril** (eram São João do Estoril). One For One House — **São João do Estoril** (era Cascais). Descrição do One For One House passa a ser *\"Apartamento grande premium de 3 quartos em São João do Estoril\"*.",
      "**🏷 Terminologia: REVENUE → GANHOS, EXPENSES → CUSTOS.** Em todos os tiles (`OverviewTiles`), barras de tendência (`DashboardStats`), labels de cards, e secção do P&L (\"Despesas\" passou a \"Custos\"). A categoria das entradas em si (\"Entradas\") fica como está — é o termo do spreadsheet.",
      "**📊 Dashboard de alojamento mais focado.** Saíram os cards *Maior despesa de sempre* e *IVA acumulado*. *Maior reserva de sempre* passou a *Maior reserva — Mai 2026* (scoped ao mês actualmente visível). *Ganhos acumulados* ganhou subtítulo *Desde 01/01/{ano}* e ocupa a largura total. *Profit acumulado* mantém-se com a margem em %.",
      "**🛠 /admin agora é uma página a sério.** Overview do mês actual com tiles cruzados de todos os alojamentos, secção YTD ({ano}) com Ganhos/Custos/Profit/Margem, cartões de comparação por alojamento (com Δ vs mês anterior + link directo para cada página), Top 5 reservas e Top 5 custos de sempre, tabela de actividade recente (últimas 10 entradas cruzando propriedades) e um *roadmap de integrações* com o pedido das credenciais Talkguest + URLs iCal do Airbnb e Booking.",
      "**🔌 Integração automática de reservas — plano.** Talkguest (channel manager) é a fonte primária se tiverem API REST + webhooks; cobertura mínima sem API é iCal por listing de Airbnb e Booking, sincronizado por Vercel Cron diário. Detalhes na secção `Integrações automáticas — roadmap` em `/admin`.",
    ],
  },
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
