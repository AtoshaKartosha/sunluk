import { notFound } from "next/navigation";
import { resolveRegion } from "@/lib/medusa/regions";
import { getProduct, type ProductDetail } from "@/lib/medusa/products";
import type { CalculatedPrice } from "@/components/product";
import {
  ProductGallery,
  PriceDisplay,
  VariantSelector,
} from "@/components/product";
import SiteHeader from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";

export const dynamic = "force-dynamic";

interface ProductDetailPageProps {
  params: Promise<{ handle: string }>;
}

/** Resolve the cheapest variant's calculated_price, or null. */
function cheapestPrice(product: ProductDetail): CalculatedPrice | null {
  const variants = product.variants;
  if (!variants || variants.length === 0) return null;

  let best: number | null = null;
  let bestPrice: CalculatedPrice | null = null;

  for (const v of variants) {
    const amt = v.calculated_price?.calculated_amount;
    if (amt == null) continue;
    if (best === null || amt < best) {
      best = amt;
      bestPrice = v.calculated_price!;
    }
  }

  return bestPrice;
}

function UnsupportedRegion({ countryCode }: { countryCode: string }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b]">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-0.5 bg-[#2f6f78] mx-auto mb-6" />
          <h2 className="font-serif text-2xl font-light tracking-wide mb-4">
            РЕГИОН НЕ ПОДДЕРЖИВАЕТСЯ
          </h2>
          <p className="text-sm text-[#2c211b]/60">
            К сожалению, доставка в регион {countryCode.toUpperCase()}{" "}
            временно недоступна.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { handle } = await params;

  const region = await resolveRegion();

  if ("type" in region) {
    return <UnsupportedRegion countryCode={region.countryCode} />;
  }

  const product = await getProduct(handle, region);

  if (!product) {
    notFound();
  }

  const price = cheapestPrice(product);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b]">
      <SiteHeader />
      <main className="flex-1">
        <section className="pt-20 sm:pt-32 pb-16">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
              {/* Gallery */}
              <ProductGallery
                images={product.images}
                thumbnail={product.thumbnail}
                title={product.title}
              />

              {/* Product Info */}
              <div className="flex flex-col gap-6">
                <div>
                  <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2c211b] mb-2">
                    {product.title}
                  </h1>
                </div>

                <PriceDisplay price={price} className="text-xl" />

                {product.description && (
                  <div className="text-sm text-[#2c211b]/70 leading-relaxed">
                    <p>{product.description}</p>
                  </div>
                )}

                <div className="border-t border-[#2c211b]/10 pt-6">
                  <VariantSelector
                    options={product.options}
                    variants={product.variants}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
