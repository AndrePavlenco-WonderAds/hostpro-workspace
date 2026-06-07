// Classify an Airbnb listing → which HostPro property (if any). The most
// reliable signal is the Airbnb room id embedded in every email URL; we
// fall back to substring rules on the title when the id isn't in our map.

import type { PropertySlug } from "@/lib/properties";

/** Mapped to a known HostPro AL, intentionally ignored (not ours), or
 *  unknown (something we haven't seen — needs human review). */
export type ListingClassification =
  | { kind: "property"; slug: PropertySlug }
  | { kind: "ignored"; reason: string }
  | { kind: "unknown" };

// Room ids harvested from real emails on 2026-06-07.
const ROOM_MAP: Record<string, ListingClassification> = {
  "1638360824534789511": { kind: "property", slug: "sweet-escape-2" },     // "2BR Apartment · Near Estoril Beach & Cascais"
  "1637971491844755599": { kind: "property", slug: "sweet-escape-5" },     // "2BR Estoril Apartment · Near Beach & Cascais"
  "1653792707745872015": { kind: "property", slug: "one-for-one-house" },  // "Apartamento T3 perto da praia Estoril & Cascais"
  // Andre confirmed 2026-06-07: this listing is NOT a HostPro AL. It still
  // hits this inbox because of legacy contact settings; we mark it ignored
  // so the cron logs and labels it `processado` without ever touching pnl.
  "619354998862049574": { kind: "ignored", reason: "Não pertence à HostPro (confirmado por Andre, 07/06/2026)" },
};

/** Decide what a given email's listing is. Tries: (1) room id exact match,
 *  (2) listing title substring rules with PT and EN variants. */
export function classifyListing(opts: {
  roomId?: string;
  listingText?: string;
}): ListingClassification {
  if (opts.roomId && opts.roomId in ROOM_MAP) {
    return ROOM_MAP[opts.roomId];
  }

  const text = (opts.listingText ?? "").toLowerCase();
  if (!text) return { kind: "unknown" };

  // One For One — the only T3/3BR.
  if (/\b(3br|3\s*bed|3\s*bedroom|big\s*3|\bt3\b|t-3)\b/.test(text)) {
    return { kind: "property", slug: "one-for-one-house" };
  }

  // Sweet Escape 5 — EN title puts "Estoril" BEFORE "Apartment".
  if (/2\s*br\s+estoril\s+apartment/.test(text) || /estoril\s+apartment/.test(text)) {
    return { kind: "property", slug: "sweet-escape-5" };
  }

  // Sweet Escape 2 — EN title puts "Apartment" before "Estoril".
  if (/2\s*br\s+apartment\b/.test(text) || /\bnear\s+estoril\s+beach/.test(text)) {
    return { kind: "property", slug: "sweet-escape-2" };
  }

  return { kind: "unknown" };
}

/** Backwards-compat — returns the slug only when classification yielded a
 *  HostPro property. Use `classifyListing` directly when you need to
 *  distinguish ignored vs unknown. */
export function inferProperty(opts: {
  roomId?: string;
  listingText?: string;
}): PropertySlug | null {
  const c = classifyListing(opts);
  return c.kind === "property" ? c.slug : null;
}
