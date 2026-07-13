// Resolve a listing's free-text location into coordinates for the report
// globe marker. HostPro's whole market is the Cascais–Lisboa coast, so we map
// the known towns and fall back to the Costa do Estoril centroid — no external
// geocoding call needed (keeps the report fast and offline-safe).

export type GeoPoint = { lat: number; lng: number; place: string };

// Keys are ASCII/lower-case; the haystack is normalised the same way before
// matching. Order matters — more specific towns first.
const PLACES: Array<[string, GeoPoint]> = [
  ["monte estoril", { lat: 38.7052, lng: -9.4056, place: "Monte Estoril" }],
  ["sao joao do estoril", { lat: 38.6952, lng: -9.3845, place: "São João do Estoril" }],
  ["sao joao", { lat: 38.6952, lng: -9.3845, place: "São João do Estoril" }],
  ["sao domingos de rana", { lat: 38.7050, lng: -9.3350, place: "São Domingos de Rana" }],
  ["domingos de rana", { lat: 38.7050, lng: -9.3350, place: "São Domingos de Rana" }],
  ["estoril", { lat: 38.7057, lng: -9.3977, place: "Estoril" }],
  ["quinta da marinha", { lat: 38.7096, lng: -9.4586, place: "Quinta da Marinha" }],
  ["guincho", { lat: 38.7320, lng: -9.4720, place: "Guincho" }],
  ["birre", { lat: 38.7200, lng: -9.4430, place: "Birre" }],
  ["alcabideche", { lat: 38.7290, lng: -9.4090, place: "Alcabideche" }],
  ["tires", { lat: 38.7250, lng: -9.3670, place: "Tires" }],
  ["cascais", { lat: 38.6979, lng: -9.4215, place: "Cascais" }],
  ["carcavelos", { lat: 38.6800, lng: -9.3370, place: "Carcavelos" }],
  ["parede", { lat: 38.6890, lng: -9.3540, place: "Parede" }],
  ["oeiras", { lat: 38.6910, lng: -9.3090, place: "Oeiras" }],
  ["sintra", { lat: 38.8029, lng: -9.3817, place: "Sintra" }],
  ["lisboa", { lat: 38.7223, lng: -9.1393, place: "Lisboa" }],
  ["lisbon", { lat: 38.7223, lng: -9.1393, place: "Lisboa" }],
];

const DEFAULT: GeoPoint = { lat: 38.702, lng: -9.402, place: "Costa do Estoril" };

function normalise(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Best-effort coordinates for the property, from its location/name text. */
export function resolveGeo(location?: string, name?: string): GeoPoint {
  const hay = normalise(`${location ?? ""} ${name ?? ""}`);
  for (const [key, point] of PLACES) {
    if (hay.includes(key)) return point;
  }
  return DEFAULT;
}
