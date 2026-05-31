import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { resolveRegion } from "@/lib/medusa/regions";
import { getProduct } from "@/lib/medusa/products";
import type { ProductDetail } from "@/lib/medusa/products";
import type { CalculatedPrice, ProductInfoBlockLabels } from "@/components/product";
import {
  ProductGallery,
  ProductInfoBlock,
  LocaleSwitcher,
} from "@/components/product";
import SiteHeader from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import type { Locale } from "@/i18n/routing";
import { toMedusaLocale } from "@/i18n/routing";
import { getNavLinks, getFooterGroups, getCopyright } from "@/lib/landing-data";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ locale: string; handle: string }>;
}

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

function getPageChrome(locale: Locale) {
  return {
    navLinks: getNavLinks(locale),
    footerGroups: getFooterGroups(locale),
    copyright: getCopyright(locale),
  };
}

function UnsupportedRegion({
  locale,
  countryCode,
  heading,
  description,
}: {
  locale: Locale;
  countryCode: string;
  heading: string;
  description: string;
}) {
  const chrome = getPageChrome(locale);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b]">
      <SiteHeader navLinks={chrome.navLinks} />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-0.5 bg-[#2f6f78] mx-auto mb-6" />
          <h2 className="font-serif text-2xl font-light tracking-wide mb-4">
            {heading}
          </h2>
          <p className="text-sm text-[#2c211b]/60">
            {description.replace("{countryCode}", countryCode.toUpperCase())}
          </p>
        </div>
      </main>
      <SiteFooter
        footerGroups={chrome.footerGroups}
        copyright={chrome.copyright}
      />
    </div>
  );
}

function ProductDetailState({
  locale,
  heading,
  description,
  retryLabel,
}: {
  locale: Locale;
  heading: string;
  description: string;
  retryLabel?: string;
}) {
  const chrome = getPageChrome(locale);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b]">
      <SiteHeader navLinks={chrome.navLinks} />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-0.5 bg-[#2f6f78] mx-auto mb-6" />
          <h2 className="font-serif text-2xl font-light tracking-wide mb-4">
            {heading}
          </h2>
          <p className="text-sm text-[#2c211b]/60">{description}</p>
          {retryLabel && (
            <Link
              href={`/${locale}/products`}
              className="inline-flex items-center mt-6 px-8 py-3 border-2 border-[#2c211b] text-[#2c211b] hover:bg-[#2c211b] hover:text-white text-xs font-medium tracking-widest uppercase transition-all duration-300"
            >
              {retryLabel}
            </Link>
          )}
        </div>
      </main>
      <SiteFooter
        footerGroups={chrome.footerGroups}
        copyright={chrome.copyright}
      />
    </div>
  );
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, handle } = await params;
  const resolvedLocale = locale as Locale;
  const medusaLocale = toMedusaLocale(resolvedLocale);
  const t = await getTranslations({ locale, namespace: "catalog" });
  let region;
  try {
    region = await resolveRegion(undefined, medusaLocale);
  } catch {
    return (
      <ProductDetailState
        locale={resolvedLocale}
        heading={t("errorHeading")}
        description={t("errorDesc")}
        retryLabel={t("retry")}
      />
    );
  }

  if ("type" in region) {
    return (
      <UnsupportedRegion
        locale={resolvedLocale}
        countryCode={region.countryCode}
        heading={t("regionUnsupported")}
        description={t("regionUnsupportedDesc")}
      />
    );
  }

  let product;
  try {
    product = await getProduct(handle, region, medusaLocale);
  } catch {
    return (
      <ProductDetailState
        locale={resolvedLocale}
        heading={t("errorHeading")}
        description={t("errorDesc")}
        retryLabel={t("retry")}
      />
    );
  }

  if (!product) {
    return (
      <ProductDetailState
        locale={resolvedLocale}
        heading={t("notFound")}
        description={t("notFoundDesc")}
        retryLabel={t("backToCatalog")}
      />
    );
  }

  const price = cheapestPrice(product);

  const pt = await getTranslations({ locale, namespace: "product" });
  const productLabels: ProductInfoBlockLabels = {
    brand: pt("brand"),
    vatIncluded: pt("vatIncluded"),
    handmade: pt("handmade"),
    delivery: pt("delivery"),
    giftWrap: pt("giftWrap"),
    materialsHeading: pt("materialsHeading"),
    materialsText: pt("materialsText"),
    materialsItem1: pt("materialsItem1"),
    materialsItem2: pt("materialsItem2"),
    materialsItem3: pt("materialsItem3"),
    materialsCare: pt("materialsCare"),
    shippingHeading: pt("shippingHeading"),
    shippingText: pt("shippingText"),
    shippingItem1: pt("shippingItem1"),
    shippingItem2: pt("shippingItem2"),
    shippingItem3: pt("shippingItem3"),
    shippingItem4: pt("shippingItem4"),
    materialNames: {
      turquoise: pt("turquoise"),
      leather: pt("leather"),
      silver: pt("silver"),
      "gold-plated": pt("gold-plated"),
      Turquoise: pt("turquoise"),
      Leather: pt("leather"),
      Silver: pt("silver"),
      "Gold-plated": pt("gold-plated"),
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b]">
      <SiteHeader navLinks={getNavLinks(resolvedLocale)} />
      <main className="flex-1">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16 pt-4 flex justify-end">
          <LocaleSwitcher />
        </div>
        <section className="pt-8 sm:pt-16 pb-16">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-[42%_1fr] gap-12 lg:gap-20 items-start">
              <div className="w-full max-w-[460px] sm:max-w-[500px] mx-auto lg:mx-0">
                <ProductGallery
                  images={product.images}
                  thumbnail={product.thumbnail}
                  title={product.title}
                />
              </div>

              <ProductInfoBlock product={product} price={price} labels={productLabels} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter
        footerGroups={getFooterGroups(resolvedLocale)}
        copyright={getCopyright(resolvedLocale)}
      />
    </div>
  );
}
