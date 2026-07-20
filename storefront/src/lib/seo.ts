import type { Metadata } from "next";
import { routing, type Locale } from "@/i18n/routing";

const LOCALES: readonly Locale[] = routing.locales;
const DEFAULT_LOCALE: Locale = routing.defaultLocale;

/**
 * Production-safe site origin.
 * `NEXT_PUBLIC_SITE_URL` wins; `https://sunluk.com` is the code fallback.
 * Trailing slashes are trimmed so callers can concatenate a path safely.
 */
export function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sunluk.com";
  return raw.replace(/\/+$/, "");
}

/** Join the site origin with a locale-prefixed path into an absolute URL. */
export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteOrigin()}${normalized}`;
}

export type PublicRoute = "home" | "products" | "info" | "product";

/** Canonical path for a public route and locale. */
export function routePath(
  locale: Locale,
  route: PublicRoute,
  handle?: string,
): string {
  switch (route) {
    case "home":
      return `/${locale}`;
    case "products":
      return `/${locale}/products`;
    case "info":
      return `/${locale}/info`;
    case "product": {
      if (!handle) {
        throw new Error("routePath: product route requires a handle");
      }
      return `/${locale}/products/${handle}`;
    }
  }
}

export interface RouteAlternates {
  canonical: string;
  languages: Record<string, string>;
}

/**
 * Canonical URL for `locale` plus `ru`/`en`/`x-default` alternate URLs.
 * For a product, the same stable handle is used across locales so an
 * equivalent-language alternate always points at the equivalent page.
 */
export function routeAlternates(
  locale: Locale,
  route: PublicRoute,
  handle?: string,
): RouteAlternates {
  const canonical = absoluteUrl(routePath(locale, route, handle));
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = absoluteUrl(routePath(loc, route, handle));
  }
  languages["x-default"] = absoluteUrl(
    routePath(DEFAULT_LOCALE, route, handle),
  );
  return { canonical, languages };
}

export interface RouteMetadataInput {
  locale: Locale;
  route: PublicRoute;
  title: string;
  description: string;
  handle?: string;
  image?: string;
}

/**
 * Build per-route Metadata: canonical, hreflang alternates, and localized
 * Open Graph/Twitter cards. Image is omitted when absent rather than invented.
 */
export function buildRouteMetadata(input: RouteMetadataInput): Metadata {
  const { locale, route, title, description, handle, image } = input;
  const { canonical, languages } = routeAlternates(locale, route, handle);

  const openGraph: NonNullable<Metadata["openGraph"]> = {
    title,
    description,
    url: canonical,
    siteName: "SUNLUK",
    locale: locale === "ru" ? "ru_RU" : "en_US",
  };
  if (image) {
    openGraph.images = [{ url: image }];
  }

  const twitter: NonNullable<Metadata["twitter"]> = {
    card: "summary_large_image",
    title,
    description,
  };
  if (image) {
    twitter.images = [{ url: image }];
  }

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph,
    twitter,
  };
}

/**
 * Base metadata for the locale layout: metadataBase, default localized
 * Open Graph/Twitter, and the locale-root canonical + hreflang alternates.
 * Page-level metadata merges over and overrides these.
 */
export function baseMetadata(
  locale: Locale,
  title: string,
  description: string,
): Metadata {
  const { canonical, languages } = routeAlternates(locale, "home");
  return {
    metadataBase: new URL(siteOrigin()),
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      type: "website",
      siteName: "SUNLUK",
      title,
      description,
      url: canonical,
      locale: locale === "ru" ? "ru_RU" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/**
 * Serialize a JSON-LD object, escaping `<` so a data value can never
 * terminate the containing `<script>` element.
 */
export function safeJsonLd(json: unknown): string {
  return JSON.stringify(json).replace(/</g, "\\u003c");
}
