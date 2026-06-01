import type { StoreProduct } from "./types";
import { ProductGrid } from "./ProductGrid";
import type { Locale } from "@/i18n/routing";

interface ProductRelatedProductsProps {
  products?: StoreProduct[];
  locale?: Locale;
  heading?: string;
}

/**
 * Renders a grid of related products.
 * The products are fetched server-side and passed in as props.
 */
export function ProductRelatedProducts({
  products,
  heading,
}: ProductRelatedProductsProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="mt-16 border-t border-[#2c211b]/10 pt-12">
      {heading && (
        <h2 className="font-serif text-xl sm:text-2xl font-light tracking-wide text-[#2c211b] uppercase mb-8 text-center">
          {heading}
        </h2>
      )}
      <ProductGrid products={products} />
    </section>
  );
}
