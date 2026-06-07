// Parsers for the two Airbnb host emails we care about:
//   - "Reservation confirmed - {Guest} arrives {Date}"
//   - "We sent a payout of € {amount} EUR"
//
// Both parsers are defensive: they try several regex variants because Airbnb
// has rotated their email templates multiple times over the years. Each
// parser returns `null` when nothing matches — caller decides what to do
// (label `falhou`, log, push notification).

import type { PropertySlug } from "@/lib/properties";
import { inferPropertyFromListing } from "../listing-map";

// ---------- shared helpers ----------

/** "Aug 17, 2026" / "Aug 17" / "August 17, 2026" → ISO YYYY-MM-DD.
 *  Falls back to `null` if it can't make sense of the input. */
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

/** "DD/MM/YYYY" / "MM/DD/YYYY" — Airbnb is US-locale → MM/DD/YYYY. */
export function parseUsSlashDate(input: string): string | null {
  const m = input.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, mm, dd, yyyy] = m;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

/** "DD/MM-DD/MM" stay-window helper used everywhere in the app. */
export function stayWindow(checkin: string, checkout: string): string {
  // Both are ISO YYYY-MM-DD.
  const [, , a] = checkin.split("-");
  const [, mA] = checkin.split("-");
  const [, , b] = checkout.split("-");
  const [, mB] = checkout.split("-");
  return `${a}/${mA}-${b}/${mB}`;
}

/** Euro amount → number. Handles "€ 364.70", "€364,70", "EUR 364.70", "364.70 EUR". */
export function parseEuro(input: string): number | null {
  const m = input.match(/([\d]+[.,]\d{2}|\d+)/);
  if (!m) return null;
  const cleaned = m[1].replace(",", ".");
  const v = parseFloat(cleaned);
  return Number.isFinite(v) ? v : null;
}

// ---------- "Reservation confirmed" ----------

export type AirbnbConfirmation = {
  confirmationCode: string;        // e.g. "HMQ825SCC8"
  guestName: string;
  checkin: string;                 // ISO
  checkout: string;                // ISO
  property: PropertySlug | null;   // null when listing is unrecognised
  listingText: string;             // raw listing text we inferred from
  grossEarnings?: number;          // host-side gross (incl. cleaning, before HOST service fee)
  cleaningFee?: number;
  serviceFee?: number;
  payoutAmount?: number;
};

/** Best-effort parser for the "Reservation confirmed" host email.
 *  `subject` and `body` should be plain-text (caller runs htmlToText). */
