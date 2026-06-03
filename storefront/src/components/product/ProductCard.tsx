import Image from "next/image";
import Link from "next/link";
import type { StoreProduct } from "./types";
import { PriceDisplay } from "./PriceDisplay";
import type { Locale } from "@/i18n/routing";
import { cheapestVariantPrice } from "@/lib/price";

interface ProductCardProps {
  product: StoreProduct;
  locale?: Locale;
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const src = product.thumbnail ?? product.images?.[0]?.url;
  const price = cheapestVariantPrice(product.variants);

  const href = `/${locale ?? "ru"}/products/${product.handle}`;

  return (
    <Link
      href={href}
      className="group flex flex-col text-left bg-transparent transition-all duration-300"
    >
      {/* Image */}
      <div className="aspect-[4/5] overflow-hidden bg-[#f4ebe6] mb-4 relative">
        {src ? (
          <Image
            src={src}
            alt={product.title}
            fill
            unoptimized
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
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
      <h3 className="font-serif text-base font-bold text-[#2c211b] mb-1 group-hover:text-[#2f6f78] transition-colors">
        {product.title}
      </h3>

      {product.subtitle && (
        <p className="text-xs text-[#2c211b]/60 mb-2 leading-relaxed line-clamp-2">
          {product.subtitle}
        </p>
      )}

      <div className="mt-auto">
        <PriceDisplay price={price} className="text-base" />
      </div>
    </Link>
  );
}
