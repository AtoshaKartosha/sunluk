import Link from "next/link";
import { resolveRegion } from "@/lib/medusa/regions";
import { listProducts } from "@/lib/medusa/products";
import { ProductGrid } from "@/components/product";
import SiteHeader from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";

export const dynamic = "force-dynamic";

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

function CatalogError() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b]">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-0.5 bg-[#2f6f78] mx-auto mb-6" />
          <h2 className="font-serif text-2xl font-light tracking-wide mb-4">
            ОШИБКА ЗАГРУЗКИ
          </h2>
          <p className="text-sm text-[#2c211b]/60 mb-6">
            Не удалось загрузить каталог. Пожалуйста, попробуйте позже.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center px-8 py-3 border-2 border-[#2c211b] text-[#2c211b] hover:bg-[#2c211b] hover:text-white text-xs font-medium tracking-widest uppercase transition-all duration-300"
          >
            ПОПРОБОВАТЬ СНОВА
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default async function ProductsPage() {
  const region = await resolveRegion();

  if ("type" in region) {
    return <UnsupportedRegion countryCode={region.countryCode} />;
  }

  let result;
  try {
    result = await listProducts(region);
  } catch {
    return <CatalogError />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b]">
      <SiteHeader />
      <main className="flex-1">
        <section className="pt-20 sm:pt-32 pb-10 sm:pb-16">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16">
            <div className="max-w-xl mx-auto mb-16 sm:mb-20 text-center">
              <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#2f6f78] block mb-3">
                КАТАЛОГ
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide text-[#2c211b] uppercase">
                ВСЕ ТОВАРЫ
              </h1>
              <div className="w-16 h-0.5 bg-[#2f6f78] mx-auto mt-4" />
            </div>
            <ProductGrid products={result.products} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
