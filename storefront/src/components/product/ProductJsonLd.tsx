import type { VariantProjection } from "@/lib/price";
import { absoluteUrl, safeJsonLd } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

interface ProductJsonLdProps {
  title: string;
  description: string | null;
  imageUrl: string | null;
  projection: VariantProjection;
  locale: Locale;
  handle: string;
  catalogLabel: string;
}

/**
 * Renders Product and BreadcrumbList JSON-LD for a product detail page.
 *
 * The Product schema carries name, image, and an Offer (price, currency,
 * availability) derived from the selected/default variant projection; the
 * Offer is omitted when no variant price resolves. The BreadcrumbList covers
 * Home > Catalog > Product. Serialization escapes `<` so a data value cannot
 * terminate the script element.
 */
export function ProductJsonLd({
  title,
  description,
  imageUrl,
  projection,
  locale,
  handle,
  catalogLabel,
}: ProductJsonLdProps) {
  const productUrl = absoluteUrl(`/${locale}/products/${handle}`);

  const product: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    url: productUrl,
  };
  if (description) {
    product.description = description;
  }
  if (imageUrl) {
    product.image = imageUrl;
  }
  if (projection.price) {
    product.offers = {
      "@type": "Offer",
      price: projection.price.calculated_amount,
      priceCurrency: projection.price.currency_code.toUpperCase(),
      availability: projection.isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: productUrl,
    };
  }

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "SUNLUK",
        item: absoluteUrl(`/${locale}`),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: catalogLabel,
        item: absoluteUrl(`/${locale}/products`),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(product) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }}
      />
    </>
  );
}