export function parseAirbnbConfirmation(
  subject: string,
  body: string,
): AirbnbConfirmation | null {
  // 1. Confirmation code — "HM" followed by 8-10 alphanumeric chars.
  //    Same prefix the Airbnb CSV uses (HMQ825SCC8, HMHAZPKMAT, etc.).
  const codeMatch = body.match(/\b(HM[A-Z0-9]{8,10})\b/);
  if (!codeMatch) return null;
  const confirmationCode = codeMatch[1];

  // 2. Guest name — try subject first ("Reservation confirmed - {Name} arrives ...").
  let guestName = "";
  const subjMatch = subject.match(/Reservation confirmed[\s\-—–]+(.+?)\s+arrives\b/i);
  if (subjMatch) guestName = subjMatch[1].trim();
  if (!guestName) {
    // Fallback: body has "{Name} arrives"
    const bodyMatch = body.match(/([A-Z][\w'’\-]+(?:\s+[A-Z][\w'’\-]+)+)\s+arrives\b/);
    if (bodyMatch) guestName = bodyMatch[1].trim();
  }
  if (!guestName) guestName = "—";

  // 3. Check-in / check-out. Airbnb templates show "Check-in" and "Checkout"
  //    headings followed by a date like "Sun, Jun 5" or "June 5, 2026".
  //    Year often missing → infer from email's "arrives" date in subject.
  const arrivesYearMatch = subject.match(/(\d{4})\b/);
  const fallbackYear = arrivesYearMatch ? parseInt(arrivesYearMatch[1], 10) : undefined;

  const checkinRaw =
    body.match(/Check[-\s]?in[\s:]*?([A-Z][a-z]+\.?\s+\d{1,2}(?:,\s*\d{4})?)/)?.[1] ??
    body.match(/Check[-\s]?in[\s:]*?([A-Z][a-z]+,\s*[A-Z][a-z]+\.?\s+\d{1,2})/)?.[1];
  const checkoutRaw =
    body.match(/Check[-\s]?out[\s:]*?([A-Z][a-z]+\.?\s+\d{1,2}(?:,\s*\d{4})?)/)?.[1] ??
    body.match(/Check[-\s]?out[\s:]*?([A-Z][a-z]+,\s*[A-Z][a-z]+\.?\s+\d{1,2})/)?.[1];

  const checkin = checkinRaw ? parseEnglishDate(checkinRaw, fallbackYear) : null;
  const checkout = checkoutRaw ? parseEnglishDate(checkoutRaw, fallbackYear) : null;

  if (!checkin || !checkout) return null;

  // 4. Listing — appears near the top of the email, usually after the photo
  //    block. We grab the first line that looks like a listing title.
  //    Subjects of recent emails include the listing too: e.g.
  //    "RE: Reservation for 2BR Estoril Apartment ... Jun 5 – 8".
  let listingText = "";
  const subjListing = subject.match(/Reservation for\s+(.+?)\s*(?:,\s*[A-Z][a-z]+|\d|$)/i);
  if (subjListing) listingText = subjListing[1].trim();
  if (!listingText) {
    const bodyListing = body.match(/\b(\d?\s*BR\s+[A-Za-z][\w\s&·\/\-]+)\b/);
    if (bodyListing) listingText = bodyListing[1].trim();
  }
  const property = listingText ? inferPropertyFromListing(listingText) : null;

  // 5. Money — Airbnb breaks it as "Host payout" / "You earn" / "Total payout".
  const payoutMatch = body.match(/(?:Host payout|You earn|Total payout|Payout)\D{0,12}€\s*([\d.,]+)/i);
  const cleaningMatch = body.match(/Cleaning fee\D{0,8}€\s*([\d.,]+)/i);
  const serviceMatch = body.match(/(?:Service fee|Host service fee)\D{0,8}€\s*([\d.,]+)/i);
  const grossMatch = body.match(/(?:Gross earnings|Subtotal)\D{0,8}€\s*([\d.,]+)/i);

  return {
    confirmationCode,
    guestName,
    checkin,
    checkout,
    property,
    listingText,
    payoutAmount: payoutMatch ? parseEuro(payoutMatch[1]) ?? undefined : undefined,
    cleaningFee: cleaningMatch ? parseEuro(cleaningMatch[1]) ?? undefined : undefined,
    serviceFee: serviceMatch ? parseEuro(serviceMatch[1]) ?? undefined : undefined,
    grossEarnings: grossMatch ? parseEuro(grossMatch[1]) ?? undefined : undefined,
  };
}

// ---------- "We sent a payout of € X EUR" ----------

export type AirbnbPayout = {
  amount: number;
  payoutDate: string;             // ISO — when Airbnb sent it
  confirmationCode?: string;      // if mentioned (some templates do)
  listingText?: string;
  property?: PropertySlug | null;
};

export function parseAirbnbPayout(
  subject: string,
  body: string,
  receivedDate: string,         // ISO — fallback when body doesn't carry a date
): AirbnbPayout | null {
  // Amount is reliably in the subject: "We sent a payout of € 585.24 EUR"
  const subjMatch = subject.match(/payout of\s*€?\s*([\d.,]+)\s*EUR/i);
  const amount = subjMatch ? parseEuro(subjMatch[1]) : null;
  if (amount == null) return null;

  // Body sometimes mentions the listing and confirmation code; both optional.
  const codeMatch = body.match(/\b(HM[A-Z0-9]{8,10})\b/);
  let listingText = "";
  const listingMatch = body.match(/\b(\d?\s*BR\s+[A-Za-z][\w\s&·\/\-]+)\b/);
  if (listingMatch) listingText = listingMatch[1].trim();

  // "Your money was sent on June 7" → ISO.
  let payoutDate = receivedDate;
  const sentMatch = body.match(/sent on\s+([A-Z][a-z]+\.?\s+\d{1,2}(?:,\s*\d{4})?)/i);
  if (sentMatch) {
    const iso = parseEnglishDate(sentMatch[1]);
    if (iso) payoutDate = iso;
  }

  return {
    amount,
    payoutDate,
    confirmationCode: codeMatch?.[1],
    listingText: listingText || undefined,
    property: listingText ? inferPropertyFromListing(listingText) : null,
  };
}
