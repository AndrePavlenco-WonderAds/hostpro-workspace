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
    version: "0.25.0",
    date: "2026-07-17",
    title: "Custo partilhado pelos 3 alojamentos",
    highlights: [
      "**🧾 Botão 'Custo partilhado' na home.** Introduz um valor uma vez e a app divide-o pelos alojamentos, criando uma linha de custo em cada um com a mesma descrição e data — ideal para internet, seguros ou contabilidade.",
      "**🪙 Cêntimos repartidos ao certo.** 90 € → 30,00 € em cada um; 100 € → 33,34 € + 33,33 € + 33,33 €, para a soma bater sempre no total.",
    ],
  },
  {
    version: "0.24.1",
    date: "2026-07-14",
    title: "Resumo do hero sem foto duplicada",
    highlights: [
      "**🧹 Foto do André removida do resumo no topo** — já aparece na assinatura no fundo do relatório. Fica só a assinatura manuscrita 'André Pavlenco · Fundador'.",
    ],
  },
  {
    version: "0.24.0",
    date: "2026-07-14",
    title: "Concelho automático (online) no cabeçalho + texto do resumo",
    highlights: [
      "**📍 Concelho automático.** A linha de localização deixou de dizer 'de Cascais a Lisboa' e passa a mostrar o **concelho real** do alojamento, obtido online por geocodificação (ex: São Domingos de Rana · **Cascais**). Se a app estiver offline, usa a tabela interna como recurso.",
      "**✍️ Resumo.** 'Há uma base boa' passou a **'Há uma base mínima'** (mais honesto para pontuações intermédias).",
    ],
  },
  {
    version: "0.23.1",
    date: "2026-07-14",
    title: "Card do globo: barras relativas e textos mais diretos",
    highlights: [
      "**📊 Barras relativas.** As barras de Pontos fortes / A melhorar / Críticos deixaram de estar todas cheias — a de maior número enche a barra e as outras ficam proporcionais a essa.",
      "**🏷️ Título e local mais limpos.** O card mostra só o primeiro nome (ex: 'Diana') e por baixo apenas a localização (sem 'Airbnb').",
      "**💸 Banda mais vendedora.** 'A otimizar' passou a **'A perder €'** (e 'Perde muito €' abaixo de 40, 'Competitivo' acima de 70).",
    ],
  },
  {
    version: "0.23.0",
    date: "2026-07-14",
    title: "Globo em alta resolução (bilinear + texturas 4K) e mais zoom",
    highlights: [
      "**🔎 Muito mais nitidez.** Texturas NASA 4K (dia + luzes de cidade), amostragem **bilinear** e resolução de render muito maior — acabou o aspeto pixelado, mesmo com zoom.",
      "**🇵🇹 Mais zoom em Portugal** — o país fica maior e mais central no globo.",
      "**☄️ Estrelas cadentes** passaram a atravessar de baixo-direita para cima-esquerda.",
    ],
  },
  {
    version: "0.22.0",
    date: "2026-07-14",
    title: "Globo HD com dia/noite + hero com fundo espacial animado",
    highlights: [
      "**🛰️ Globo HD (dia + noite + nuvens).** Resolução muito maior e três texturas NASA misturadas por pixel: mapa de dia no lado ao sol, **luzes de cidade no lado escuro** (a fundir no terminador) e nuvens por cima. Mais zoom sobre Portugal.",
      "**💓 Ponto a pulsar (heartbeat) + linhas tracejadas.** O cruzamento das linhas no ponto do alojamento pulsa como um batimento cardíaco e a grelha/cruz passou a tracejada e a brilhar.",
      "**✨ Fundo da hero 1000x melhor.** Deixou de ser estático — agora tem nebulosas a derivar e a mudar de cor, duas camadas de estrelas com paralaxe, estrelas cadentes e vinheta. Tudo respeita 'reduzir movimento'.",
    ],
  },
  {
    version: "0.21.0",
    date: "2026-07-14",
    title: "Globo do hero refeito: Terra 3D com luz real, atmosfera e estrelas",
    highlights: [
      "**🌍 Terra verdadeiramente 3D.** Refiz o globo de raiz com iluminação direcional (normal · luz por pixel): limbo iluminado em cima à esquerda, terminador a escurecer para a sombra, brilho de fresnel e reflexo do sol. Deixou de parecer plano/2D.",
      "**🌫️ Atmosfera integrada + estrelas.** Halo azul desenhado no próprio canvas (alinhado ao globo, sem o 'bloco' desalinhado de antes), campo de estrelas a cintilar e flutuação suave — sem WebGL, funciona em qualquer browser.",
      "**➕ Grelha + cruzamento a brilhar** sobre o ponto do alojamento, com o card de dados ao lado.",
    ],
  },
  {
    version: "0.20.0",
    date: "2026-07-14",
    title: "Globo estilo Starlink: Terra de dia, grelha com foco e card de dados",
    highlights: [
      "**🌞 Terra de dia, mais clara e 3D.** Trocámos a textura noturna (ficava escura) por Blue Marble de dia, com mais zoom sobre Portugal e brilho de atmosfera — estilo do site da Wonder Ads.",
      "**➕ Grelha de latitude/longitude com foco.** O globo tem agora uma grelha e um **cruzamento cyan realçado que se cruza exatamente no ponto do alojamento**.",
      "**🪪 Card de dados ao lado do ponto.** Junto ao marcador aparece um cartão em vidro escuro com o essencial da auditoria: nome, plataforma, índice /100, banda, e pontos fortes / a melhorar / críticos.",
    ],
  },
  {
    version: "0.19.0",
    date: "2026-07-14",
    title: "Globo do relatório refeito: Terra 3D realista com continentes e luzes",
    highlights: [
      "**🌍 Terra realista.** O globo foi refeito de raiz. Deixou de ser um wireframe — agora é a **Terra a sério**, com continentes e luzes de cidade (textura NASA night-lights) projetada numa esfera com Canvas 2D, brilho de atmosfera e o ponto na localização real do alojamento. Sem WebGL, aparece sempre igual em qualquer browser.",
    ],
  },
  {
    version: "0.18.0",
    date: "2026-07-13",
    title: "Relatório: globo estático fiável, resumo assinado à mão e polish geral",
    highlights: [
      "**🌍 Globo estático em SVG.** Deixámos o WebGL (que não renderizava em alguns browsers e ficava preto). Agora é um globo desenhado à mão em SVG — esfera com atmosfera, grelha de meridianos e o ponto na localização real do alojamento. Aparece sempre, sem bugs.",
      "**✍️ Resumo redesenhado.** Bloco em estilo citação, com a assinatura do André movida para o fundo e escrita à mão (tipo de letra Caveat). O número do índice deixou de aparecer cinzento.",
      "**💎 Upgrade visual do corpo.** Cartões arredondados com relevo e hover, faixa de cor nos tiles, donut com etiqueta de estado, fundo das secções com malha de pontos subtil e brilhos (deixou de ser plano).",
      "**🔗 hostpro.pt** adicionado ao rodapé, à assinatura e ao cabeçalho do PDF.",
      "**🏷️ Copy:** 'Partilhar' → **'Copiar Link'**; 'Falar com a HostPro' → **'Falar com o André'**.",
    ],
  },
  {
    version: "0.17.0",
    date: "2026-07-13",
    title: "Relatório em modo dashboard — globo visível, animações e novo layout",
    highlights: [
      "**🌍 Globo corrigido e maior.** Os continentes passaram a ver-se (as cores navy antigas eram escuras demais e o globo parecia uma bola preta). Agora é maior, azul-aço luminoso, focado na localização com o ponto cyan ao centro, e arrastável.",
      "**📐 Layout tipo dashboard.** A partir do 'Diagnóstico' o relatório deixou de ser uma coluna estreita com margens enormes — passou a aproveitar a largura da folha com secções lado a lado (score + tiles, barras por área em 2 colunas, oportunidades em grelha, e 'Lados positivos' ao lado do plano da HostPro).",
      "**🔢 Animações ao abrir.** Os números fazem count-up, o donut do score desenha-se e as barras horizontais crescem quando o relatório abre.",
      "**📝 Descrições por área.** Cada área do 'Desempenho por área' ganhou uma linha cinzenta a explicar o que é.",
      "**✍️ Resumo assinado.** O resumo ficou maior, com etiqueta 'Resumo' e 'Assinado por André Pavlenco · Fundador'.",
      "**🏷️ Copy.** 'Auditoria de Anúncio' → 'Auditoria de Alojamento Local'; consultor → **Fundador**; 'Já conquistado' → **'Lados Positivos do AL'**.",
    ],
  },
  {
    version: "0.16.1",
    date: "2026-07-13",
    title: "Globo do relatório: mais localidades de Cascais reconhecidas",
    highlights: [
      "**📍 Marcador mais preciso.** O globo passou a reconhecer São Domingos de Rana, Tires, Alcabideche, Birre, Quinta da Marinha e Guincho — o ponto no mapa cai na localidade certa em vez do centro genérico da costa.",
    ],
  },
  {
    version: "0.16.0",
    date: "2026-07-13",
    title: "Relatório de prospecting reimaginado — globo, dashboard e PDF dedicado",
    highlights: [
      "**🌍 Herói com globo interativo.** A primeira secção passou a mostrar um globo 3D animado (arrastável) com um ponto luminoso a marcar a localização do alojamento na costa de Cascais a Lisboa. Fundo escuro premium com o índice de otimização em destaque.",
      "**📊 Painel de diagnóstico estilo dashboard.** Novo bloco com donut do score, tiles (pontos fortes / a melhorar / críticos / por confirmar) e **barras de desempenho por área** — vê-se num relance onde o anúncio está forte e onde falha.",
      "**🗂️ Roadmap redesenhado.** As oportunidades passaram a cartões numerados por prioridade, com cabeçalho colorido (Crítico → Importante → Menor) e recomendações claras por item.",
      "**✍️ Assinatura e CTA melhorados.** Bloco do consultor num cartão dedicado com logótipo, e CTA com botão de contacto direto.",
      "**📄 Download de PDF dedicado.** O botão **Partilhar** copia o link da versão web; um botão separado **Download PDF** gera uma versão vertical A4 otimizada só para impressão (cabeçalho limpo sem WebGL, uma coluna, quebras de página controladas).",
    ],
  },
  {
    version: "0.15.0",
    date: "2026-07-08",
    title: "Relatório de prospecting: roadmap prioritizado, plano de ação e assinatura",
    highlights: [
      "**🗺️ Plano de melhorias prioritizado (roadmap).** As oportunidades passaram a estar ordenadas por gravidade (Crítico → Importante → Menor), com etiqueta de prioridade por bloco e um ponto colorido por item. O contador ficou alarmante (**⚠ N a corrigir** em vermelho) e a home mostra também os pontos críticos.",
      "**📝 Notas da HostPro para o cliente.** Novo campo no workspace — 'Plano de ação' escrito à mão que **aparece no relatório** (num bloco navy 'O que a HostPro faz por si'). Serve para situar o roadmap concreto para o lead. As notas internas continuam a nunca aparecer.",
      "**✍️ Assinatura do consultor.** O relatório fecha com a assinatura do André Pavlenco (foto + Consultor HostPro + contactos).",
      "**🖨️ Impressão corrigida + UX.** Acabou o espaçaço gigante em branco na 1ª página (secções deixaram de forçar quebra inteira), margens mais justas e layout mais apertado e atraente. Removida a checkbox estranha e o bloco 'apenas uma amostra' desfocado.",
      "**🏷️ Categorias do anúncio + rodapé.** Passou a 'Título & Descrição do Anúncio', 'Fotos do Anúncio', etc. O rodapé interno deixou de aparecer nas páginas de prospecting e a cobertura passou a **'de Cascais a Lisboa'**.",
    ],
  },
  {
    version: "0.14.1",
    date: "2026-07-07",
    title: "Relatório de prospecting mais vendedor",
    highlights: [
      "**🎯 'Oportunidades de melhoria' com muito mais destaque.** Passou a um painel realçado (fundo azul-claro, barra lateral cyan, contador '{n} a corrigir') e cada ponto virou um item de checklist com caixa por marcar — salta à vista o que há a melhorar.",
      "**👀 Nova secção 'E isto é apenas uma amostra'.** Por baixo das oportunidades, um teaser com alguns pontos **desfocados** (sem nada real por trás) a sugerir que a auditoria completa tem muito mais — a puxar para o serviço.",
      "**📞 Footer corrigido.** Cobertura passou de 'Costa do Estoril' para **'de Cascais a Oeiras'** e adicionado o contacto **936 535 306** ao lado do email.",
    ],
  },
  {
    version: "0.14.0",
    date: "2026-07-06",
    title: "Prospecting — auditoria de listings + relatório para o cliente",
    highlights: [
      "**🔎 Nova secção Prospecting.** Metes o link de um listing de um potencial cliente e a app audita-o contra o checklist de otimização da HostPro (o Master File). Botões na home e no /admin. Cada análise tem um score, o que já está bem e as oportunidades de melhoria.",
      "**🤖 Airbnb lido automaticamente.** O scrape server-side lê o Airbnb via JSON-LD + estado da página: título, descrição, **contagem real de fotos**, rating e **amenidades** (WiFi, cozinha, aquecimento, café, Smart TV, berço, essenciais de praia…). A análise de texto (título <50 chars, keywords, distâncias a pé, estrutura, self check-in) e de amenidades/extras é **automática**.",
      "**✍️ Booking e o resto ficam assistidos.** O Booking bloqueia leitura automática (muro anti-bot), por isso nesses casos colas título/descrição/comodidades à mão. Fotos (qualidade), PriceLabs, automação e operações — que não se veem do exterior — ficam num checklist que confirmas com um toque (OK / a melhorar / N/A).",
      "**📄 Relatório bonito para o cliente.** Cada análise gera um relatório apresentável (branding HostPro, score, oportunidades e pontos fortes, CTA) partilhável por **link público com token** (fora do gate da password) e **imprimível / Guardar PDF**. As tuas notas internas nunca aparecem no relatório.",
      "**🗄️ Guardado no Blob** (`data/prospects.json`) com o padrão ops-safe do costume. ⚠️ O preço/flutuação não vem no HTML do Airbnb — essa parte fica em avaliação manual por agora (a API de calendário é frágil; podemos ligar mais tarde).",
    ],
  },
  {
    version: "0.13.1",
    date: "2026-07-06",
    title: "Nova foto do Sweet Escape 5º",
    highlights: [
      "**📸 Sweet Escape 5º com foto nova.** Substituída a foto do 5º pela imagem da cozinha (HEIC → JPEG, 1200×1600). Como o caminho `/properties/sweet-escape-5.jpg` se mantém, atualiza no card da home e no cabeçalho da página sem tocar no store.",
    ],
  },
  {
    version: "0.13.0",
    date: "2026-07-06",
    title: "Adicionar alojamentos diretamente na app",
    highlights: [
      "**🏠 Novo alojamento pela app.** Botão **＋ Novo alojamento** na página inicial e na visão geral abre `/alojamentos/novo` — um formulário com nome, localização, descrição, foto (upload opcional), morada (para as reservas) e valores por defeito (preço/noite, taxa e pagamento de limpeza). Ao criar, aparece logo na home, na visão geral e ganha página própria de P&L e de reservas.",
      "**🗄️ Alojamentos passaram a viver no Vercel Blob.** Deixaram de ser uma constante no código (`properties.ts`) e passaram para um store (`data/properties.json`), com o mesmo padrão à prova de ops-cap do P&L — uma única `list()` partilhada entre leitura e escrita, por isso cada criação custa 3 advanced ops, nunca mais. Os 3 alojamentos atuais entram como seed na primeira leitura.",
      "**🧾 Morada + tarifas migraram para dentro de cada alojamento.** O antigo `BILLING` (moradas, preço/noite, pagamento de limpeza) fundiu-se no próprio alojamento — uma edição atualiza a reserva, o form de limpeza e o /admin de uma vez. O bloco bancário e o slogan (iguais em todas as reservas) ficaram em `property-billing.ts`.",
      "**🖼️ Fotos.** Sem foto, o card e o cabeçalho usam um degradé navy; com foto, sobe para o Blob (prefixo próprio, nunca apanhado pelo GC do JSON) e o `next.config` passou a permitir o CDN do Blob no `next/image`. O slug é gerado a partir do nome (com `novo` reservado para não chocar com a página do formulário).",
    ],
  },
  {
    version: "0.12.1",
    date: "2026-06-28",
    title: "Home sem scroll — bloqueada a um ecrã",
    highlights: [
      "**🚫 Home deixou de fazer scroll.** Causa: o root da home era `min-h-screen` (100vh) **e** o footer global ficava por baixo — esses ~40px do footer eram o scroll morto que se sentia. Fix: o contentor de conteúdo do layout passou a `flex flex-col min-h-0` e a home a `flex-1 / h-full` + `overflow-hidden`, por isso preenche exactamente o ecrã (viewport menos o footer) sem gerar barra. Conteúdo passou a centrado vertical com espaçamentos mais justos (`gap`/`py` reduzidos).",
      "**↔️ Outras páginas não mexem.** Admin, alojamentos e marketing continuam a crescer e a fazer scroll normalmente — usam o seu próprio `min-h-screen`, que continua a funcionar dentro do novo contentor flex.",
    ],
  },
  {
    version: "0.12.0",
    date: "2026-06-28",
    title: "Foto Sweet Escape 2 · home com navegação de mês · canal da reserva (Airbnb/Booking/Interno) + VAT invoice",
    highlights: [
      "**📸 Nova foto do Sweet Escape 2.** Foto real da sala carregada da drive da HostPro (`public/properties/sweet-escape-2.jpg`) — aplica-se ao card na home e ao background da página do alojamento (ambos usam o mesmo `property.photo`).",
      "**🗓️ Navegação de mês na home.** Novo seletor de mês por cima dos cards (setas ‹ ›  + dropdown) que muda o mês mostrado em **todos** os cards de uma vez, sem ter de entrar em cada alojamento. Controlado por `?m=YYYY-MM`, com fallback no mês actual.",
      "**🧹 Cards da home mais limpos.** Removida a secção *2026 · YTD* (os 3 mini-KPIs em baixo) e a label *Abrir página*. Cada card mostra agora só os 4 KPIs do mês seleccionado + última actividade.",
      "**🎟️ Canal da reserva nas Entradas: Airbnb / Booking / Interno.** Novo segmented control no form, com as cores de cada plataforma (Airbnb coral `#FF5A5F`, Booking azul `#0071C2`, Interno cyan da casa). Nova coluna *Canal* na tabela com o badge colorido. Default *Interno* (directas); campo opcional para retrocompat (entradas antigas mostram um traço).",
      "**🧾 VAT invoice na drive (só Airbnb).** Quando o canal é Airbnb, aparece um box coral no form — *VAT invoice na drive* — para marcar que o reverse charge da plataforma já foi carregado na drive da contabilidade. Na tabela, as entradas Airbnb ganham um chip *VAT na drive* clicável (toggle directo, como o *Recebido* / *No banco*).",
    ],
  },
  {
    version: "0.11.0",
    date: "2026-06-28",
    title: "Valor recebido na conta · Lucro s/ IVA · Postagem de conteúdo · fim do auto-import de emails",
    highlights: [
      "**💶 Novo campo *Valor recebido na conta* nas entradas.** O *Valor* (o que o hóspede paga) mantém-se como referência, mas os **Ganhos passam a ser calculados pelo valor que realmente entra na conta** (líquido de comissões Airbnb, etc.). Nova coluna *Na conta* na tabela de Entradas e botão rápido *= ao valor* no form para quando recebido = bruto. Decisão do Andre: entradas **sem** este campo preenchido contam como **0** nos Ganhos (não somam o valor bruto) — por isso é preciso preencher cada entrada para os Ganhos voltarem a aparecer.",
      "**🏷️ Novo tile *Lucro s/ IVA* na overview mensal.** Mostra o lucro a contar **IVA = 0** (`Ganhos − Custos − Limpezas`, sem subtrair IVA), ao lado do *Lucro* normal. A linha de tiles passou de 5 para 6 colunas.",
      "**📣 Nova página *Postagem de conteúdo* (marketing HostPro).** Botão novo na home, ao lado de *Visão Geral*. É um banco de ideias de outros criadores — TikToks, vídeos, links e imagens (com upload) — guardadas para recriarmos mais tarde. Cada ideia tem tipo, nota, link opcional, imagem opcional, data e um toggle *Recriado*. Persistência em Vercel Blob (`data/marketing.json` + `marketing-uploads/`), seguindo a disciplina de ops do [[feedback-hostpro-blob-ops-budget]].",
      "**🗑️ Removido todo o auto-import de emails.** Andre prefere registar tudo à mão. Apagado: o cron `import-emails`, a integração Gmail (OAuth, parsers Airbnb, log de imports), as páginas `/admin/connect-gmail` e `/admin/email-import-log`, o card *Gmail · auto-import* no admin, o `vercel.json` (só tinha o cron) e os campos/funções órfãos (`hmCode`, `deleteEntriesByHmCodes`). O gate (`proxy.ts`) deixou de abrir excepções para `/api/gmail/callback` e `/api/cron/`.",
    ],
  },
  {
    version: "0.10.5",
    date: "2026-06-12",
    title: "Home — fim do scroll fantasma horizontal + vertical",
    highlights: [
      "**🪲 Scroll lateral e vertical sem razão na home.** Causa: a `<Image>` de fundo (`/hero-living-room.jpg`) tinha `fill + scale-110` mas o pai (`<div className=\"relative flex min-h-screen flex-col\">`) não tinha `overflow-hidden`. Com `scale-110`, a imagem renderizava 10 % maior que o seu containing block em ambos os eixos — o browser detectava conteúdo a 110 % do viewport, adicionava scrollbars. Visivel: a vista geral aparecia centrada ligeiramente fora, com o terceiro card cortado à esquerda.",
      "**✅ Fix:** imagem + gradiente movidos para dentro de um wrapper próprio `<div className=\"absolute inset-0 overflow-hidden\">` que clipa a fugida nos dois eixos. O `min-h-screen` exterior continua a deixar a página crescer conforme o conteúdo (mobile mantém scroll natural). `scale-110` mantém-se porque esconde as bordas do `blur-2xl` que seriam um halo branco no limite da imagem.",
      "**🔍 Audit cruzado:** confirmado que `unlock/page.tsx` já tinha `overflow-hidden` no wrapper desde o início (tinha o mesmo padrão sem o bug) e que o hover `group-hover:scale-105` no `property-card.tsx` está dentro de um `overflow-hidden` próprio. Só a home precisava da correcção.",
    ],
  },
  {
    version: "0.10.4",
    date: "2026-06-12",
    title: "*Funcionário* → *Limpezas* · data de pagamento + data de limpeza",
    highlights: [
      "**🧹 Secção renomeada para *Limpezas* (👷 → 🧹).** Na prática todas as entradas de funcionário são limpezas (Carol, etc.) — alinhar o label com a realidade evita ambiguidade quando aparecer outro tipo de pagamento a pessoal no futuro. Tile *Funcionários* na overview também passou a *Limpezas*. Internamente o `kind` continua `funcionario` no blob para zero migration risk.",
      "**📅 Cada linha tem agora DUAS datas: *Data pagamento* + *Data limpeza*.** A primeira é o dia em que o pagamento saiu (mantém o campo `date` existente). A segunda é nova — `cleaningDate?: string` em `FuncionarioEntry`, opcional para entradas antigas (fallback render mostra a data de pagamento). Sort da tabela passa a usar a data de limpeza (a ordem operacional, não a financeira). Form pede ambas; ambas obrigatórias em entradas novas.",
      "**🗑️ Coluna *Descrição* removida.** Era sempre `Limpeza` — ocupa espaço sem dizer nada. O campo continua a existir internamente (preenchido com `\"Limpeza\"` por defeito em criações) para não partir a `BaseEntry` shape nem o `/admin` activity row.",
      "**📦 Cache key prefix bumped (`hostpro-pnl-v1` → `v2`).** Necessário porque a shape de `FuncionarioEntry` mudou — o `unstable_cache` ignora o entry antigo e força um re-fetch limpo no primeiro request pós-deploy. Lição da memory [[feedback-workspace-cached-data-renames]] aplicada.",
      "**📝 Form copy:** *Novo pagamento a funcionário* → *Nova limpeza*; *Editar pagamento · DD/MM/YYYY* → *Editar limpeza · pagamento DD/MM/YYYY*. Empty state: *Sem limpezas registadas neste mês*.",
    ],
  },
  {
    version: "0.10.3",
    date: "2026-06-11",
    title: "Defesa em profundidade contra outro blowup do Blob ops cap",
    highlights: [
      "**⏰ Cron passou de diário a dia-sim-dia-não** (`0 6 * * *` → `0 6 */2 * *`). Reservas continuam a entrar antes do Andre abrir a app, agora a cada 48h em vez de 24h. Acordado para baixar o consumo basal do Blob de ~300 ops/mês para ~150 (cron já estava nos ~10 ops por run desde v0.10.2). Pedido directo do Andre depois do incidente de hoje.",
      "**🧠 `getAllEntries` voltou a ter cache, agora com revalidateTag.** Reverte parcialmente a decisão de v0.5.2 — a razão original era 'mutações não surfaceavam' mas isso era por falta de invalidação activa, não por falha do cache. Agora: `unstable_cache` com `tags: ['hostpro-pnl']`, revalidate de 5 min como floor de segurança, e TODAS as mutations em `pnl-actions.ts` chamam `revalidateTag('hostpro-pnl')` via novo helper `invalidatePnlCaches`. Resultado: 20 refreshes seguidos em dev colapsam a 1 op (em vez de 20). Read-your-own-write continua a funcionar porque a tag é invalidada antes do redirect.",
      "**🛡️ Confirm dialog nos botões *Correr cron agora* / *Retry todos*** em `/admin/email-import-log`. Componente novo `<ConfirmForm>` (client) embrulha o form action e abre `window.confirm()` com o custo em ops antes de disparar. Bloqueia a click-spam pattern que estoirou o cap a 11/06 (Andre andou a clicar para testar parser fixes; cada click ~80-90 ops na versão antiga, ~10 agora, ainda assim queremos travão de mão).",
      "**🧯 `hasMessageBeenLogged` removido do export público.** Era a função que fazia `list()` por mensagem — eliminada para garantir que ninguém a re-introduz no loop do cron por engano. Só `getAllLoggedMessageIds()` (lê 1×, devolve Set) é exposto. Comentário deixa explícito o motivo histórico.",
      "**📊 Orçamento mensal estimado pós-v0.10.3:** cron ~150 ops + mutations ~150 + page reads cacheados ~200 = **~500 ops/mês**. Hobby Blob cap = 2k advanced ops. Headroom de 4× — comporta dev sessions intensas (releases, backfills, testes de parser) sem voltar a estourar.",
      "**🩹 Wiring extra:** cron route também chama `revalidateTag('hostpro-pnl')` depois de `deleteEntriesByHmCodes` em LIVE mode (bypass das server actions). Helper `invalidatePnlCaches(property)` centraliza os 4 calls que estavam duplicados em 7 sítios em `pnl-actions.ts`.",
    ],
  },
  {
    version: "0.10.2",
    date: "2026-06-11",
    title: "Blob ops budget — cron dedupe in-memory + mutations partilham snapshot",
    highlights: [
      "**🚨 Razão real do crash de hoje (3.232/3.200 ops no `hostpro-data`).** O limit do Hobby plan do Vercel Blob é por OPERAÇÕES (chamadas à API — list/put/del), não por GB armazenado. Apagar dados antigos não baixa o gráfico: o pnl.json já é GC-ed a cada write (1 ficheiro só, alguns KB). O que estoirou foi o número de `list()`/`del()` (advanced ops, o bucket mais caro) durante os releases do dia 7 e 9.",
      "**🪓 Smoking gun: `hasMessageBeenLogged(ref.id)` dentro do loop do cron.** Cada email referenciado disparava `list({ prefix: 'data/gmail-import-log' })` — 40 emails × 2 label loops (confirmações + payouts) = **80 list() ops por cada run manual do cron** a partir do `/admin/email-import-log`. Trocado por um único `getAllLoggedMessageIds()` no topo do handler que carrega o log uma vez e devolve `Set<string>`; o check passa a ser `loggedMessageIds.has(ref.id)` em memória. Em modo `?retry=true` salta-se a leitura porque queremos re-processar tudo de propósito.",
      "**🤝 Mutações partilham o snapshot do `list()`.** Antes: `addEntry`/`updateEntry`/`deleteEntry`/`deleteEntriesByHmCodes` faziam `readBlob` (list+fetch) seguido de `writeBlob` (list+put+del) = **4 advanced ops por mutação**. `readBlob` agora devolve `{ entries, existing }` e `writeBlob(entries, existing?)` reutiliza o array de blobs — 1 list a menos = **3 ops por mutação** (-25%). As Server Actions são serializadas por request, portanto o snapshot não fica stale entre o read e o write.",
      "**📉 Custo estimado por run do cron** caiu de ~90 ops (1 getAllEntries + 80 hasMessageBeenLogged + 4 bulkAppend + ~5 cancellation pass) para ~10 ops. Page views da dashboard mantêm-se em 1 op cada (já era o mínimo).",
      "**🧯 O que NÃO mexi:** o read cache no servidor (`unstable_cache`) continua off como em v0.5.2 — read-your-own-write é mais valioso que poupar 1 list por pageview num app single-user.",
    ],
  },
  {
    version: "0.10.1",
    date: "2026-06-09",
    title: "*Sem IVA* default em novas entradas + backfill 24 entradas OFO",
    highlights: [
      "**☑️ Default ligado para novas entradas.** Andre confirmou que as entradas em cash dele não levam IVA, portanto o toggle *Sem IVA* passa a aparecer **ticked por defeito** em qualquer entrada nova (`useState(editing ? (editing.noIva ?? false) : true)`). Em edit, mantém o valor guardado — preserva entradas com IVA criadas por engano antes deste change.",
      "**🧹 Backfill: 24 entradas OFO marcadas `noIva=true` + `iva=0`.** Todas as entradas com `property=one-for-one-house` e `date >= 2026-01-01` foram patchadas via `scripts/backfill-ofo-sem-iva.mjs` (idempotente). Total IVA limpo: **€548,42**. Reflexo imediato no tile *IVA* (passa a 0) e no *Lucro* (passa a ser €548,42 mais alto vs. estado anterior).",
    ],
  },
  {
    version: "0.10.0",
    date: "2026-06-09",
    title: "Entradas: toggle *Sem IVA* — opta-se entrada-a-entrada",
    highlights: [
      "**🆕 Toggle *Sem IVA* no form de entrada.** Existia antes a sugestão automática de 6% de IVA, mas todas as entradas iam contabilizar IVA mesmo as que não levam (directas, receitas sem retenção, etc.). Agora há uma checkbox ao lado de *Recebido* / *Já entrou no banco* — quando ligada: input IVA fica desactivado, label muda para *IVA — desactivado*, e o servidor força `iva = 0` mesmo que algum valor chegue do form. Linha na tabela passa a mostrar badge cinzento **`SEM IVA`** em vez do valor.",
      "**📐 Campo novo `noIva?: boolean` em `EntradaEntry`.** Opcional para compatibilidade com entradas antigas. Default `false`/undefined. `addEntryAction` e `updateEntryAction` lêem `formData.get(\"noIva\") === \"on\"` e propagam para o blob; também ZERAM o iva quando true (defensa em profundidade).",
      "**🎯 Sem mudança em `pnl-math`.** Como `iva` fica forçado a `0` quando `noIva` é true, o aggregate continua naïve (`totals.iva += e.iva`) e o tile IVA + Lucro do mês deixa de ser inflado pela linha. Nada precisa migrar.",
    ],
  },
  {
    version: "0.9.9",
    date: "2026-06-08",
    title: "Cancelamento bug fix + label hostpro/airbnb-cancelled + navegação AL",
    highlights: [
      "**🐛 Bug v0.9.8 — CANCELADO ficou em 0.** A Gmail search procurava `from:noreply@airbnb.com` mas as cancellations chegam de `automated@airbnb.com`. Trocado para `from:airbnb.com` (apanha noreply E automated). Karl Touchais HM3ZABYY9D + Meike Kreisköther HMHCRZ5D8R agora vão aparecer como CANCELADO na próxima corrida.",
      "**🏷️ Label novo no Gmail: `hostpro/airbnb-cancelled`.** A pedido do Andre, o cron agora aplica este label a cada email de cancelamento processado (paralelo aos `hostpro/airbnb-conf`/`-payout` que já existem). Aparece no painel Labels do Gmail com contador, sem filtro manual ter de ser criado (o cron procura por subject, não por label).",
      "**↔️ Botões prev/next AL no header das páginas de alojamento.** No topo da página `/alojamentos/[slug]`, ao lado do `← Início`, aparecem dois chips cíclicos *‹ Sweet Escape 5* e *One For One ›* (exemplo a partir do SE2). Ordem fixa: SE2 → SE5 → OFO → SE2. Permite saltar entre ALs sem voltar à home.",
    ],
  },
  {
    version: "0.9.8",
    date: "2026-06-08",
    title: "Sistema de cancelamento Airbnb · status novo CANCELADO · delete em LIVE",
    highlights: [
      "**🚫 Cancelamentos detectados e propagados.** Cross-check contra os iCals do Talkguest revelou que Karl Touchais (HM3ZABYY9D, OFO 20-26/07) e Meike Kreisköther (HMHCRZ5D8R, SE2 27-29/11) foram cancelados — emails *\"Canceled: Reservation HM…\"* existem no Gmail mas o filtro só apanhava *\"Reservation confirmed -\"*. Agora o cron faz uma search adicional por `from:noreply@airbnb.com subject:\"Canceled: Reservation\"`, extrai o HM code do subject (regex `Canceled:\\s*Reservation\\s+(HM[A-Z0-9]{8,10})`), e propaga o cancelamento.",
      "**🗑️ LIVE: delete por hmCode.** Quando o cron corre com `IMPORT_LIVE=true`, cada cancelamento parsed dispara um `deleteEntriesByHmCodes()` no blob pnl — se já existir uma entrada com aquele hmCode (e.g. uma confirmação processada anteriormente), é REMOVIDA. Em dry-run apenas regista no log; nada é apagado. Ambas as situações: badge CANCELADO no `/admin/email-import-log`.",
      "**🧯 Filtro cruzado nas confirmações/payouts.** Mesmo que o cron processe a confirmação ANTES da cancellation no mesmo run, agora bate-se sempre o set `cancelledHmCodes` primeiro — confirmação com HM no set → CANCELADO em vez de DRY-RUN/CRIADA. Ordem garantida: Pass 0 (cancellations) → Pass 1 (confirmations) → Pass 2 (payouts).",
      "**🧹 Backfill da Karen Lodder.** A entrada `ent-002` (OFO 06/06-10/06, €709,41) tinha sido criada manualmente sem hmCode e com `stayWindow` em formato \"6/06-10/06\" (sem zero à esquerda) — nenhum dos dois dedupes do cron a apanhava. `scripts/backfill-karen-lodder.mjs` adicionou `hmCode = HMNZZJF543` e normalizou stayWindows de todas as entradas (`6/06` → `06/06`).",
      "**📊 Status novo no log:** `cancelled` aparece como **CANCELADO** (badge rosa). Grid de stats passou para `lg:grid-cols-9`. Linhas canceladas têm borda + fundo subtilmente rosa para se distinguirem dos skipped/ignored.",
    ],
  },
  {
    version: "0.9.7",
    date: "2026-06-07",
    title: "Ano explícito do Airbnb · dedupe por HM code · backfill 9 entradas",
    highlights: [
      "**📅 Bug do ano (Gilles HMYCJMN29X = 2027, não 2026).** O parser assumia o ano do email para datas sem ano (`May 25` → 25/05/2026), mas o Gilles é uma reserva para 2027. O HTML do email ESCONDE a data completa noutro bloco do body — `May 25, 2027` / `Jun 7, 2027` aparecem em metadata. O parser agora procura primeiro o padrão `[Month] [day], [YYYY]` explícito; se não existir (caso de reservas no mesmo ano), usa o fallback weekday+date com year-bump heurístico.",
      "**🆔 Campo novo `hmCode?: string` em `EntradaEntry`.** Permite ao cron Gmail fazer match de uma confirmação/payout contra uma entrada existente mesmo se o `stayWindow` mudar (e.g. hóspede estica a reserva 1 noite, como o John Elvis HMDWJYJTDY).",
      "**📦 9 entradas existentes com `hmCode` backfilled.** `scripts/backfill-hm-codes.mjs` (idempotente) mapeou as 9 entradas Airbnb dos CSVs SE2/SE5 para os seus códigos HM (HMZB5CCS8J, HMD553RPMK, HM4YAAJQRX, HMWCPXTWJQ, HMXRBYPFKT, HMDWJYJTDY, HMHAZPKMAT, HMJEBJB9KS, HMQ825SCC8). O `import-bookings-2026.mjs` também ficou actualizado para que re-runs em blob limpo já tragam o hmCode.",
      "**🧯 Cron dedupe v3 — HM code primeiro.** Antes de classificar uma entrada nova, o cron faz: (1) match por `hmCode` → SKIP; (2) match por `property + stayWindow` → SKIP; (3) caso contrário → DRY-RUN (ou CRIADA em live). O John Elvis HMDWJYJTDY agora vai aparecer como SKIPPED em vez de criar duplicado com stayWindow desactualizado.",
      "**⚠️ Pendente para LIVE:** o `amount` da entrada deve ser o **host payout** (`You earn`), não o `guestTotal`. Andre confirmou que a app só regista o valor recebido. Já extraímos `hostPayout` no parser — falta o passo final de wiring quando flipparmos `IMPORT_LIVE=true`.",
    ],
  },
  {
    version: "0.9.6",
    date: "2026-06-07",
    title: "parseEuro arranjado — valores > €1000 deixaram de ser truncados",
    highlights: [
      "**🐛 Bug crítico: €1,303.00 → 1.3.** O regex antigo do `parseEuro` era `(-?[\\d]+[.,]\\d{2}|-?\\d+)` — para `1,303.00` apanhava apenas `1,30` (1 dígito + vírgula + 2 dígitos) porque o `[\\d]+` greedy parava quando via a vírgula. Resultado: 7 das 13 confirmações DRY-RUN (todas as >€1000 — Vicky H, Greg, Gilles, Diana, Alvaro, Ian, Karl) tinham `guestTotal` divididos por ~1000.",
      "**✅ Novo `parseEuro` lida com formatos US e EU.** Apanha a sequência numérica inteira `-?\\d[\\d.,]*`, depois decide se o último separador é decimal ou de milhares com base em (a) presença simultânea de `.` e `,`, (b) contagem de cada e dígitos depois. Testado contra 16 casos: `1,303.00` → 1303, `1.303,00` → 1303, `417.67` → 417.67, `1,17` → 1.17. Airbnb usa US format (vírgula milhares, ponto decimal); regex aceita ambos sem regressão.",
    ],
  },
  {
    version: "0.9.5",
    date: "2026-06-07",
    title: "Parser payouts SE2/SE5 — roomId em parens (não em /rooms/)",
    highlights: [
      "**🐛 6 payouts continuavam UNKNOWN-LISTING.** Os emails de payout do Airbnb usam um layout completamente diferente das confirmações — não têm URL `/rooms/{id}` no body, mas trazem o roomId em **parênteses** depois do título: *\"2BR Apartment · Near Estoril Beach & Cascais (1638360824534789511)\"*. Os payouts OFO já bateram por sorte (o substring match \"3BR\" funcionou no fallback), mas SE2 e SE5 caíam no nada.",
      "**✅ Parser de payout: 2 estratégias para roomId.** Tenta primeiro `/rooms/{id}` (formato confirmação), depois `(\\d{15,20})` em parens (formato payout). E para o título: primeiro a linha antes de `(roomId)`, depois fallback ao padrão `... Apartment` antes de newline. Verificado: John Elvis €309,27 payout → roomId `1638360824534789511` → SE2 ✓.",
    ],
  },
  {
    version: "0.9.4",
    date: "2026-06-07",
    title: "Cron 10× mais rápido + parser room-id e título arranjados",
    highlights: [
      "**⚡ Cron deixava de processar a meio.** O `appendImportLog` fazia 1 read-modify-write ao blob por cada email (~2,5s/op). Com 45 emails = ~110s, mas Vercel Hobby corta funções a 60s — só 9 confirmações chegavam a registar. Agora: `bulkAppendImportLog` acumula tudo em memória + 1 write batch ao fim (1 read + 1 write por cron run). 45 emails passam em ~12s.",
      "**🚀 Paralelização Gmail fetches.** Em vez de buscar mensagens uma a uma, processa em chunks de 5 em paralelo via `Promise.all` (cap explícito para não bater no rate limit do Gmail). `maxDuration = 60` declarado no route.",
      "**🆔 Room ID agora extraído do body PLAIN.** O `htmlToText` que eu usava strippava completamente os `<a href>`, então o `rooms/{id}` desaparecia. Mas o body **plain** (apesar de tabular para datas) tem os URLs sempre intactos. Parser agora aceita 2 inputs (`body` HTML-stripped + `plainBody` opcional) e procura o `rooms/{id}` no plain.",
      "**📝 Título do listing — regex one-line.** O anterior era ganancioso e capturava texto da secção anterior (\"Canada 2BR Estoril...\"). Novo regex restringe a *uma única linha* imediatamente antes do `Entire home/apt`, evitando vazamento entre parágrafos.",
      "**🧯 Resultado esperado no próximo *Retry todos*:** ~30 confirmações + 15 payouts = ~45 messageIds processados, 3 IGNORADO (listing alheio), restantes split entre SKIPPED (dedup contra CSVs) e DRY-RUN.",
    ],
  },
  {
    version: "0.9.3",
    date: "2026-06-07",
    title: "Listing ignorado · 1 row por messageId · stats estáveis",
    highlights: [
      "**🙈 Listing `619354998862049574` (\"Apartamento perto da praia do Estoril, Cascais\") passou a IGNORADO.** Andre confirmou que não pertence à HostPro mas cai nesta inbox por settings legados. O cron agora classifica esse room id como `ignored` (em vez de unknown), aplica o label `hostpro/processado`, e regista com status novo `IGNORADO` (badge cinzento subtil, opacity 60%). Os 3 emails dessa propriedade saíram do bucket *Listing ?*.",
      "**🔁 1 row por Gmail messageId.** O motivo dos stats oscilarem entre refreshes era que cada press do *↻ Retry todos* adicionava uma NOVA row de log por email reprocessado (em cima das antigas). `appendImportLog` agora dropa qualquer row anterior do mesmo `messageId` antes de inserir a nova — o log é sempre 1 row por Gmail message, latest attempt wins. Stats deixam de bouncar.",
      "**🏷️ Listing classification refactorada.** `inferProperty()` foi substituída por `classifyListing()` que devolve `{kind: 'property' | 'ignored' | 'unknown'}`. Permite distinguir *desconhecido* (precisa de input do Andre) de *intencionalmente fora do scope*. `inferProperty()` mantém-se como compat shim.",
      "**📊 Stat tile *Ignorado*** adicionado, grid passou para `lg:grid-cols-8`.",
    ],
  },
  {
    version: "0.9.2",
    date: "2026-06-07",
    title: "Parser Airbnb v2 — HTML body, room-id mapping, dedupe by stayWindow",
    highlights: [
      "**🐛 Razão das 30 parse-failed.** O body **plain** do Airbnb é tabular (*\"Check-in &nbsp;&nbsp;&nbsp;&nbsp; Checkout\"* na mesma linha, depois *\"Wed, Apr 8 &nbsp;&nbsp;&nbsp;&nbsp; Wed, Apr 15\"* também na mesma linha) — o regex não consegue saltar de coluna. Cron agora usa o body **HTML** stripped (linearizado, uma data por linha), que é o que os 15 payouts já usavam (por isso parseavam OK).",
      "**🏠 Mapping por room ID.** Inspeccionei 30 emails reais e identifiquei 4 listings Airbnb distintos pelos IDs nos URLs `rooms/{id}`: `1638360824534789511` → **SE2** (2BR Apartment), `1637971491844755599` → **SE5** (2BR Estoril Apartment), `1653792707745872015` → **OFO** (Apartamento T3). O quarto (`619354998862049574`, *\"Apartamento perto da praia do Estoril, Cascais\"*) está em pending — Andre precisa confirmar a qual AL pertence (parece T2, €100/noite, mas pode ser uma listagem duplicada de SE2 ou um 4º AL).",
      "**🧯 Dedupe contra a base existente.** Antes de criar/logar uma entrada nova, o cron compara `property + stayWindow` contra todas as entradas já existentes no blob pnl. Se já existe → log com status `skipped` (badge SKIPPED) e label `hostpro/processado`. As importações dos CSVs (`se2-bk-001`, `ofo-55`, etc.) usam exactamente a mesma chave `stayWindow` DD/MM-DD/MM, por isso o match é exacto.",
      "**↻ Botão *Retry todos*** em `/admin/email-import-log`. Reprocessa **TODOS** os emails com label `hostpro/airbnb-*` mesmo os já marcados processado/falhou — útil depois de um deploy do parser para apanhar os antigos. Em retry mode o cron também limpa o label oposto quando o resultado muda (parse-failed → success limpa `hostpro/falhou`).",
      "**📦 Stack actualizada:** `parsers/airbnb.ts` v2 com regex baseados em estrutura *Check-in / weekday-comma / month-day / time / Checkout / ...*; `listing-map.ts` v2 com prioridade room-id-exact-match → substring rules (PT + EN); `cron/import-emails/route.ts` v2 com snapshot dos `existingByKey` no início + `?retry=true` query param.",
    ],
  },
  {
    version: "0.9.1",
    date: "2026-06-07",
    title: "Gmail cron ajustado ao Hobby (1×/dia) + botão *Correr cron agora*",
    highlights: [
      "**🐛 Build falhava silenciosamente em v0.9.0.** O motivo era a schedule `*/30 * * * *` do `vercel.json` — o plano Hobby da Vercel só permite UMA execução por dia. Cada deploy automático estava a ser rejeitado com erro *\"Hobby accounts are limited to daily cron jobs\"* mas o webhook GitHub → Vercel não trouxe esta info de volta (ficava silenciosa), por isso pareciam pushes sem efeito.",
      "**⏰ Cron passou a 06:00 UTC (07:00 PT) diária.** Reservas que entrem durante a noite são processadas antes do Andre abrir a app de manhã. Não chega para real-time. Para subir para `*/30 * * * *` há 2 caminhos: (a) upgrade Vercel Pro ~$20/mês; (b) usar um pinger externo grátis (ex: cron-job.org) a apontar para `/api/cron/import-emails` com header `Authorization: Bearer ${CRON_SECRET}` — funciona igual sem custos.",
      "**▶ Botão *Correr cron agora* em `/admin/email-import-log`.** Dispara o cron na hora via server action (mesma route, mesmo CRON_SECRET) — útil durante o dry-run para não esperar 24h entre validações. Em produção real continuas a deixar o cron schedule fazer o trabalho.",
    ],
  },
  {
    version: "0.9.0",
    date: "2026-06-07",
    title: "Gmail auto-import (Airbnb) — fase 2 deployed em dry-run mode",
    highlights: [
      "**📬 Pipeline completo de auto-import por email.** A app passou a ter integração com Gmail via OAuth2: lê emails de reserva Airbnb que chegam ao `hostpro.pt@gmail.com`, faz parse com regex defensivos, e regista cada tentativa num log auditável. Por agora corre em **dry-run** — escreve só o que ia criar, não toca no blob pnl, até validares as primeiras ~10 entradas em `/admin/email-import-log`.",
      "**🔐 Separação total HostPro vs Wonder Ads.** Toda a integração vive dentro do scope HostPro: Google Cloud project sob `hostpro.pt@gmail.com`, env vars no projecto Vercel `hostpro-workspace`, callbacks em `hostpro-workspace.vercel.app`. Nada toca em `wonder-ads.com` ou na conta WonderAds. Regra gravada em memória permanente para nunca mais misturar.",
      "**🧩 Stack:** `src/lib/gmail/oauth.ts` (OAuth helpers via fetch directo aos endpoints Google) · `src/lib/gmail/client.ts` (wrapper REST da Gmail API com decodificação base64url + MIME walker) · `src/lib/gmail/parsers/airbnb.ts` (parsers defensivos para *Reservation confirmed* + *We sent a payout* com fallback de regex; pesquisei templates online dado que não havia exemplos forward para inspeccionar) · `src/lib/gmail/listing-map.ts` (mapeia listing text → PropertySlug com substring rules para 3BR/2BR Estoril/2BR Apartment) · `src/lib/gmail/import-log.ts` (blob separado `data/gmail-import-log.json`, append + truncate a 500 entradas).",
      "**🌐 Endpoints:** `/admin/connect-gmail` (UI com tiles de estado das env vars, botão *Ligar Gmail* que arranca OAuth com state cookie anti-CSRF, e os 2 filtros Gmail prontos a copiar) · `/api/gmail/callback` (troca code por refresh_token, mostra-o numa página self-contained com botão Copiar + instruções Vercel) · `/admin/email-import-log` (vista cronológica das últimas 100 tentativas com stats agregadas e JSON expandível por linha) · `/api/cron/import-emails` (gated por `CRON_SECRET` header).",
      "**⏰ Vercel Cron** a correr a cada 30 min (`vercel.json` novo) — lista mensagens com label `hostpro/airbnb-conf` ou `hostpro/airbnb-payout` que ainda não tenham `processado` nem `falhou`, faz parse, aplica label de outcome, escreve no log.",
      "**🚪 Proxy ajustado:** `/api/gmail/callback` agora bypass do gate da password (Google redirige sem cookie), e qualquer rota sob `/api/cron/` também — cada uma valida internamente (state cookie para o callback, Bearer `CRON_SECRET` para o cron).",
    ],
  },
  {
    version: "0.8.4",
    date: "2026-06-07",
    title: "Águas Maio (cash) 26/05 — corrigido para split T2s",
    highlights: [
      "**💧 Águas Maio €60,68 (26/05) passou a estar split entre os dois T2s.** Andre confirmou que aquela linha era para ambos os T2s, não só SE2 (o default que eu apliquei por descrição não dizer *T2s* plural como em Abril). `cm-dsp-010` (€60,68 SE2) foi substituída por `cm-dsp-010a` (€30,34 SE2) + `cm-dsp-010b` (€30,34 SE5), via `scripts/fix-aguas-maio-split.mjs` (idempotente). O script de import original (`scripts/import-custos-abr-mai-2026.mjs`) também foi corrigido para que, num re-run em blob vazio, o split fique correto desde o início.",
    ],
  },
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
