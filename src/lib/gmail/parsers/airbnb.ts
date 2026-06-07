// Parsers for the two Airbnb host emails we care about.
//
// Important findings from the real emails (2026-06-07):
//   - The PLAIN body is laid out in TABULAR form ("Check-in    Checkout" on
//     the same line, then "Wed, Apr 8    Wed, Apr 15" on the same line) →
//     regex can't span across the columns. We use the HTML-stripped body
//     instead, which is linearised.
//   - The Airbnb room id in the URL (`/rooms/{id}?...`) is the most stable
//     signal for property identification — far more reliable than the
//     listing title (which Andre has rotated between EN and PT).
//   - Subject for confirmations: "Reservation confirmed - {Guest Name}
//     arrives {Month Day}"  (no year). Year inferred from the email's
//     received date.

import type { PropertySlug } from "@/lib/properties";
import { classifyListing, type ListingClassification } from "../listing-map";

// ---------- shared helpers ----------

export function parseEnglishDate(input: string, defaultYear?: number): string | null {
  const months: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    january: 1, february: 2, march: 3, april: 4, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  };
  const m = input
    .trim()
    .toLowerCase()
    .match(/([a-z]{3,9})\.?\s+(\d{1,2})(?:,\s*(\d{4}))?/);
  if (!m) return null;
  const month = months[m[1]];
  const day = parseInt(m[2], 10);
  const year = m[3] ? parseInt(m[3], 10) : (defaultYear ?? new Date().getUTCFullYear());
  if (!month || !day || !year) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** "DD/MM-DD/MM" stay-window — same format already used everywhere in pnl. */
export function stayWindow(checkin: string, checkout: string): string {
  const [, mA, dA] = checkin.split("-");
  const [, mB, dB] = checkout.split("-");
  return `${dA}/${mA}-${dB}/${mB}`;
}

export function parseEuro(input: string): number | null {
  const m = input.match(/(-?[\d]+[.,]\d{2}|-?\d+)/);
  if (!m) return null;
  const cleaned = m[1].replace(",", ".");
  const v = parseFloat(cleaned);
  return Number.isFinite(v) ? v : null;
}

// ---------- "Reservation confirmed" ----------

export type AirbnbConfirmation = {
  confirmationCode: string;
  guestName: string;
  checkin: string;                 // ISO YYYY-MM-DD
  checkout: string;                // ISO YYYY-MM-DD
  stayWindow: string;              // "DD/MM-DD/MM"
  roomId?: string;
  listingText: string;
  classification: ListingClassification;
  /** Convenience — the slug when classification.kind === "property". */
  property: PropertySlug | null;
  /** Total guest paid (incl. cleaning + service fee). Closest to what the
   *  pnl entries use as `amount` for the OFO / SE imports. */
  guestTotal?: number;
  cleaningFee?: number;
  hostPayout?: number;             // what Airbnb actually transfers to host
};

/** Parser for the host-side confirmation email. We use TWO body inputs:
 *    - `body` = HTML run through `htmlToText` — for dates / money / title
 *    - `plainBody` = the actual text/plain part — for URL extraction
 *      (htmlToText strips `<a href>` so room/{id} URLs only survive in plain)
 */
