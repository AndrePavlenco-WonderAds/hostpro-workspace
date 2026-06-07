// Map an Airbnb/Booking listing title (from an email subject or body) to a
// PropertySlug. Andre's three Airbnb listings have distinct enough names
// that a small substring rules engine is enough.

import type { PropertySlug } from "@/lib/properties";

/** Returns the matching slug, or `null` if the text doesn't look like any
 *  known listing. Case-insensitive. */
export function inferPropertyFromListing(text: string): PropertySlug | null {
  const t = text.toLowerCase();

  // One For One — the only 3BR. Listing seen in emails as e.g. "Big 3BR
  // Apartment Near Beach Estoril / Cascais" or "3BR Apartment ...".
  if (/\b(3br|3\s*bed|3\s*bedroom|big\s*3)/.test(t)) {
    return "one-for-one-house";
  }

  // Sweet Escape 5 — title puts "Estoril" BEFORE "Apartment":
  //   "2BR Estoril Apartment · Near Beach & Cascais"
  if (/2\s*br\s+estoril\s+apartment/.test(t) || /estoril\s+apartment/.test(t)) {
    return "sweet-escape-5";
  }

  // Sweet Escape 2 — title puts "Apartment" before "Estoril":
  //   "2BR Apartment · Near Estoril Beach & Cascais"
  if (/2\s*br\s+apartment\b/.test(t) || /\bnear\s+estoril\s+beach/.test(t)) {
    return "sweet-escape-2";
  }

  return null;
}
