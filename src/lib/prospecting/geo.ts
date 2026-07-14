import { unstable_cache } from "next/cache";

// Resolve a listing's free-text location into coordinates + concelho for the
// report globe. HostPro's market is the Cascais–Lisboa coast, so we map the
// known towns (coords + fallback concelho) and, at render time, confirm the
// concelho ONLINE via OpenStreetMap reverse-geocoding — falling back to the
// table when the network call fails.

export type GeoPoint = { lat: number; lng: number; place: string; zone: string };

// Keys are ASCII/lower-case; the haystack is normalised the same way before
// matching. Order matters — more specific towns first. `zone` = concelho.
const PLACES: Array<[string, GeoPoint]> = [
  ["monte estoril", { lat: 38.7052, lng: -9.4056, place: "Monte Estoril", zone: "Cascais" }],
  ["sao joao do estoril", { lat: 38.6952, lng: -9.3845, place: "São João do Estoril", zone: "Cascais" }],
  ["sao joao", { lat: 38.6952, lng: -9.3845, place: "São João do Estoril", zone: "Cascais" }],
  ["sao domingos de rana", { lat: 38.7050, lng: -9.3350, place: "São Domingos de Rana", zone: "Cascais" }],
  ["domingos de rana", { lat: 38.7050, lng: -9.3350, place: "São Domingos de Rana", zone: "Cascais" }],
  ["estoril", { lat: 38.7057, lng: -9.3977, place: "Estoril", zone: "Cascais" }],
  ["quinta da marinha", { lat: 38.7096, lng: -9.4586, place: "Quinta da Marinha", zone: "Cascais" }],
  ["guincho", { lat: 38.7320, lng: -9.4720, place: "Guincho", zone: "Cascais" }],
  ["birre", { lat: 38.7200, lng: -9.4430, place: "Birre", zone: "Cascais" }],
  ["alcabideche", { lat: 38.7290, lng: -9.4090, place: "Alcabideche", zone: "Cascais" }],
  ["tires", { lat: 38.7250, lng: -9.3670, place: "Tires", zone: "Cascais" }],
  ["cascais", { lat: 38.6979, lng: -9.4215, place: "Cascais", zone: "Cascais" }],
  ["carcavelos", { lat: 38.6800, lng: -9.3370, place: "Carcavelos", zone: "Cascais" }],
  ["parede", { lat: 38.6890, lng: -9.3540, place: "Parede", zone: "Cascais" }],
  ["oeiras", { lat: 38.6910, lng: -9.3090, place: "Oeiras", zone: "Oeiras" }],
  ["sintra", { lat: 38.8029, lng: -9.3817, place: "Sintra", zone: "Sintra" }],
  ["lisboa", { lat: 38.7223, lng: -9.1393, place: "Lisboa", zone: "Lisboa" }],
  ["lisbon", { lat: 38.7223, lng: -9.1393, place: "Lisboa", zone: "Lisboa" }],
];

const DEFAULT: GeoPoint = { lat: 38.702, lng: -9.402, place: "Costa do Estoril", zone: "Cascais" };

function normalise(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Best-effort coordinates + concelho for the property, from its text. */
export function resolveGeo(location?: string, name?: string): GeoPoint {
  const hay = normalise(`${location ?? ""} ${name ?? ""}`);
  for (const [key, point] of PLACES) {
    if (hay.includes(key)) return point;
  }
  return DEFAULT;
}

// ---- Online concelho lookup (OpenStreetMap Nominatim) ----
// For Portugal at zoom 10 the concelho is the `town`/`municipality` field and
// the district is `county`. Cached per-coordinate for 30 days so we never
// hammer the service (Nominatim policy: low volume + a real User-Agent).

async function fetchZone(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&zoom=10&accept-language=pt`;
    const res = await fetch(url, {
      headers: { "User-Agent": "HostPro-Workspace/1.0 (+https://hostpro.pt)" },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { address?: Record<string, string> };
    const a = j.address ?? {};
    return a.municipality || a.town || a.city || a.city_district || a.county || null;
  } catch {
    return null;
  }
}

/** Concelho for the coordinates — online, cached, with a table fallback. */
export const getZone = unstable_cache(
  async (lat: number, lng: number, fallback: string): Promise<string> => {
    return (await fetchZone(lat, lng)) ?? fallback;
  },
  ["hostpro-zone-v1"],
  { revalidate: 60 * 60 * 24 * 30 },
);