export function parseAirbnbConfirmation(
  subject: string,
  body: string,
  emailYear?: number,
  plainBody?: string,
): AirbnbConfirmation | null {
  // 1. Confirmation code — "HM" + 8-10 alphanumeric.
  const codeMatch = body.match(/\b(HM[A-Z0-9]{8,10})\b/);
  if (!codeMatch) return null;
  const confirmationCode = codeMatch[1];

  // 2. Guest name — strip "Reservation confirmed - " prefix and " arrives X" suffix.
  let guestName = "—";
  const subjMatch = subject.match(/Reservation confirmed\s*[-–—]\s*(.+?)\s+arrives\b/i);
  if (subjMatch) guestName = subjMatch[1].trim();

  // 3. Room id — prefer the plain body because htmlToText strips `<a href>`
  //    completely, while the plain body always carries the bare URL.
  const urlSource = plainBody && plainBody.length > 0 ? plainBody : body;
  const roomMatch = urlSource.match(/rooms\/(\d+)/);
  const roomId = roomMatch?.[1];

  // 4. Listing title — first PT/EN apartment phrase on a single line right
  //    before "Entire home/apt". The previous greedy regex sometimes leaked
  //    into the prior paragraph ("Canada 2BR Estoril..."), so we restrict
  //    the title to one line (no newlines) and require at least one word
  //    character at the start so we don't pick up trailing punctuation.
  let listingText = "";
  const titleMatch = body.match(
    /(?:^|\n)\s*([A-ZÀ-Ý][^\n]{6,120}?)\s*\n\s*Entire home\/apt/,
  );
  if (titleMatch) listingText = titleMatch[1].replace(/\s+/g, " ").trim();

  // 5. Check-in / Checkout. With htmlToText output the layout is:
  //      Check-in
  //      Wed, Apr 8
  //      3:00 PM
  //      Checkout
  //      Wed, Apr 15
  //      11:00 AM
  //    so we look for the weekday-comma-month pattern after each header.
  const ciMatch = body.match(
    /Check[-\s]?in[\s\S]{0,80}?(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*([A-Z][a-z]+\.?\s+\d{1,2})/,
  );
  const coMatch = body.match(
    /Checkout[\s\S]{0,80}?(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*([A-Z][a-z]+\.?\s+\d{1,2})/,
  );

  // Fallback — older templates may not include the weekday.
  const ciFallback = !ciMatch
    ? body.match(/Check[-\s]?in[\s\S]{0,80}?([A-Z][a-z]+\.?\s+\d{1,2}(?:,\s*\d{4})?)/)
    : null;
  const coFallback = !coMatch
    ? body.match(/Checkout[\s\S]{0,80}?([A-Z][a-z]+\.?\s+\d{1,2}(?:,\s*\d{4})?)/)
    : null;

  const checkinRaw = ciMatch?.[1] ?? ciFallback?.[1];
  const checkoutRaw = coMatch?.[1] ?? coFallback?.[1];
  if (!checkinRaw || !checkoutRaw) return null;

  const checkin = parseEnglishDate(checkinRaw, emailYear);
  const checkout = parseEnglishDate(checkoutRaw, emailYear);
  if (!checkin || !checkout) return null;

  // 6. Money — "Total (EUR)" is guest-paid total, "You earn" is host payout.
  //    Both currencies sometimes have a non-breaking space between "€" and digits.
  const totalMatch = body.match(/Total \(EUR\)\s*€?\s*([\d.,]+)/i);
  const earnMatch = body.match(/You earn\s*€?\s*([\d.,]+)/i);
  const cleaningMatch = body.match(/Cleaning fee\s*€?\s*([\d.,]+)/i);

  const classification = classifyListing({ roomId, listingText });
  return {
    confirmationCode,
    guestName,
    checkin,
    checkout,
    stayWindow: stayWindow(checkin, checkout),
    roomId,
    listingText,
    classification,
    property: classification.kind === "property" ? classification.slug : null,
    guestTotal: totalMatch ? parseEuro(totalMatch[1]) ?? undefined : undefined,
    hostPayout: earnMatch ? parseEuro(earnMatch[1]) ?? undefined : undefined,
    cleaningFee: cleaningMatch ? parseEuro(cleaningMatch[1]) ?? undefined : undefined,
  };
}

// ---------- "We sent a payout of € X EUR" ----------

export type AirbnbPayout = {
  amount: number;
  payoutDate: string;
  confirmationCode?: string;
  roomId?: string;
  listingText?: string;
  classification?: ListingClassification;
  property?: PropertySlug | null;
};

export function parseAirbnbPayout(
  subject: string,
  body: string,
  receivedDate: string,
  plainBody?: string,
): AirbnbPayout | null {
  const subjMatch = subject.match(/payout of\s*€?\s*([\d.,]+)\s*EUR/i);
  const amount = subjMatch ? parseEuro(subjMatch[1]) : null;
  if (amount == null) return null;

  const codeMatch = body.match(/\b(HM[A-Z0-9]{8,10})\b/);
  const urlSource = plainBody && plainBody.length > 0 ? plainBody : body;
  const roomMatch = urlSource.match(/rooms\/(\d+)/);
  const roomId = roomMatch?.[1];

  let listingText = "";
  const titleMatch = body.match(
    /(?:^|\n)\s*([A-ZÀ-Ý][^\n]{6,120}?(?:Apartment|Apartamento)[^\n]{0,80}?)\s*\n/,
  );
  if (titleMatch) listingText = titleMatch[1].replace(/\s+/g, " ").trim();

  let payoutDate = receivedDate;
  const sentMatch = body.match(/sent on\s+([A-Z][a-z]+\.?\s+\d{1,2}(?:,\s*\d{4})?)/i);
  if (sentMatch) {
    const iso = parseEnglishDate(sentMatch[1]);
    if (iso) payoutDate = iso;
  }

  const classification = classifyListing({ roomId, listingText });
  return {
    amount,
    payoutDate,
    confirmationCode: codeMatch?.[1],
    roomId,
    listingText: listingText || undefined,
    classification,
    property: classification.kind === "property" ? classification.slug : null,
  };
}
