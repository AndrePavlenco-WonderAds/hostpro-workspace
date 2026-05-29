// The accommodations HostPro currently manages.
// Order here is left-to-right on /alojamentos.

export type PropertySlug =
  | "sweet-escape-2"
  | "sweet-escape-5"
  | "one-for-one-house";

export type Property = {
  slug: PropertySlug;
  name: string;
  location: string;          // e.g. "São João do Estoril"
  description: string;       // short marketing line
  photo: string;             // path under /public
  /** Short label shown on cards / nav. */
  shortName: string;
};

export const PROPERTIES: Property[] = [
  {
    slug: "sweet-escape-2",
    shortName: "Sweet Escape 2",
    name: "Sweet Escape · 2º",
    location: "São João do Estoril",
    description:
      "T2 reabilitado no segundo andar, perfeito para famílias em escapadinhas curtas.",
    photo: "/properties/sweet-escape-2.jpg",
  },
  {
    slug: "sweet-escape-5",
    shortName: "Sweet Escape 5",
    name: "Sweet Escape · 5º",
    location: "São João do Estoril",
    description:
      "T2 no quinto andar com vista sobre a serra — terraço sul, muita luz natural.",
    photo: "/properties/sweet-escape-5.jpg",
  },
  {
    slug: "one-for-one-house",
    shortName: "One For One House",
    name: "One For One House",
    location: "Cascais",
    description:
      "Moradia em Cascais com piscina, talhada para estadias longas e grupos.",
    photo: "/properties/one-for-one-house.jpg",
  },
];

export function getProperty(slug: string): Property | undefined {
  return PROPERTIES.find((p) => p.slug === slug);
}
