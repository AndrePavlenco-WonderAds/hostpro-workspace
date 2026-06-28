import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE, GATE_PASSWORD } from "@/lib/gate-auth";

// App-wide password gate.
// Every request that lacks a valid `hostpro-gate` cookie is redirected to
// `/unlock?next=<original-path>`. The allow-list at the top lets the unlock
// flow itself, static assets, and the favicon through. Renamed from
// `middleware.ts` because Next.js 16 deprecated that convention in favour of
// `proxy.ts` (see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).

const PUBLIC_PATHS = [
  "/unlock",
  "/api/unlock",
];

const PUBLIC_PREFIXES = [
  "/_next/",
];

const PUBLIC_FILE_RE = /\.(?:ico|png|jpg|jpeg|svg|webp|gif|txt|xml|map|woff2?)$/i;

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
    PUBLIC_FILE_RE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(GATE_COOKIE)?.value;
  if (cookie === GATE_PASSWORD) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/unlock";
  url.searchParams.set("next", pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  // Run on every path; the function itself decides what is public.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
