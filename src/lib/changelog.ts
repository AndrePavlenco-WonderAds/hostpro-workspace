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
    version: "0.8.3",
    date: "2026-06-07",
    title: "Import: custos + funcionário Abril e Maio 2026 (SE2, SE5, OFO)",
    highlights: [
      "**📥 27 custos importados a partir do Google Sheets.** As colunas *Despesas* + *Funcionário* dos meses de Abril e Maio (screenshots) ficaram registados no blob: SE2 ganhou 15 entradas (€613,04), SE5 ganhou 11 entradas (€305,90), OFO ganhou 1 entrada (€35,00 da limpeza S.J.Estoril 23/04 que não estava na seed). `scripts/import-custos-abr-mai-2026.mjs` é idempotente — corre-se de novo e não duplica.",
      "**🧠 Regras de mapeamento aplicadas (documentadas no script):** descrições genéricas como *Chinês · Tinta · Lavandaria · Compras Continente · Toalhas · Tecnico Internet · Aguas Maio Cash* sem indicação de AL → **SE2 por defeito** (instrução do Andre para Abril); *T2 2º e 5º* (€50) → split €25 SE2 + €25 SE5; *t2 elbia 5º-8e11* (€50) → split em duas limpezas SE5 (08/04 e 11/04, porque a descrição menciona literalmente as duas datas); *Agua dos T2s* (€61,80) → split €30,90 SE2 + €30,90 SE5; *S.J.Estoril* → OFO (não SE2/SE5); *Mãe* → person `Lilia`; *Mãe/Andre* → `André`.",
      "**🧺 Lavandaria como despesa regular, não kind=lavandaria.** A linha *09/04 €207,50 Lavandaria* foi registada como `kind: \"despesa\"` (com valor em €) e não como `kind: \"lavandaria\"` (que é só kg de roupa). O Google Sheets do Andre só tem coluna de € na secção Despesas — não há peso. Se mais tarde quiseres separar valor da lavandaria por mês, fazemos uma despesa-categoria dedicada.",
    ],
  },
  {
    version: "0.8.2",
    date: "2026-06-07",
    title: "Import: SE5 + SE2 entradas Jan→Jun 2026 (Booking.com + Airbnb)",
    highlights: [
      "**📥 42 entradas importadas para o blob.** Sweet Escape · 5º recebeu 13 entradas (11 Booking + 2 Airbnb) e Sweet Escape · 2º recebeu 29 entradas (22 Booking + 7 Airbnb) — todas com payout entre Janeiro e Junho de 2026. O ficheiro `scripts/import-bookings-2026.mjs` é o registo auditável de cada reserva (booking number, hóspede, valores) e é idempotente: corre-se de novo e não duplica nada (skip por `id`).",
      "**📒 Convenção mantida igual à seed da One For One House.** `amount` = guest gross (Booking `Amount` · Airbnb `Gross earnings`), `iva` = `round(amount × 0.06, 2)` (Andre trata o gross como base tributável e adiciona 6% por cima), `date` = data do payout, `stayWindow` = `DD/MM-DD/MM`, `person` = André, `recebido`/`noBanco` = true (todos os payouts já caíram), `inIvaVault` = false (Andre alterna no fecho trimestral). Uma linha de ajuste da Booking (Alejandra Refoyo, May 11, Amount=0, Net=-9.40) foi propositadamente saltada porque não representa receita.",
      "**🧾 Como correr de novo se algo der errado.** `cd hostpro-workspace && node --env-file=.env.local scripts/import-bookings-2026.mjs` — o script lê o blob actual, faz `Set<id>` dos existentes, e só insere o que falta. Saída inclui breakdown por propriedade para verificação rápida.",
    ],
  },
  {
    version: "0.8.1",
    date: "2026-06-07",
    title: "Pagamento a funcionário · Limpeza + tarifa T2/T3 pré-preenchidas",
    highlights: [
      "**🧹 *Novo pagamento a funcionário* já abre pronto a registar.** Limpeza é a entrada de funcionário mais comum (uma por turn-over) e a tarifa é fixa por tipologia. O form passou a abrir com **Descrição: `Limpeza`** e **Valor (€)** já preenchido conforme a propriedade — **25 €** para os T2 (Sweet Escape · 2º e Sweet Escape · 5º) e **35 €** para o T3 (One For One House). Na maioria dos turn-overs Andre só precisa de confirmar a data e carregar em *Registar*.",
      "**📒 Novo campo `defaultCleaningPaymentEur` em `BILLING`.** A tarifa de limpeza por propriedade vive no mesmo `Record<PropertySlug, PropertyBilling>` que já tinha as moradas e os defaults da reserva (`src/lib/property-billing.ts`). Single source of truth — quando a tarifa subir, muda-se aqui e o form, a reserva e o /admin (se vier a usar isto) ficam todos coerentes.",
      "**✏️ Editar pagamento continua a respeitar o histórico.** Os defaults só se aplicam em `Novo pagamento` — o ramo *Editar* continua a usar `editing.description` e `editing.amount` para não reescrever silenciosamente uma entrada antiga.",
    ],
  },
  {
    version: "0.8.0",
    date: "2026-06-06",
    title: "Home: KPIs migrados para dentro dos cards de alojamento",
    highlights: [
      "**🏠 Cada card de alojamento passou a ser um mini-dashboard.** Os tiles agregados (*Junho 2026*, *Acumulado · 2026*) que estavam por cima dos cards foram removidos — ocupavam meia viewport com números que já estavam (ou podiam estar) dentro de cada card. Em vez disso cada card agora tem duas secções por dentro: *Jun 2026* com 4 KPIs em 2×2 (**Ganhos** verde · **Custos** vermelho · **Lucro** verde/vermelho conforme o sinal · **Lavandaria** em kg do mês) e *2026 · YTD* com 3 mini-KPIs (Ganhos verde · Lucro verde/vermelho · Reservas) numa strip horizontal.",
      "**🎨 Cor por significado — verde = receita, vermelho = custo.** Antes os Ganhos eram cyan (cor de marca) e o Lucro era branco neutro. Andre queria que o significado dos números fosse imediato: agora *Ganhos* e *Lucro positivo* renderizam em `text-emerald-300`, *Custos* e *Lucro negativo* em `text-rose-300`. Lavandaria fica branco porque é uma medida em kg, não valor monetário.",
      "**🧺 Lavandaria do mês visível no card.** A roupa que a lavandaria leva é uma das despesas operacionais que mais varia com a ocupação — passou a aparecer em cada card como `X kg` do mês actual, calculado via `totalLavandariaKg(filterMonth(entries, current))`. Permite ver de relance se um alojamento teve ocupação anormal sem precisar abrir a página.",
      "**🧹 Anotações redundantes removidas.** Eliminado o subtítulo *TOCAR PARA ABRIR* sobre a grelha de alojamentos (os cards são obviamente clicáveis pelo hover state e pelo cursor) e a legenda *DADOS AO VIVO · JUNHO 2026* por baixo do botão *Visão Geral* (a info do mês já está dentro de cada card; o *ao vivo* era ruído).",
      "**⚡ Uma única leitura de dados em vez de N+1.** O page.tsx antigo fazia `Promise.all(PROPERTIES.map(p => getEntries(p.slug)))` — 3 leituras paralelas mas independentes do mesmo blob. Trocado por uma única chamada a `getAllEntries()` seguida de `filter` local por slug. Resultado: 1 fetch ao Blob em vez de 3, e os agregados YTD/mês/lavandaria ficam triviais de calcular sobre o conjunto completo.",
    ],
  },
  {
    version: "0.7.0",
    date: "2026-06-04",
    title: "App optimizada para mobile — adeus scroll preso e overflows",
    highlights: [
      "**📱 Home deixou de bloquear scroll em telemóvel.** A `Home` usava `h-screen overflow-hidden` para forçar tudo dentro de uma viewport em desktop — em mobile isso significava que o logo + claim + 3 cards de alojamento + botão *Visão Geral* eram comprimidos numa só viewport sem qualquer hipótese de scroll. Trocado por `min-h-screen` (sem `overflow-hidden`) e padding mais apertado (`px-4 py-8` em vez de `px-6 py-6`). Em desktops continua a parecer one-page porque o conteúdo cabe naturalmente.",
      "**⌨️ Claim *O seu alojamento, nas melhores mãos.* já quebra em telemóvel.** O `whitespace-nowrap` no h1 obrigava a linha a manter-se inteira (36 caracteres em `text-2xl` → overflow horizontal em iPhones SE). Passou a aplicar-se só em `sm:` para cima — em mobile a frase quebra naturalmente em duas linhas. Tamanho da type também ajustado para `text-xl sm:text-3xl`.",
      "**📊 Tabela *Actividade recente* do `/admin` deixou de ficar cortada.** Estava dentro de um wrapper `overflow-hidden rounded-2xl` sem `overflow-x-auto` interno — em ecrãs estreitos as últimas colunas (Descrição, Valor) eram clipped. Agora há um `<div class=overflow-x-auto>` entre o card e a tabela, e os paddings das células passaram a `px-3 py-3 sm:px-5` para os ecrãs mais pequenos. O grid de tiles *Ganhos {ano} · Custos · Lucro · Margem* também passou a 2 colunas em mobile (era single column por causa do `sm:grid-cols-4` sem fallback explícito).",
      "**📐 Tile *Lucro* já não fica sozinho na última linha.** No `OverviewTiles` há 5 tiles num grid `grid-cols-2 sm:grid-cols-5`. Em mobile isso punha o *Lucro* (com `emphasis`) sozinho na 3ª linha. Adicionei prop `spanFullOnMobile` que faz `col-span-2 sm:col-span-1` — agora o tile do Lucro estica para ocupar a linha toda em telemóvel, ficando como o destaque grande que era para ser.",
      "**📈 Gráfico *Tendência mensal* refeito para mobile.** Era um `grid grid-cols-12` com `col-span-2` para a label do mês, `col-span-9` para as barras e `col-span-1` para o lucro — em ecrãs estreitos a label do mês ficava esmagada e o valor do lucro ficava `+€1.234` cortado. Em mobile passou a stacked: linha 1 = mês + lucro lado-a-lado; linha 2 = barras ganhos/custos com os valores no fim. Em `sm:` para cima volta ao layout horizontal original.",
      "**🖨 Página de reserva responsiva para criar PDFs no telemóvel.** Toolbar sticky agora encolhe — *Imprimir / Gravar PDF* fica só *🖨 PDF* em mobile; título *Nova reserva* esconde-se. Card da factura passou de `p-8 sm:p-10` para `p-5 sm:p-8 md:p-10`. Tamanhos serif do `RESERVA` e `Obrigado!` reduzidos (`text-4xl sm:text-6xl` e `text-3xl sm:text-5xl`) e o footer (logo + tagline) tem agora `flex-wrap` para nunca espremer o logo do lado do *Obrigado!* em ecrãs muito estreitos. Tabela de totais usa `text-xs sm:text-sm`.",
      "**📑 Tabelas P&L — paddings das células finalmente cabem em ecrãs estreitos.** `px-5 py-3` por célula em 7 colunas (Data · Estadia · Pessoa · Valor · IVA · Estado · Acções) significava ~120px de padding lateral por linha. Agora `px-3 py-3 sm:px-5` — recupera ~80px de largura útil por linha em mobile, e as toggles *Recebido · No banco · IVA Vault* já cabem na coluna Estado sem partir.",
      "**🏠 Cabeçalhos das páginas de alojamento e admin também encolhidos.** `px-6 py-10` → `px-4 py-8` em mobile (`/admin` e `/alojamentos/[slug]`). Hero da página do alojamento ganhou `flex-wrap` no header de cima (botão *Início*, *🧾 Gerar reserva*, chip de localização) para nunca rebentar a linha em iPhones SE. Título h1 do alojamento desceu de `text-3xl` para `text-2xl` em mobile.",
      "**🧭 Viewport meta explícito.** `layout.tsx` agora exporta `const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#142030' }` — o `viewport-fit=cover` deixa o background levar até às margens do notch no iPhone, e `themeColor` matches o navy escuro do app (Safari pinta a barra de URL com a mesma cor).",
    ],
  },
  {
    version: "0.6.1",
    date: "2026-06-02",
    title: "Total de kg do mês visível no header da Lavandaria",
    highlights: [
      "**🧮 Chip novo `7,0 kg este mês` ao lado de `1 ENTRADA` no header da Lavandaria.** Sempre visível (mesmo com uma entrada só), com a accent violeta da secção. Antes só aparecia uma linha de Total no fundo da tabela quando havia >1 entrada — agora o número fica num sítio onde dá para ver de relance. O `SectionShell` ganhou um slot `meta` reutilizável: as outras secções podem mais tarde fazer o mesmo para mostrar, p.ex., `Lucro do mês` no header das Entradas.",
    ],
  },
  {
    version: "0.6.0",
    date: "2026-06-02",
    title: "Adeus modais — adicionar/editar agora expande o próprio card",
    highlights: [
      "**🪲 As versões 0.5.6/0.5.7 ainda usavam um modal centrado para `+ Adicionar` e `Editar` — tapava o resto da página e ainda introduzia uma scrollbar.** Andre disse explicitamente: *quero que se veja o container todo e que ele aumente quando clicamos*. Modal estava errado para esta UX.",
      "**🛠 Refactor — cada secção (Entradas / Custos / Lavandaria / Funcionário) agora expande inline.** Carregar em `+ Adicionar` ou `Editar` faz aparecer um painel de formulário **dentro do próprio card** entre o header e a tabela. Sem overlay, sem `position: fixed`, sem scrollbar nova — o card cresce e empurra o resto da página para baixo, exactamente o comportamento natural.",
      "**🎯 UX detalhes que valem o cuidado:** a linha que está a ser editada fica destacada com a cor da secção (cyan, rose, violet, amber); o botão `Editar` muda para `A editar` enquanto está activo; o painel do formulário usa um tom subtil da accent (e.g., violet para Lavandaria); botão `Cancelar` ao lado do `Registar`/`Guardar alterações` para sair sem ratos a procura do `✕`.",
      "**🗑️ Apagado:** `add-entry-dialog.tsx` (-249 linhas) e `edit-entry-button.tsx` (-262 linhas). Toda a lógica vive agora em `pnl-table.tsx` com um hook partilhado `useSectionForm()`. Forms remontam ao trocar entre add/edit ou entre IDs diferentes via `key` no `<form>`, evitando seeds presos de `defaultValue`.",
    ],
  },
  {
    version: "0.5.7",
    date: "2026-06-02",
    title: "Modais com scroll interno — botão de submit nunca mais fica tapado",
    highlights: [
      "**🪲 Botão `Registar lavandaria` (e os outros) ficava por baixo do limite da viewport em janelas mais baixas — não dava para clicar.** O painel do modal tinha `flex items-center` no overlay e o painel em si sem `max-height` nem scroll. Quando a soma das alturas dos campos passava a altura útil da viewport (entrada com 3 checkboxes + IVA chega lá rápido em ecrãs pequenos), o submit caía para fora.",
      "**🛠 Fix — overlay scrollável + painel com `my-auto` e `items-start` em mobile.** O overlay passou a `overflow-y-auto` com `py-6` (mobile) e `sm:items-center sm:py-10`. O painel ganhou `my-auto` para continuar a centrar verticalmente quando há espaço, e escorrega para o topo + scroll quando não há. Aplicado nos dois modais que existem (`AddEntryDialog` e `EditEntryButton`).",
    ],
  },
  {
    version: "0.5.6",
    date: "2026-06-02",
    title: "Nova tabela Lavandaria — peso de roupa por mês",
    highlights: [
      "**🧺 Nova secção *Lavandaria* entre Custos e Funcionário.** Mesma estrutura visual das outras (header com contador, botão `+ Adicionar lavandaria` à direita, accent violeta para distinguir à vista). Cada linha tem **Data** à esquerda, **Descrição** fixa em *Lavandaria* e **Peso (kg)** à direita — com `Editar` e `Apagar` iguais às tabelas existentes. No fundo da tabela aparece um total em kg quando há mais do que uma entrada.",
      "**🧬 Modelo de dados — `kind: \"lavandaria\"` é um 4º variant do `PnLEntry`.** Diferente das outras três por não ter pessoa, conta nem valor em euros — apenas `date` e `weightKg`. IDs com prefixo `lvd-NNN`. Persiste no mesmo blob `data/pnl.json` que o resto, então herda automaticamente todo o fluxo de reads/writes corrigidos na v0.5.5 (sem cache da CDN, escritas instantâneas).",
      "**🛡️ Type-narrowing alinhado no resto da app.** Onde código antigo acedia a `e.amount` sem narrowing (`biggestDespesa`, `topCustos`, `ActivityRow` do `/admin`), passou a filtrar explicitamente por `despesa`/`funcionario` ou a tratar lavandaria como caso separado (mostra `12.5 kg` em vez de `−€`). O agregado mensal (`MonthlyTotals`) não muda — lavandaria não afecta ganhos/custos/lucro.",
    ],
  },
  {
    version: "0.5.5",
    date: "2026-06-01",
    title:
      "Saves aparecem instantâneamente · default-date inteligente · fix CDN do Blob",
    highlights: [
      "**🪲 Diagnóstico — adicionar um custo demorava até 1 minuto a aparecer.** Confirmado empiricamente: o CDN público do Vercel Blob serve cada blob com `Cache-Control: max-age=60` (60 s mínimos), e *ignora* tanto query-strings de cache-bust (`?v=ts`) como o header `Cache-Control: no-cache` no request. Mesmo com `cacheControlMaxAge: 0` no `put`, o CDN respondia `HIT` durante quase 5 minutos com o JSON antigo (testei com 6 estratégias diferentes — todas falharam).",
      "**🛠 Fix — cada escrita usa um URL novo que a CDN nunca viu.** `writeBlob` passou a `addRandomSuffix: true` (gera `data/pnl-<hash>.json`), e o `del()` apaga as versões anteriores assim que a nova fica no sítio. `readBlob` faz `list({ prefix: 'data/pnl' })` (API autenticada, sem CDN entre nós), pega no blob com `uploadedAt` mais recente e fetcha esse URL — primeira vez que aquele URL é visto → `age: null` → conteúdo fresco. Verificado com probe end-to-end: write → read imediato devolve o probe entry.",
      "**🎯 Default-date inteligente no `+ Adicionar`.** Quando estás a ver Maio (que já passou), o input de data abre em **31/05** em vez de hoje. Se estás no mês corrente, abre em hoje. Se estás num mês futuro, abre no dia 1. Acabou o problema típico de adicionar um custo a pensar que ia para Maio e ele cair em Junho porque a data tinha ficado a default em hoje. Helper novo `defaultDateForMonth(monthKey)` em `src/lib/dates.ts`.",
    ],
  },
  {
    version: "0.5.4",
    date: "2026-06-01",
    title: "Ganhos acumulados primeiro no dashboard",
    highlights: [
      "**📊 Bloco *Ganhos acumulados* + gráfico anual passou para o topo do dashboard de cada alojamento.** Antes estava em baixo, depois dos 3 records pequenos. Faz mais sentido começar pelo número grande do ano em curso e só depois aprofundar nos detalhes mensais (maior reserva do mês, melhor mês de sempre, lucro acumulado).",
    ],
  },
  {
    version: "0.5.3",
    date: "2026-05-30",
    title:
      "Chips de estado clicáveis · pessoa editável inline · fix Funcionário sem botão editar",
    highlights: [
      "**👆 Chips de estado agora são botões.** *Recebido · No banco · IVA Vault* (entradas), *Pago · Conta empresa/pessoal* (funcionário), *Conta empresa/pessoal* (custos) — todos clicáveis directamente na linha. Carrega → toggle imediato (optimistic) → server action `toggleFlagAction` grava no Blob → revalida. Acabou abrir o modal só para marcar uma reserva como recebida.",
      "**🎯 Pessoa também é editável inline.** A pill colorida (André cyan · Carol fuchsia · Alex amber · Lilia violeta) ganha um pequeno ▾ — clica e abre dropdown com os 4 nomes para trocar quem pagou. Outside-click fecha. Server action nova: `changePersonAction(id, newPerson, property)`.",
      "**🪲 Funcionário ficou sem botão Editar em v0.5.1.** Um dos 3 `Edit` falhou silenciosamente quando reescrevi as 3 tabelas (o `String to replace not found` que ignorei) e a coluna acabou só com Apagar. Corrigido — todas as linhas têm Editar + Apagar lado-a-lado.",
      "**🛠 Também corrigi a tabela Funcionário a usar labels antigas** *Out of account* / *Conta HostPro* — agora usa as labels novas (*Conta empresa* / *Conta pessoal*) consistentes com a tabela de Custos.",
    ],
  },
  {
    version: "0.5.2",
    date: "2026-05-30",
    title:
      "Save reflecte logo · botões maiores · YearChart com custos lado-a-lado e eixo Y",
    highlights: [
      "**⚡ Editar/apagar reflecte instantaneamente.** `unstable_cache` em `pnl-store.ts` estava a aguentar leituras antigas até 60 s mesmo com `updateTag`. Saiu — agora cada `getAllEntries()` lê directo do Vercel Blob. `revalidatePath` + `router.refresh()` no client basta para a página actualizar logo após guardar. Custo extra: 1 fetch ao Blob por page-load (~50 ms na mesma região), trade-off saudável para o tráfego deste app.",
      "**🖍 Botão *Editar* MUITO mais visível.** Era um lápis cinzento de 7px — passou a uma pill cyan com borda+fundo translúcidos, texto 'Editar' explícito ao lado do ✎. O *Apagar* matched: pill cinzenta com 🗑+'Apagar', vira vermelha+'Confirmar' no primeiro clique e completa no segundo. Cabem os dois lado-a-lado em qualquer linha sem partir o layout.",
      "**📊 *Ganhos acumulados* — barras lado-a-lado + eixo Y em €.** Cada mês mostra agora duas barras (cyan = ganhos, vermelha = custos), o que torna óbvio quando os custos comeram um mês inteiro. Eixo vertical à esquerda com gridlines a 500€/1k€/etc. (step auto-escolhido: 500€ até €2k, 1k€ até €5k, 2k€ acima). Legenda *Ganhos · Custos* discreta no canto inferior direito. Animação `bar-grow` mantém-se, com 35 ms de delay entre a barra de ganhos e a de custos do mesmo mês para o efeito de cascata.",
    ],
  },
  {
    version: "0.5.1",
    date: "2026-05-30",
    title:
      "Editar entradas · gráfico mensal a animar · Obrigado! cabe na página · moradas Sweet Escape",
    highlights: [
      "**✎ Cada entrada (Entrada · Custo · Funcionário) tem agora um botão de editar** ao lado do trash. Carrega no lápis — abre um modal pré-preenchido com os valores actuais (data, descrição/janela, pessoa pagou, valor, IVA, todos os flags). Submit chama uma nova `updateEntryAction` em `pnl-actions.ts` que valida, escreve no Vercel Blob e revalida `/`, `/admin` e a página do alojamento. Já não há excel a fugir do app.",
      "**🟦 Gráfico do tile *Ganhos acumulados* corrigido + animação.** As barras dos 12 meses não apareciam — o `height: %` estava a colapsar porque a coluna intermédia não tinha altura definida. Cada coluna tem agora `h-24` fixos e a barra é absolute-positioned a partir do fundo, com `scaleY(0) → scaleY(1)` em `bar-grow` (cubic-bezier 0.22,1,0.36,1) e `animationDelay = i × 70 ms` por mês para o efeito de chegarem em sequência. As barras finas cinzentas marcam os meses ainda sem dados.",
      "**📈 Barras de *Tendência mensal* também animam** — `bar-line` faz `scaleX(0) → scaleX(1)` da esquerda para a direita quando carregas a página. Cabeçalho ganhou subtítulo *Desde início de 2026* e o badge *5 meses* desapareceu.",
      "**🔢 Reservas em vez de entradas.** O subtítulo do tile *Ganhos acumulados* agora diz *`X reservas desde 01/01/{ano}`* — só conta as `kind=entrada` em vez de todas as entries. Para o histórico actual: 41 reservas (era 81 a contar tudo).",
      "**📝 *Funcionário* → *Funcionários* no plural** no `OverviewTiles`.",
      "**🏷 Labels mais explícitos** no `DashboardStats`: *Lucro acumulado desde início de {ano}* (era só *Lucro acumulado*), *Ganhos acumulados desde início de {ano}* (era *Ganhos acumulados em {ano}*).",
      "**📦 Rodapé global com versão** em todas as páginas (`AppFooter` adicionado ao `RootLayout`) — `HostPro Workspace · vX.Y.Z` clicável para `/changelog`. Página de impressão (`/reserva`) esconde-o automaticamente via `print:hidden`.",
      "**📐 *Obrigado!* já não cai para a 2ª página do PDF.** Reduzi margens verticais da factura (mt-20 → mt-10, py-8 → py-6), apliquei `break-inside: avoid` aos blocos *DADOS BANCÁRIOS* e *footer*, e `break-before: avoid` ao footer para o renderer nunca o empurrar sozinho. Em A4 com a estadia típica cabe tudo numa página.",
      "**🗺 Moradas da Sweet Escape preenchidas.** SE2 = *Rua do Viveiro 15, 2ºB, 2765-294 Estoril*. SE5 = *Rua do Viveiro 15, 5ºD, 2765-294 Estoril*. One For One House mantém a morada da factura de referência.",
      "**🖼 Foto principal do One For One House actualizada** para o quarto principal com varanda (`IMG_5537.jpeg`) — luz natural óptima, mais premium do que o twin-bed anterior.",
      "**🌫 Blur da home reduzido** de `blur-2xl opacity-50` para `blur-lg opacity-55`. O ambiente fica reconhecível sem competir com o conteúdo.",
    ],
  },
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
