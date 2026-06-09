import type { VariantProjection } from "@/lib/price";

interface ProductJsonLdProps {
  title: string;
  description: string | null;
  imageUrl: string | null;
  projection: VariantProjection;
  /** Canonical product URL (without locale prefix or trailing slash). */
  url: string;
}

/**
 * Renders a Product JSON-LD structured data script tag.
 *
 * Includes title, image, price, currency, and availability derived from the
 * selected/default variant projection. This feeds Google Shopping/search
 * rich results without requiring client-side JS.
 *
 * When no variant price is available the Offer is omitted.
 */
export function ProductJsonLd({
  title,
  description,
  imageUrl,
  projection,
  url,
}: ProductJsonLdProps) {
  const json: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    url,
  };

  if (description) {
    json.description = description;
  }

  if (imageUrl) {
    json.image = imageUrl;
  }

  if (projection.price) {
    const availability = projection.isAvailable
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

    json.offers = {
      "@type": "Offer",
      price: projection.price.calculated_amount,
      priceCurrency: projection.price.currency_code.toUpperCase(),
      availability,
      url,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
