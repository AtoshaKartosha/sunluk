import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18n = createMiddleware(routing);

export async function proxy(request: NextRequest): Promise<NextResponse | undefined> {
  const { pathname } = request.nextUrl;
  const isCatalogPath = pathname.startsWith("/products");
  const localizedCatalogMatch = pathname.match(/^\/([^/]+)\/products(\/.*)?$/);

  if (localizedCatalogMatch) {
    const [, locale, suffix = ""] = localizedCatalogMatch;

    if (locale !== "ru" && locale !== "en") {
      const url = new URL(`/ru/products${suffix}`, request.url);
      return NextResponse.redirect(url, 308);
    }

    return handleI18n(request);
  }

  if (isCatalogPath) {
    const url = new URL(`/ru${pathname}`, request.url);
    return NextResponse.redirect(url, 308);
  }

  return undefined;
}

export const config = {
  matcher: [
    "/products",
    "/products/:path*",
    "/:locale/products",
    "/:locale/products/:path*",
  ],
};
