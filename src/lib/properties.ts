// The accommodations HostPro currently manages.
// Order here is left-to-right on the homepage.

export type PropertySlug =
  | "sweet-escape-2"
  | "sweet-escape-5"
  | "one-for-one-house";

export type Property = {
  slug: PropertySlug;
  name: string;
  location: string;          // e.g. "Monte Estoril"
  photo: string;             // path under /public
  /** Short label shown on cards / nav. */
  shortName: string;
  /** Longer description for the property detail page header. Cards don't
   *  render this — they're intentionally tight. */
  description: string;
};

export const PROPERTIES: Property[] = [
  {
    slug: "sweet-escape-2",
    shortName: "Sweet Escape 2",
    name: "Sweet Escape · 2º",
    location: "Monte Estoril",
    photo: "/properties/sweet-escape-2.jpg",
    description: "T2 reabilitado em Monte Estoril, perfeito para escapadinhas curtas.",
  },
  {
    slug: "sweet-escape-5",
    shortName: "Sweet Escape 5",
    name: "Sweet Escape · 5º",
    location: "Monte Estoril",
    photo: "/properties/sweet-escape-5.jpg",
    description: "T2 com terraço e vista sobre a serra, muita luz natural.",
  },
  {
    slug: "one-for-one-house",
    shortName: "One For One House",
    name: "One For One House",
    location: "São João do Estoril",
    photo: "/properties/one-for-one-house.jpg",
    description:
      "Apartamento grande premium de 3 quartos em São João do Estoril.",
  },
];

export function getProperty(slug: string): Property | undefined {
  return PROPERTIES.find((p) => p.slug === slug);
}
