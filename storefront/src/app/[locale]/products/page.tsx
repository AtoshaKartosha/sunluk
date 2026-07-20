import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { resolveRegion } from "@/lib/medusa/regions";
import { listProducts } from "@/lib/medusa/products";
import { ProductGrid } from "@/components/product";
import SiteHeader from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import type { Locale } from "@/i18n/routing";
import { toMedusaLocale } from "@/i18n/routing";
import { getNavLinks, getFooterGroups, getCopyright } from "@/lib/landing-data";
import type { Metadata } from "next";
import { buildRouteMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });
  return buildRouteMetadata({
    locale: locale as Locale,
    route: "products",
    title: t("pageTitle"),
    description: t("pageDescription"),
  });
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
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-0.5 bg-[#2f6f78] mx-auto mb-6" />
          <h1 className="font-serif text-2xl font-light tracking-wide mb-4">
            {heading}
          </h1>
          <p className="text-sm text-[#2c211b]/60">
            {description.replace("{countryCode}", countryCode.toUpperCase())}
          </p>
        </div>
      </div>
      <SiteFooter
        locale={locale}
        footerGroups={chrome.footerGroups}
        copyright={chrome.copyright}
      />
    </div>
  );
}

function CatalogError({
  locale,
  heading,
  description,
  retryLabel,
}: {
  locale: Locale;
  heading: string;
  description: string;
  retryLabel: string;
}) {
  const chrome = getPageChrome(locale);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b]">
      <SiteHeader navLinks={chrome.navLinks} />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-0.5 bg-[#2f6f78] mx-auto mb-6" />
          <h1 className="font-serif text-2xl font-light tracking-wide mb-4">
            {heading}
          </h1>
          <p className="text-sm text-[#2c211b]/60 mb-6">{description}</p>
          <Link
            href={`/${locale}/products`}
            className="inline-flex items-center px-8 py-3 border-2 border-[#2c211b] text-[#2c211b] hover:bg-[#2c211b] hover:text-white text-xs font-medium tracking-widest uppercase transition-all duration-300"
          >
            {retryLabel}
          </Link>
        </div>
      </div>
      <SiteFooter
        locale={locale}
        footerGroups={chrome.footerGroups}
        copyright={chrome.copyright}
      />
    </div>
  );
}

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params;
  const resolvedLocale = locale as Locale;
  const medusaLocale = toMedusaLocale(resolvedLocale);
  const t = await getTranslations({ locale, namespace: "catalog" });
  let region;
  try {
    region = await resolveRegion(undefined, medusaLocale);
  } catch {
    return (
      <CatalogError
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

  let result;
  try {
    result = await listProducts(region, medusaLocale);
  } catch {
    return (
      <CatalogError
        locale={resolvedLocale}
        heading={t("errorHeading")}
        description={t("errorDesc")}
        retryLabel={t("retry")}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b]">
      <SiteHeader navLinks={getNavLinks(resolvedLocale)} />
      <div className="flex-1">
        <section className="pt-8 sm:pt-16 pb-10 sm:pb-16">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16">
            <div className="max-w-xl mx-auto mb-16 sm:mb-20 text-center">
              <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#2f6f78] block mb-3">
                {t("breadcrumb")}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide text-[#2c211b] uppercase">
                {t("heading")}
              </h1>
              <div className="w-16 h-0.5 bg-[#2f6f78] mx-auto mt-4" />
            </div>
            <ProductGrid
              products={result.products}
              emptyMessage={t("empty")}
              locale={resolvedLocale}
            />
          </div>
        </section>
      </div>
      <SiteFooter
        locale={resolvedLocale}
        footerGroups={getFooterGroups(resolvedLocale)}
        copyright={getCopyright(resolvedLocale)}
      />
    </div>
  );
}
