import { ProductImage } from "@/components/product/ProductImage";
import Link from "next/link";
import type { StoreProduct } from "./types";
import { ProductBadge } from "./ProductBadge";
import { PriceDisplay } from "./PriceDisplay";
import type { Locale } from "@/i18n/routing";
import { cheapestVariantPrice, projectAvailability } from "@/lib/price";

interface ProductCardProps {
  product: StoreProduct;
  locale?: Locale;
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const src = product.thumbnail ?? product.images?.[0]?.url;
  const price = cheapestVariantPrice(product.variants);
  const isUnavailable =
    !!product.variants?.length &&
    !product.variants.some((variant) => projectAvailability(variant).available);

  const href = `/${locale ?? "ru"}/products/${product.handle}`;

  return (
    <Link
      href={href}
      className="group flex flex-col text-left bg-transparent transition-all duration-300"
    >
      {/* Image */}
      <div className="aspect-[4/5] overflow-hidden bg-[#f4ebe6] mb-3 sm:mb-4 relative">
        <ProductBadge
          badge={
            isUnavailable
              ? "sold_out"
              : String(product.metadata?.badge ?? "")
          }
        />
        {src ? (
          <ProductImage
            src={src}
            alt={product.title}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[#2c211b]/30 text-xs font-medium uppercase tracking-widest">
              {product.title}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <h3 className="font-serif text-xs sm:text-base font-medium text-[#2c211b] mb-1 group-hover:text-[#2f6f78] transition-colors">
        {product.title}
      </h3>

      {product.subtitle && (
        <p className="text-[9px] sm:text-xs text-[#2c211b]/60 mb-2 leading-relaxed line-clamp-2">
          {product.subtitle}
        </p>
      )}

      <div className="mt-auto">
        <PriceDisplay price={price} className="text-xs sm:text-base font-normal!" />
      </div>
    </Link>
  );
}
