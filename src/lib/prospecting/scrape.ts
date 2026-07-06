import "server-only";
import type { ListingData, Platform } from "./types";

// Scraping de listings.
//
// Airbnb serve HTML SSR: um bloco JSON-LD (VacationRental) estável com
// título/descrição/fotos + um `<script id="data-deferred-state-0">` com o
// estado completo (amenidades, captions, rating). Fazemos harvest por FORMA
// (recursivo, à procura de {title, available} e "caption") em vez de caminhos
// exactos — muito mais resistente a mudanças internas do Airbnb.
//
// Booking devolve um interstitial anti-bot (HTTP 202, sem dados) a um fetch
// simples — não dá para scrape server-side fiável, por isso cai em `needsPaste`.

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export function detectPlatform(url: string): Platform {
  const u = url.toLowerCase();
  if (u.includes("airbnb.")) return "airbnb";
  if (u.includes("booking.com")) return "booking";
  return "outro";
}

export async function scrapeListing(url: string): Promise<ListingData> {
  const platform = detectPlatform(url);
  const base: ListingData = {
    platform,
    url,
    source: "scrape",
    amenities: [],
    photos: [],
    photoCaptions: [],
  };

  if (platform === "airbnb") {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
        cache: "no-store",
      });
      if (!res.ok) {
        return { ...base, needsPaste: true, note: `Airbnb respondeu ${res.status}. Cola os dados à mão.` };
      }
      const html = await res.text();
      return parseAirbnbHtml(html, url);
    } catch (err) {
      return {
        ...base,
        needsPaste: true,
        note: err instanceof Error ? `Falha ao ler o Airbnb: ${err.message}` : "Falha ao ler o Airbnb.",
      };
    }
  }

  // Booking e outros: sem scrape fiável — pedir para colar.
  return {
    ...base,
    needsPaste: true,
    note:
      platform === "booking"
        ? "O Booking bloqueia leitura automática. Cola o título, a descrição e as comodidades à mão."
        : "Plataforma não suportada para leitura automática. Cola os dados à mão.",
  };
}

// ---------- parsing puro (testável sem rede) ----------

/** Extrai o primeiro JSON-LD com @type VacationRental/Product/Place. */
function extractJsonLd(html: string): Record<string, unknown> | null {
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const data = JSON.parse(m[1].trim());
      const arr = Array.isArray(data) ? data : [data];
      for (const d of arr) {
        if (d && typeof d === "object") return d as Record<string, unknown>;
      }
    } catch {
      // ignora blocos malformados
    }
  }
  return null;
}

function extractMeta(html: string, property: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`,
    "i",
  );
  const m = html.match(re);
  return m ? decodeEntities(m[1]) : undefined;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

type Harvest = {
  amenities: string[];
  captions: string[];
  photos: string[];
  rating?: number;
  reviews?: number;
};

/** Percorre recursivamente o estado do Airbnb à procura de formas conhecidas. */
function harvestDeferredState(html: string): Harvest {
  const out: Harvest = { amenities: [], captions: [], photos: [] };
  const m = html.match(/id="data-deferred-state-0"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return out;

  // Contagem real de fotos: o JSON-LD só lista um subconjunto (~8), mas o
  // estado traz todas — apanhamos os URLs muscache directamente do texto.
  const photoUrls = new Set<string>();
  const picRe =
    /https:\/\/a0\.muscache\.com\/im\/pictures\/[A-Za-z0-9\-_/]+\.(?:jpg|jpeg|png|webp)/g;
  let p: RegExpExecArray | null;
  while ((p = picRe.exec(m[1]))) photoUrls.add(p[0].split("?")[0]);
  out.photos = [...photoUrls];

  let root: unknown;
  try {
    root = JSON.parse(m[1]);
  } catch {
    return out;
  }
  const amen = new Set<string>();
  const caps = new Set<string>();
  const seen = new WeakSet<object>();
  const walk = (o: unknown) => {
    if (!o || typeof o !== "object") return;
    if (seen.has(o as object)) return;
    seen.add(o as object);
    if (Array.isArray(o)) {
      for (const v of o) walk(v);
      return;
    }
    const rec = o as Record<string, unknown>;
    // amenidade: { title, available: boolean }
    if (typeof rec.title === "string" && typeof rec.available === "boolean") {
      if (rec.available) amen.add(rec.title.trim());
    }
    if (typeof rec.caption === "string" && rec.caption.trim()) {
      caps.add(rec.caption.trim());
    }
    if (out.rating === undefined && typeof rec.starRating === "number") {
      out.rating = rec.starRating;
    }
    if (out.reviews === undefined && typeof rec.reviewsCount === "number") {
      out.reviews = rec.reviewsCount;
    }
    for (const v of Object.values(rec)) walk(v);
  };
  walk(root);
  out.amenities = [...amen];
  out.captions = [...caps];
  return out;
}

export function parseAirbnbHtml(html: string, url: string): ListingData {
  const ld = extractJsonLd(html);
  const harvest = harvestDeferredState(html);

  const ldName = typeof ld?.name === "string" ? ld.name : undefined;
  const ldDesc = typeof ld?.description === "string" ? ld.description : undefined;
  const ldImages = Array.isArray(ld?.image)
    ? (ld!.image as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  // Preferir a lista completa do estado; cair no subconjunto do JSON-LD.
  const photos = harvest.photos.length >= ldImages.length ? harvest.photos : ldImages;

  const ogTitle = extractMeta(html, "og:title");
  const ogDesc = extractMeta(html, "og:description");
  const titleTag = html.match(/<title>([^<]*)<\/title>/i)?.[1];

  const title = ldName ?? (titleTag ? decodeEntities(titleTag).split(" - ")[0] : undefined);
  const description = ldDesc ?? ogDesc;

  // rating/reviews: tenta do harvest, senão do og:title ("★4.89")
  let rating = harvest.rating;
  if (rating === undefined && ogTitle) {
    const r = ogTitle.match(/★\s*([\d.,]+)/);
    if (r) rating = Number(r[1].replace(",", "."));
  }

  const data: ListingData = {
    platform: "airbnb",
    url,
    source: "scrape",
    title,
    summary: ogTitle,
    description,
    amenities: harvest.amenities,
    photos,
    photoCaptions: harvest.captions,
    photoCount: photos.length || undefined,
    rating,
    reviewsCount: harvest.reviews,
  };

  // Se nem título nem descrição saíram, o scrape degradou — pedir colar.
  if (!data.title && !data.description) {
    data.needsPaste = true;
    data.note = "Não consegui ler o conteúdo deste listing automaticamente. Cola os dados à mão.";
  }
  return data;
}
