import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveRegion } from "@/lib/medusa/regions";
import { getProduct, listRelatedProducts, listPackagingProducts } from "@/lib/medusa/products";
import type { ProductDetail } from "@/lib/medusa/products";
import {
  projectVariant,
  cheapestVariantPrice,
  type VariantProjection,
} from "@/lib/price";
import type { ProductInfoBlockLabels } from "@/components/product";
import {
  ProductGallery,
  ProductInfoBlock,
  ProductBreadcrumb,
  ProductRelatedProducts,
  ProductJsonLd,
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

// ---- generateMetadata ----

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale, handle } = await params;
  const resolvedLocale = locale as Locale;
  const medusaLocale = toMedusaLocale(resolvedLocale);

  let region;
  try {
    region = await resolveRegion(undefined, medusaLocale);
  } catch {
    return { title: "Product" };
  }

  if ("type" in region) {
    return { title: "Product" };
  }

  let product: ProductDetail | null = null;
  try {
    product = await getProduct(handle, region, medusaLocale);
  } catch {
    // metadata is best-effort; fall through
  }

  if (!product) {
    return { title: "Product Not Found" };
  }

  const projection = projectVariant(
    product.variants,
    product.options,
  );

  const priceText = projection.price
    ? `${projection.price.calculated_amount} ${projection.price.currency_code.toUpperCase()}`
    : "";

  const title = priceText
    ? `${product.title} — ${priceText}`
    : product.title;

  return {
    title,
    description: product.description ?? product.title,
    openGraph: {
      title: product.title,
      description: product.description ?? undefined,
      images: product.thumbnail
        ? [{ url: product.thumbnail }]
        : product.images?.[0]?.url
          ? [{ url: product.images[0].url }]
          : undefined,
    },
  };
}

// ---- Page chrome helpers ----

function getPageChrome(locale: Locale) {
  return {
    navLinks: getNavLinks(locale),
    footerGroups: getFooterGroups(locale),
    copyright: getCopyright(locale),
  };
}

// ---- Sub-renderers ----

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
        locale={locale}
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
        locale={locale}
        footerGroups={chrome.footerGroups}
        copyright={chrome.copyright}
      />
    </div>
  );
}

// ---- Main page component ----

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

  // ---- Data projections ----

  const projection: VariantProjection = projectVariant(
    product.variants,
    product.options,
  );

  // Fallback headline price from cheapest variant when no projection resolves.
  const headlinePrice = projection.price ?? cheapestVariantPrice(product.variants);

  // Related products (best-effort; failure is silent).
  let relatedProducts: ProductDetail[] = [];
  try {
    relatedProducts = (await listRelatedProducts(
      region,
      handle,
      medusaLocale,
      4,
    )) as ProductDetail[];
  } catch {
    // safe to leave empty
  }

  // Packaging products (best-effort; failure is silent).
  let packagingProducts: ProductDetail[] = [];
  try {
    packagingProducts = await listPackagingProducts(region, medusaLocale);
  } catch {
    // safe to leave empty
  }

  // Tag-based packaging filter
  const productTags = product.tags?.map((t) => t.value) ?? [];
  const matchedPackaging = packagingProducts.filter((p) => productTags.includes(p.handle));
  const allowedPackaging = matchedPackaging.length > 0 ? matchedPackaging : packagingProducts;

  // ---- Labels ----

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
    variantSelector: {
      selectAllOptions: pt("selectAllOptions"),
      unavailable: pt("unavailable"),
      outOfStock: pt("outOfStock"),
      preOrder: pt("preOrder"),
      invalidQuantity: pt("invalidQuantity"),
      addToCart: pt("addToCart"),
      quantity: pt("quantity"),
      decreaseQuantity: pt("decreaseQuantity"),
      increaseQuantity: pt("increaseQuantity"),
      price: pt("price"),
      cost: pt("cost"),
      inStock: pt("inStock"),
      lowStock: pt("lowStock"),
      backorderAvailable: pt("backorderAvailable"),
      notAvailable: pt("notAvailable"),
      deliveryPromise: pt("deliveryPromise"),
      adding: pt("adding"),
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
    },
    breadcrumbCatalog: pt("breadcrumbCatalog"),
    socialProof: {
      heading: pt("socialHeading"),
      placeholder: pt("socialPlaceholder"),
    },
    factsHeading: pt("factsHeading"),
    packagingHeading: pt("packaging.heading"),
    packagingNone: pt("packaging.none"),
    packagingFree: pt("packaging.free"),
    packagingOutOfStock: pt("packaging.outOfStock"),
  };

  // ---- Render ----

  const canonicalUrl = `https://sunluk.com/${resolvedLocale}/products/${handle}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b]">
      {/* JSON-LD in head-adjacent position */}
      <ProductJsonLd
        title={product.title}
        description={product.description}
        imageUrl={product.thumbnail ?? product.images?.[0]?.url ?? null}
        projection={projection}
        url={canonicalUrl}
      />

      <SiteHeader navLinks={getNavLinks(resolvedLocale)} />
      <main className="flex-1">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16 pt-4">
          <ProductBreadcrumb
            title={product.title}
            locale={resolvedLocale}
            catalogLabel={pt("breadcrumbCatalog")}
          />
        </div>
        <section className="pt-4 sm:pt-8 pb-16">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-[42%_1fr] gap-12 lg:gap-20 items-start">
              <div className="w-full max-w-[460px] sm:max-w-[500px] mx-auto lg:mx-0">
                <ProductGallery
                  images={product.images}
                  thumbnail={product.thumbnail}
                  title={product.title}
                />
              </div>

              <ProductInfoBlock
                product={product}
                price={headlinePrice}
                labels={productLabels}
                packagingProducts={allowedPackaging}
              />
            </div>

            {/* Related products */}
            <ProductRelatedProducts
              products={relatedProducts}
              locale={resolvedLocale}
              heading={pt("relatedHeading")}
            />
          </div>
        </section>
      </main>
      <SiteFooter
        locale={resolvedLocale}
        footerGroups={getFooterGroups(resolvedLocale)}
        copyright={getCopyright(resolvedLocale)}
      />
    </div>
  );
}
