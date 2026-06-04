import type { StoreProduct } from "./types";
import { ProductCard } from "./ProductCard";
import type { Locale } from "@/i18n/routing";

interface ProductGridProps {
  products: StoreProduct[];
  /** Copy shown when the grid is empty. Defaults to Russian. */
  emptyMessage?: string;
  /** Override grid column classes. Defaults to 1 / 2 / 3 / 4 columns. */
  gridClass?: string;
  /** Current locale for product card links. */
  locale?: Locale;
}

import { useTranslations } from "next-intl";

export function ProductGrid({
  products,
  emptyMessage,
  gridClass = "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  locale,
}: ProductGridProps) {
  const t = useTranslations("catalog");
  const fallbackEmpty = emptyMessage ?? t("empty");
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-0.5 bg-[#2f6f78] mb-6" />
        <p className="text-lg text-[#2c211b]/60 font-medium tracking-wide uppercase">
          {fallbackEmpty}
        </p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridClass} gap-x-3 gap-y-6 sm:gap-8`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} locale={locale} />
      ))}
    </div>
  );
}
