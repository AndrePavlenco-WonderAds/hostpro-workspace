// Map an Airbnb listing → PropertySlug. We try the most reliable signal
// first (the Airbnb room id embedded in every email URL), then fall back
// to substring rules on the listing title (Portuguese variations included).

import type { PropertySlug } from "@/lib/properties";

// Room ids extracted from real emails on 2026-06-07 — each is the numeric
// id in URLs like `https://www.airbnb.com/rooms/{id}?...`.
//
// 🔴 `619354998862049574` is unmapped — Andre needs to confirm which AL
// owns this listing. Its title is in PT ("Apartamento perto da praia do
// Estoril, Cascais"), its rate is €100/night which matches a T2, but it
// can be either SE2 or a 4th Airbnb listing we don't know about. Until
// confirmed it returns `null` so the cron logs it as `unknown-listing`
// rather than dropping it into the wrong AL.
const ROOM_TO_PROPERTY: Record<string, PropertySlug | null> = {
  "1638360824534789511": "sweet-escape-2",      // "2BR Apartment · Near Estoril Beach & Cascais"
  "1637971491844755599": "sweet-escape-5",      // "2BR Estoril Apartment · Near Beach & Cascais"
  "1653792707745872015": "one-for-one-house",   // "Apartamento T3 perto da praia Estoril & Cascais"
  "619354998862049574": null,                   // unmapped — awaiting Andre's confirmation
};

/** True when the room is known but Andre hasn't told us which AL it is. */
export function isAmbiguousRoom(roomId: string): boolean {
  return roomId in ROOM_TO_PROPERTY && ROOM_TO_PROPERTY[roomId] === null;
}

/** Returns the matching slug. Tries: (1) room id → exact map, (2) listing
 *  title substring rules with PT and EN variants. */
export function inferProperty(opts: {
  roomId?: string;
  listingText?: string;
}): PropertySlug | null {
  if (opts.roomId && opts.roomId in ROOM_TO_PROPERTY) {
    return ROOM_TO_PROPERTY[opts.roomId];
  }

  const text = (opts.listingText ?? "").toLowerCase();
  if (!text) return null;

  // One For One — the only T3/3BR. Title sometimes in PT ("Apartamento T3
  // perto da praia") or EN ("Big 3BR Apartment").
  if (/\b(3br|3\s*bed|3\s*bedroom|big\s*3|\bt3\b|t-3)\b/.test(text)) {
    return "one-for-one-house";
  }

  // Sweet Escape 5 — EN title puts "Estoril" BEFORE "Apartment".
  if (/2\s*br\s+estoril\s+apartment/.test(text) || /estoril\s+apartment/.test(text)) {
    return "sweet-escape-5";
  }

  // Sweet Escape 2 — EN title puts "Apartment" before "Estoril".
  if (/2\s*br\s+apartment\b/.test(text) || /\bnear\s+estoril\s+beach/.test(text)) {
    return "sweet-escape-2";
  }

  return null;
}
