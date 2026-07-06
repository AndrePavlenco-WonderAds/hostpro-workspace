// Prospecting = auditar o listing (Airbnb/Booking) de um potencial cliente
// contra o checklist de otimização da HostPro e gerar um relatório apresentável.

export type Platform = "airbnb" | "booking" | "outro";

/** Dados normalizados extraídos de um listing (o que se consegue ler do
 *  exterior). Campos podem faltar consoante a plataforma e o que veio no HTML. */
export type ListingData = {
  platform: Platform;
  url: string;
  /** Como os dados chegaram: scrape automático ou colados à mão (fallback). */
  source: "scrape" | "paste";
  title?: string;
  /** Resumo do og:title do Airbnb (ex: "Studio · 1 bed · 1 bath · ★4.89"). */
  summary?: string;
  description?: string;
  amenities: string[];           // nomes de amenidades disponíveis
  photos: string[];              // URLs das fotos
  photoCaptions: string[];       // legendas das fotos (quando existem)
  photoCount?: number;
  rating?: number;
  reviewsCount?: number;
  location?: string;
  /** True quando não foi possível ler automaticamente (ex: Booking bloqueou). */
  needsPaste?: boolean;
  /** Mensagem de diagnóstico quando o scrape falha/degrada. */
  note?: string;
};

/** Estado de cada item do checklist na auditoria. */
export type ItemStatus = "pass" | "fail" | "manual" | "na";

/** Como o estado foi determinado. */
export type ItemMode = "auto" | "manual";

export type AuditItem = {
  id: string;                    // estável, ex: "title.under50"
  label: string;
  /** Se o item é avaliado automaticamente a partir do ListingData ou fica
   *  para o operador confirmar (fotos, PriceLabs, operações…). */
  mode: ItemMode;
  status: ItemStatus;
  /** Evidência curta do porquê (auto) — ex: "Título tem 61 caracteres". */
  evidence?: string;
  /** Recomendação concreta mostrada ao cliente quando o item falha. */
  recommendation?: string;
};

export type AuditCategory = {
  id: string;
  label: string;
  items: AuditItem[];
};

export type AuditResult = {
  categories: AuditCategory[];
  score: number;                 // 0–100, só sobre itens avaliados (pass/fail)
  passCount: number;
  failCount: number;
  manualCount: number;
};

export type Prospect = {
  id: string;                    // interno
  publicToken: string;           // usado no link público do relatório
  createdAt: string;             // ISO YYYY-MM-DD
  /** Nome do potencial cliente / alojamento (editável pelo operador). */
  name: string;
  url: string;
  platform: Platform;
  /** Notas manuais do operador — "detalhes que não estão bons". */
  operatorNotes: string;
  listing: ListingData;
  audit: AuditResult;
  /** Overrides manuais item-a-item: id → status escolhido pelo operador.
   *  Aplicados por cima do resultado auto ao renderizar. */
  overrides: Record<string, ItemStatus>;
};
