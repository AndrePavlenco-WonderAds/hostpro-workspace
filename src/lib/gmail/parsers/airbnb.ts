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

/** Parse a euro amount string, handling thousands separators in both
 *  US format ("1,303.00") and EU/PT format ("1.303,00").
 *  Airbnb uses US format consistently — `€ 1,303.00` — but the old regex
 *  bailed at `1,30` and returned 1.3, so anything >€1000 was wrong. */
export function parseEuro(input: string): number | null {
  // Capture the whole numeric run including any sign + thousand/decimal seps.
  const m = input.match(/-?\d[\d.,]*/);
  if (!m) return null;
  let raw = m[0];

  const lastDot = raw.lastIndexOf(".");
  const lastComma = raw.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) {
    if (lastDot > lastComma) {
      // US: 1,234.56 — commas are thousand seps, dot is decimal.
      raw = raw.replace(/,/g, "");
    } else {
      // EU: 1.234,56 — dots are thousand seps, comma is decimal.
      raw = raw.replace(/\./g, "").replace(",", ".");
    }
  } else if (lastDot >= 0) {
    const dotCount = (raw.match(/\./g) || []).length;
    const after = raw.length - lastDot - 1;
    // One dot with ≤2 digits after → decimal. Otherwise → thousands separators.
    if (!(dotCount === 1 && after <= 2)) raw = raw.replace(/\./g, "");
  } else if (lastComma >= 0) {
    const commaCount = (raw.match(/,/g) || []).length;
    const after = raw.length - lastComma - 1;
    if (commaCount === 1 && after <= 2) raw = raw.replace(",", ".");
    else raw = raw.replace(/,/g, "");
  }

  const v = parseFloat(raw);
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

  // 5. Check-in / Checkout. Two pathways:
  //
  // 5a. Prefer the explicit "May 25, 2027" form Airbnb buries elsewhere in
  //     the body (booking metadata / receipt blocks). These ALWAYS carry
  //     the year, which is critical for bookings made far in advance —
  //     defaulting to the email year silently dropped 2027 stays into 2026.
  //
  // 5b. If that's not present, fall back to the weekday+month-day form
  //     visible to the user ("Wed, Apr 8") with the email year heuristic.
  const explicitDates = [...body.matchAll(/([A-Z][a-z]+\s+\d{1,2},\s+(\d{4}))/g)].map(
    (m) => ({ raw: m[1], year: parseInt(m[2], 10) }),
  );
  // Sort and pick first two distinct dates — check-in then check-out.
  const uniqueExplicit: { raw: string; year: number }[] = [];
  for (const d of explicitDates) {
    if (!uniqueExplicit.find((u) => u.raw === d.raw)) uniqueExplicit.push(d);
  }

  let checkin: string | null = null;
  let checkout: string | null = null;
  if (uniqueExplicit.length >= 2) {
    const iso = uniqueExplicit
      .map((d) => parseEnglishDate(d.raw, d.year))
      .filter((s): s is string => !!s)
      .sort();
    if (iso.length >= 2) {
      checkin = iso[0];
      checkout = iso[iso.length - 1];
    }
  }

  if (!checkin || !checkout) {
    // Fallback path — same regex as before, but with the year-bump
    // heuristic to handle stays in the future that don't carry a year.
    const ciMatch = body.match(
      /Check[-\s]?in[\s\S]{0,80}?(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*([A-Z][a-z]+\.?\s+\d{1,2})/,
    );
    const coMatch = body.match(
      /Checkout[\s\S]{0,80}?(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*([A-Z][a-z]+\.?\s+\d{1,2})/,
    );
    const checkinRaw = ciMatch?.[1];
    const checkoutRaw = coMatch?.[1];
    if (!checkinRaw || !checkoutRaw) return null;
    checkin = parseEnglishDate(checkinRaw, emailYear);
    checkout = parseEnglishDate(checkoutRaw, emailYear);
    if (!checkin || !checkout) return null;
    // If check-out lands before check-in we picked the wrong year for at
    // least one of them — bump the appropriate side until they're ordered.
    if (checkout < checkin) {
      const co = parseEnglishDate(checkoutRaw, (emailYear ?? new Date().getUTCFullYear()) + 1);
      if (co) checkout = co;
    }
  }

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

  // Two roomId patterns:
  //   - Confirmation-style emails: `/rooms/{id}?...` in plain body URLs
  //   - Payout emails: `Listing title (1638360824534789511)` parens after
  //     the listing title (no URL anywhere). Airbnb room ids are 17-19
  //     digits.
  const urlSource = plainBody && plainBody.length > 0 ? plainBody : body;
  let roomId = urlSource.match(/rooms\/(\d+)/)?.[1];
  if (!roomId) {
    roomId = body.match(/\((\d{15,20})\)/)?.[1];
  }

  // Two listing patterns: (a) any line ending with `(roomId)` — the payout
  // layout; (b) generic title followed by Entire home/apt — confirmation
  // layout (some payouts also include this section).
  let listingText = "";
  const parensTitleMatch = body.match(/(?:^|\n)\s*([^\n()]{6,120}?)\s*\(\d{15,20}\)/);
  if (parensTitleMatch) {
    listingText = parensTitleMatch[1].replace(/\s+/g, " ").trim();
  }
  if (!listingText) {
    const titleMatch = body.match(
      /(?:^|\n)\s*([A-ZÀ-Ý][^\n]{6,120}?(?:Apartment|Apartamento)[^\n]{0,80}?)\s*\n/,
    );
    if (titleMatch) listingText = titleMatch[1].replace(/\s+/g, " ").trim();
  }

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

// ---------- "Canceled: Reservation HM… for …" ----------

export type AirbnbCancellation = {
  hmCode: string;
  /** Original stay window, parsed best-effort from the subject. */
  rangeText?: string;
  cancellationDate: string;  // ISO — from email's internalDate
};

/** Tiny subject-only parser. The body of a cancellation email also exists
 *  but the subject already carries everything we act on (HM code). Body
 *  parsing would only matter once we want to surface the refund amount. */
export function parseAirbnbCancellation(
  subject: string,
  receivedDate: string,
): AirbnbCancellation | null {
  // "Canceled: Reservation HM3ZABYY9D for Jul 20 – 26, 2026"
  // "Canceled: Reservation HMHCRZ5D8R for Nov 27 – 29, 2026"
  const m = subject.match(/Canceled:\s*Reservation\s+(HM[A-Z0-9]{8,10})(?:\s+for\s+(.+))?/i);
  if (!m) return null;
  return {
    hmCode: m[1],
    rangeText: m[2]?.trim(),
    cancellationDate: receivedDate.slice(0, 10),
  };
}
