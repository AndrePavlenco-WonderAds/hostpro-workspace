import type {
  ListingData,
  AuditItem,
  AuditCategory,
  AuditResult,
  ItemStatus,
} from "./types";

// Motor de auditoria — mapeia o ListingData para o checklist de otimização
// da HostPro (o "Master File - Descrições Listings").
//
// Itens `auto` são avaliados a partir do que se lê do exterior (título,
// descrição, amenidades, fotos). Itens `manual` precisam de olho humano
// (qualidade de fotos, PriceLabs, automação, operações) — nascem em "manual"
// e o operador confirma no workspace.

// ---------- helpers de texto ----------

function norm(s: string | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** True se o texto contém algum dos termos (já normalizados sem acentos). */
function hasAny(text: string, terms: string[]): boolean {
  return terms.some((t) => text.includes(t));
}

function amenityHas(amenities: string[], terms: string[]): boolean {
  const joined = norm(amenities.join(" | "));
  return hasAny(joined, terms);
}

type Check = {
  id: string;
  label: string;
  /** undefined => item manual. */
  auto?: (ctx: Ctx) => { pass: boolean; evidence?: string };
  recommendation?: string;
};

type Ctx = {
  l: ListingData;
  title: string;   // normalizado
  desc: string;    // normalizado
  text: string;    // title + desc normalizado
  rawTitle: string;
};

// ---------- definição do checklist ----------

const CATEGORIES: { id: string; label: string; items: Check[] }[] = [
  {
    id: "titulo",
    label: "Título & Descrição",
    items: [
      {
        id: "titulo.tipologia_local",
        label: "Título com tipologia + localização + benefício",
        auto: ({ rawTitle, title }) => {
          const hasType = /studio|t[0-3]\b|\d\s*(bed|bedroom|quarto)|loft/i.test(rawTitle);
          const hasLoc = hasAny(title, [
            "estoril", "cascais", "monte", "sao joao", "lisboa", "beach", "praia", "mar", "sea",
          ]);
          return {
            pass: hasType && hasLoc,
            evidence: `${hasType ? "tem tipologia" : "sem tipologia"}, ${hasLoc ? "tem localização" : "sem localização"}`,
          };
        },
        recommendation: "Inclua tipologia (T1/T2/Studio), a zona e o benefício-chave logo no título.",
      },
      {
        id: "titulo.keywords",
        label: "Keywords de alta conversão (praia / a pé / tranquilo / espaçoso)",
        auto: ({ text }) => {
          const hits = [
            ["praia/beach", ["beach", "praia", "mar", "sea"]],
            ["a pé/walk", ["walk", "a pe", "minutos", "min "]],
            ["tranquilo/quiet", ["quiet", "tranquil", "calm", "sossego"]],
            ["espaçoso/spacious", ["spacious", "espacos", "amplo", "bright", "luminos"]],
          ].filter(([, terms]) => hasAny(text, terms as string[]));
          return {
            pass: hits.length >= 2,
            evidence: `${hits.length}/4 grupos de keywords presentes`,
          };
        },
        recommendation: "Use palavras que convertem: praia, a pé, tranquilo, espaçoso, luminoso.",
      },
      {
        id: "titulo.under50",
        label: "Título com menos de 50 caracteres (otimizado para mobile)",
        auto: ({ rawTitle }) => ({
          pass: rawTitle.length > 0 && rawTitle.length <= 50,
          evidence: `${rawTitle.length} caracteres`,
        }),
        recommendation: "Encurte o título para ≤ 50 caracteres — no telemóvel corta o resto.",
      },
      {
        id: "titulo.hook",
        label: "Primeiras 2 linhas com gancho forte",
        auto: ({ l }) => {
          const first = norm((l.description ?? "").split("\n").filter(Boolean).slice(0, 2).join(" "));
          const strong = hasAny(first, [
            "beach", "praia", "view", "vista", "walk", "a pe", "minut", "stunning", "bright", "luminos", "central",
          ]);
          return { pass: first.length > 40 && strong, evidence: strong ? "gancho presente" : "gancho fraco/ausente" };
        },
        recommendation: "As 2 primeiras linhas têm de vender o benefício (vista, praia a pé, luz) — é o que aparece antes do 'ler mais'.",
      },
      {
        id: "titulo.seccoes",
        label: "Descrição estruturada (Localização / Espaço / Acessos / Praias)",
        auto: ({ desc }) => {
          const themes = [
            ["localizacao", ["locat", "localiz", "zona", "neighbourhood", "area"]],
            ["espaco", ["space", "espaco", "bedroom", "quarto", "kitchen", "cozinha", "living"]],
            ["acessos", ["access", "acess", "train", "comboio", "metro", "airport", "aeroporto"]],
            ["praias", ["beach", "praia"]],
          ].filter(([, t]) => hasAny(desc, t as string[]));
          return { pass: themes.length >= 3, evidence: `${themes.length}/4 secções temáticas` };
        },
        recommendation: "Organize a descrição em secções: Localização, Espaço, Acessos e Praias.",
      },
      {
        id: "titulo.distancias",
        label: "Menciona distâncias a pé (comboio, praia, supermercado)",
        auto: ({ text }) => {
          const pass = /(\d+)\s*(min|minut|m\b|metr|km)/i.test(text) || hasAny(text, ["a pe", "walk", "stroll"]);
          return { pass, evidence: pass ? "distâncias mencionadas" : "sem distâncias" };
        },
        recommendation: "Diga as distâncias a pé: '500m do comboio', '5 min da praia', 'supermercado ao lado'.",
      },
      {
        id: "titulo.groundfloor_selfcheckin",
        label: 'Menciona "rés-do-chão / andar" + "self check-in"',
        auto: ({ text }) => {
          const floor = hasAny(text, ["ground floor", "res do chao", "r/c", "rez", "floor", "andar"]);
          const checkin = hasAny(text, ["self check", "check-in autonomo", "check in autonomo", "self-check", "autonom"]);
          return { pass: floor && checkin, evidence: `${floor ? "andar ✓" : "andar ✗"}, ${checkin ? "self check-in ✓" : "self check-in ✗"}` };
        },
        recommendation: "Refira o piso e que o check-in é autónomo (self check-in) — remove fricção e dúvidas.",
      },
    ],
  },
  {
    id: "fotos",
    label: "Fotos",
    items: [
      {
        id: "fotos.quantidade",
        label: "Pelo menos 20 fotos",
        auto: ({ l }) => {
          const n = l.photoCount ?? l.photos.length;
          return { pass: n >= 20, evidence: `${n} fotos detetadas` };
        },
        recommendation: "Suba para 20+ fotos — mais fotos = mais confiança e conversão.",
      },
      { id: "fotos.living", label: "Foto #1 sala de estar (luminosa, com profundidade)", recommendation: "A primeira foto deve ser a sala, luminosa e com profundidade." },
      { id: "fotos.quarto", label: "Foto #2 melhor quarto", recommendation: "Destaque o melhor quarto como segunda foto." },
      { id: "fotos.varanda", label: "Foto #3 varanda / exterior", recommendation: "Mostre varanda/exterior/vista cedo na galeria." },
      { id: "fotos.jantar", label: "Foto #4 zona de refeições", recommendation: "Inclua a zona de refeições montada." },
      { id: "fotos.cozinha", label: "Foto #5 cozinha", recommendation: "Cozinha bem iluminada e arrumada." },
    ],
  },
  {
    id: "qualidade",
    label: "Qualidade das fotos",
    items: [
      { id: "qual.luz", label: "Todas as fotos com luz natural", recommendation: "Fotografe de dia, com luz natural; evite fotos escuras." },
      { id: "qual.estilo", label: "Estilo consistente (mesma edição)", recommendation: "Mantenha o mesmo tom de edição em todas as fotos." },
      { id: "qual.camas", label: "Camas montadas estilo hotel", recommendation: "Camas feitas estilo hotel — sinal de qualidade." },
      { id: "qual.toalhas", label: "Toalhas colocadas (sinal de confiança)", recommendation: "Toalhas dobradas na cama/casa de banho transmitem cuidado." },
    ],
  },
  {
    id: "cobertura",
    label: "Cobertura",
    items: [
      { id: "cob.todos", label: "Todos os quartos fotografados", recommendation: "Fotografe todas as divisões — nada por mostrar." },
      { id: "cob.closeup", label: "Close-ups (café, decoração, workspace)", recommendation: "Close-ups de detalhes (café, decoração, secretária) criam desejo." },
      { id: "cob.exterior", label: "Exterior / rua / entrada do edifício", recommendation: "Mostre a entrada e a rua — ajuda a localizar e dá segurança." },
    ],
  },
  {
    id: "editor",
    label: "Configuração do listing",
    items: [
      { id: "ed.direcoes", label: "Direções adicionadas", recommendation: "Adicione direções detalhadas no editor da plataforma." },
      { id: "ed.checkin", label: "Método de check-in definido", recommendation: "Defina claramente o método de check-in." },
      { id: "ed.wifi", label: "Nome e password do WiFi na plataforma", recommendation: "Guarde WiFi na plataforma para envio automático." },
      { id: "ed.manual", label: "Manual da casa", recommendation: "Crie um manual da casa (eletrodomésticos, regras, dicas)." },
      { id: "ed.regras", label: "Regras da casa adicionadas", recommendation: "Defina regras da casa claras." },
      { id: "ed.checkout", label: "Instruções de check-out", recommendation: "Instruções de check-out simples e explícitas." },
    ],
  },
  {
    id: "amenidades",
    label: "Amenidades",
    items: [
      {
        id: "am.wifi",
        label: "WiFi rápido (com velocidade mencionada)",
        auto: ({ l, text }) => {
          const has = amenityHas(l.amenities, ["wifi", "wi-fi", "internet"]);
          const speed = /\d+\s*(mb|mbps|mega)/i.test(text);
          return { pass: has, evidence: has ? (speed ? "WiFi + velocidade" : "WiFi (sem velocidade no texto)") : "sem WiFi listado" };
        },
        recommendation: "Confirme WiFi e mencione a velocidade (ex: 'Fibra 500 Mbps') — importa a quem trabalha remoto.",
      },
      {
        id: "am.cozinha",
        label: "Cozinha totalmente equipada",
        auto: ({ l }) => {
          const has = amenityHas(l.amenities, ["kitchen", "cozinha"]) &&
            amenityHas(l.amenities, ["cooking", "dishes", "silverware", "loica", "fogao", "microwave", "micro-ondas", "freezer", "oven", "forno", "refriger", "frigor"]);
          return { pass: has, evidence: has ? "cozinha equipada" : "cozinha incompleta/ausente" };
        },
        recommendation: "Liste a cozinha como totalmente equipada (loiça, fogão, micro-ondas, máquina de café).",
      },
      {
        id: "am.washer",
        label: "Máquina de lavar",
        auto: ({ l }) => {
          const has = amenityHas(l.amenities, ["washer", "washing machine", "maquina de lavar", "lavar roupa"]);
          return { pass: has, evidence: has ? "tem máquina de lavar" : "sem máquina de lavar" };
        },
        recommendation: "Adicione máquina de lavar — decisivo para estadias mais longas e famílias.",
      },
      {
        id: "am.aquecimento",
        label: "Aquecimento",
        auto: ({ l }) => {
          const has = amenityHas(l.amenities, ["heating", "heater", "aquecimento", "aquecedor", "fireplace", "lareira", "radiator", "climatiz", "air conditioning", "ar condicionado", "ac unit"]);
          return { pass: has, evidence: has ? "tem aquecimento/climatização" : "sem aquecimento listado" };
        },
        recommendation: "Garanta aquecimento listado — no inverno é filtro de reserva.",
      },
    ],
  },
  {
    id: "extras",
    label: "Extras de alta conversão",
    items: [
      {
        id: "ex.cafe",
        label: "Máquina de café",
        auto: ({ l, text }) => {
          const has = amenityHas(l.amenities, ["coffee", "cafe", "nespresso", "espresso"]) || hasAny(text, ["nespresso", "maquina de cafe", "coffee machine"]);
          return { pass: has, evidence: has ? "café mencionado" : "sem máquina de café" };
        },
        recommendation: "Máquina de café (idealmente Nespresso) — extra barato de alta conversão.",
      },
      {
        id: "ex.tv",
        label: "Netflix / Smart TV",
        auto: ({ l, text }) => {
          const has = amenityHas(l.amenities, ["tv", "netflix", "hdtv", "smart tv"]) || hasAny(text, ["netflix", "smart tv"]);
          return { pass: has, evidence: has ? "TV/streaming mencionado" : "sem Smart TV/Netflix" };
        },
        recommendation: "Smart TV com Netflix — esperado pelos hóspedes e fácil de garantir.",
      },
      {
        id: "ex.praia",
        label: "Essenciais de praia (toalhas, chapéu)",
        auto: ({ l, text }) => {
          const has = hasAny(norm(l.amenities.join(" ")) + " " + text, ["beach towel", "beach essential", "umbrella", "chapeu de praia", "toalhas de praia", "beach gear"]);
          return { pass: has, evidence: has ? "essenciais de praia mencionados" : "sem essenciais de praia" };
        },
        recommendation: "Ofereça toalhas e chapéu de praia — perfeito para o posicionamento à beira-mar.",
      },
      {
        id: "ex.berco",
        label: "Berço",
        auto: ({ l }) => {
          const has = amenityHas(l.amenities, ["crib", "travel crib", "pack n play", "pack 'n play", "berco", "cot"]);
          return { pass: has, evidence: has ? "tem berço" : "sem berço" };
        },
        recommendation: "Berço disponível abre o mercado de famílias com bebés.",
      },
    ],
  },
  {
    id: "automacao",
    label: "Automação (TalkGuest)",
    items: [
      { id: "au.confirm", label: "Mensagem de confirmação de reserva", recommendation: "Automatize a confirmação imediata da reserva." },
      { id: "au.precheckin", label: "Mensagem pré-check-in (1–2 dias antes)", recommendation: "Envie instruções 1–2 dias antes da chegada." },
      { id: "au.checkin", label: "Instruções de check-in automatizadas", recommendation: "Automatize o envio das instruções de check-in." },
      { id: "au.midstay", label: "Mensagem a meio da estadia", recommendation: "Mensagem a meio da estadia — apanha problemas antes da review." },
      { id: "au.checkout", label: "Instruções de check-out", recommendation: "Automatize as instruções de check-out." },
      { id: "au.review", label: "Pedido de review", recommendation: "Peça review automaticamente no fim da estadia." },
    ],
  },
  {
    id: "pricelabs",
    label: "Preços & PriceLabs",
    items: [
      { id: "pl.base", label: "Preço-base definido corretamente", recommendation: "Defina o preço-base com base no mercado local." },
      { id: "pl.floor", label: "Preço mínimo (floor) definido", recommendation: "Defina um preço mínimo para nunca vender abaixo do custo." },
      { id: "pl.weekend", label: "Fim-de-semana mais caro que dias de semana", recommendation: "Suba o preço de sexta/sábado face aos dias de semana." },
      { id: "pl.sazonal", label: "Ajustes sazonais aplicados", recommendation: "Aplique variação sazonal (verão vs inverno)." },
      { id: "pl.eventos", label: "Preços por eventos locais ativos", recommendation: "Ative subida de preço em eventos locais (F1, festivais)." },
      { id: "pl.oneday", label: "One-day booking com preço extra", recommendation: "Cobre extra por reservas de 1 noite isolada." },
      { id: "pl.lastminute", label: "Descontos last-minute ativos", recommendation: "Ative descontos last-minute para encher lacunas." },
      { id: "pl.farout", label: "Prémio para reservas muito antecipadas", recommendation: "Cobre prémio em datas muito distantes." },
      { id: "pl.minstay", label: "Estadia mínima dinâmica", recommendation: "Regras de estadia mínima dinâmicas por época/procura." },
    ],
  },
  {
    id: "operacoes",
    label: "Operações",
    items: [
      { id: "op.checklist", label: "Checklist de limpeza padronizado", recommendation: "Padronize a checklist de limpeza." },
      { id: "op.qualidade", label: "Qualidade consistente", recommendation: "Garanta qualidade consistente entre estadias." },
      { id: "op.manutencao", label: "Registo de manutenção", recommendation: "Registe problemas de manutenção." },
      { id: "op.backup", label: "Stock de reposição disponível", recommendation: "Tenha stock de reposição (amenities, roupa de cama)." },
    ],
  },
  {
    id: "bonus",
    label: "Bónus (alto impacto)",
    items: [
      { id: "bo.welcome", label: "Guia de boas-vindas (PDF)", recommendation: "Crie um guia de boas-vindas em PDF." },
      { id: "bo.recomendacoes", label: "Recomendações locais adicionadas", recommendation: "Adicione recomendações locais (restaurantes, praias)." },
      { id: "bo.selfcheckin", label: "Instruções de self check-in cristalinas", recommendation: "Instruções de check-in autónomo muito claras." },
      { id: "bo.emergencia", label: "Contactos de emergência fornecidos", recommendation: "Forneça contactos de emergência." },
    ],
  },
];

// ---------- execução ----------

export function runAudit(l: ListingData): AuditResult {
  const ctx: Ctx = {
    l,
    title: norm(l.title),
    desc: norm(l.description),
    text: norm(`${l.title ?? ""} ${l.description ?? ""}`),
    rawTitle: (l.title ?? "").trim(),
  };
  // Sem conteúdo de texto legível, os itens `auto` de texto não são fiáveis —
  // caem para manual para o operador não ver "falha" a partir de dados vazios.
  const textUsable = ctx.text.trim().length > 10;

  const categories: AuditCategory[] = CATEGORIES.map((cat) => ({
    id: cat.id,
    label: cat.label,
    items: cat.items.map((c): AuditItem => {
      if (c.auto && (textUsable || cat.id === "fotos")) {
        const r = c.auto(ctx);
        return {
          id: c.id,
          label: c.label,
          mode: "auto",
          status: r.pass ? "pass" : "fail",
          evidence: r.evidence,
          recommendation: c.recommendation,
        };
      }
      return {
        id: c.id,
        label: c.label,
        mode: "manual",
        status: "manual",
        recommendation: c.recommendation,
      };
    }),
  }));

  return withScore(categories);
}

/** Aplica os overrides do operador e recalcula a pontuação. */
export function applyOverrides(
  base: AuditResult,
  overrides: Record<string, ItemStatus>,
): AuditResult {
  const categories = base.categories.map((cat) => ({
    ...cat,
    items: cat.items.map((it) =>
      overrides[it.id] ? { ...it, status: overrides[it.id], mode: "manual" as const } : it,
    ),
  }));
  return withScore(categories);
}

function withScore(categories: AuditCategory[]): AuditResult {
  let pass = 0;
  let fail = 0;
  let manual = 0;
  for (const cat of categories) {
    for (const it of cat.items) {
      if (it.status === "pass") pass++;
      else if (it.status === "fail") fail++;
      else if (it.status === "manual") manual++;
    }
  }
  const evaluated = pass + fail;
  const score = evaluated === 0 ? 0 : Math.round((pass / evaluated) * 100);
  return { categories, score, passCount: pass, failCount: fail, manualCount: manual };
}
