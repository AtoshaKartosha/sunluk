import type { StoreProduct } from "./types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: StoreProduct[];
  /** Copy shown when the grid is empty. Defaults to Russian. */
  emptyMessage?: string;
  /** Override grid column classes. Defaults to 1 / 2 / 3 / 4 columns. */
  gridClass?: string;
}

export function ProductGrid({
  products,
  emptyMessage = "Товары не найдены",
  gridClass = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-0.5 bg-[#2f6f78] mb-6" />
        <p className="text-lg text-[#2c211b]/60 font-medium tracking-wide uppercase">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridClass} gap-6 sm:gap-8`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
