import { type NextRequest, NextResponse } from "next/server";

/**
 * Redirect non-locale-prefixed paths to the default locale.
 *
 * With localePrefix: "always", all routes live under `/[locale]/`.
 * This middleware ensures `/login`, `/`, `/cabinet` etc.
 * redirect to `/ru/login`, `/ru`, `/ru/cabinet`.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Already locale-prefixed or a special path
  if (
    pathname.startsWith("/ru/") ||
    pathname.startsWith("/en/") ||
    pathname === "/ru" ||
    pathname === "/en"
  ) {
    return NextResponse.next();
  }

  // Static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/media") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Redirect to default locale
  const url = new URL(`/ru${pathname}`, request.url);
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
