import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { routing, toMedusaLocale, type Locale } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/seo";
import { resolveRegion } from "@/lib/medusa/regions";
import { listProducts } from "@/lib/medusa/products";

const STATIC_PATHS = ["", "/products", "/info"] as const;
const LOCALES = routing.locales as readonly Locale[];
const DEFAULT_LOCALE = routing.defaultLocale as Locale;

/** ru/en/x-default alternate URLs for a static public path. */
function staticAlternates(path: string): { languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = absoluteUrl(`/${loc}${path}`);
  }
  languages["x-default"] = absoluteUrl(`/${DEFAULT_LOCALE}${path}`);
  return { languages };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Force dynamic rendering: compute product URLs at request time, never
  // freeze them into the build output.
  await connection();
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  // Static public URLs for every locale.
  for (const path of STATIC_PATHS) {
    for (const locale of LOCALES) {
      entries.push({
        url: absoluteUrl(`/${locale}${path}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: path === "" ? 1 : 0.8,
        alternates: staticAlternates(path),
      });
    }
  }

  // Per-locale published products. A Medusa failure degrades to the static
  // entries above; the sitemap XML response never fails.
  for (const locale of LOCALES) {
    try {
      const medusaLocale = toMedusaLocale(locale);
      const region = await resolveRegion(undefined, medusaLocale);
      if ("type" in region) continue;
      const { products } = await listProducts(region, medusaLocale);
      for (const product of products) {
        if (!product.handle) continue;
        entries.push({
          url: absoluteUrl(`/${locale}/products/${product.handle}`),
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    } catch {
      // Upstream unavailable: omit product entries, keep the sitemap valid.
    }
  }

  return entries;
}
