import { resolveRegion } from "@/lib/medusa/regions";
import { listProducts } from "@/lib/medusa/products";
import { toMedusaLocale } from "@/i18n/routing";
import type { StoreProduct } from "@/components/product";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildRouteMetadata, absoluteUrl, routePath, safeJsonLd, siteOrigin } from "@/lib/seo";

export const dynamic = "force-dynamic";
import { AboutSection } from "@/components/landing/AboutSection";
import { CollectionSection } from "@/components/landing/CollectionSection";
import { ContactsSection } from "@/components/landing/ContactsSection";
import { EditorialSection } from "@/components/landing/EditorialSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HeroSection } from "@/components/landing/HeroSection";
import NewsletterSection from "@/components/landing/NewsletterSection";
import { SiteFooter } from "@/components/landing/SiteFooter";
import SiteHeader from "@/components/landing/SiteHeader";
import { getNavLinks, getFooterGroups, getCopyright } from "@/lib/landing-data";
import type { Locale } from "@/i18n/routing";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return buildRouteMetadata({
    locale: locale as Locale,
    route: "home",
    title: t("title"),
    description: t("description"),
  });
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const loc = locale as Locale;
  const medusaLocale = toMedusaLocale(loc);

  let products: StoreProduct[] = [];
  try {
    const region = await resolveRegion(undefined, medusaLocale);
    if (region && !("type" in region)) {
      const result = await listProducts(region, medusaLocale);
      products = (result.products as (import("@/lib/medusa/products").ProductListItem & { created_at?: string })[])
        .sort(
          (a, b) =>
            new Date(b.created_at || "").getTime() -
            new Date(a.created_at || "").getTime()
        )
        .slice(0, 4) as unknown as StoreProduct[];
    }
  } catch (error) {
    console.error("Error fetching homepage products:", error);
  }

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SUNLUK",
    url: siteOrigin(),
  };
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SUNLUK",
    url: absoluteUrl(routePath(loc, "home")),
    inLanguage: loc === "ru" ? "ru-RU" : "en-US",
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-[#2c211b] antialiased selection:bg-[#2f6f78] selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(siteJsonLd) }}
      />
      <SiteHeader navLinks={getNavLinks(loc, true)} />
      <HeroSection />
      <EditorialSection />
      <CollectionSection locale={loc} products={products} />
      <FeaturesSection />
      <AboutSection />
      <ContactsSection />
      <NewsletterSection />
      <SiteFooter
        footerGroups={getFooterGroups(loc)}
        copyright={getCopyright(loc)}
      />
    </div>
  );
}
