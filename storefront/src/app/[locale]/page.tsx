import { resolveRegion } from "@/lib/medusa/regions";
import { listProducts } from "@/lib/medusa/products";
import { toMedusaLocale } from "@/i18n/routing";
import type { StoreProduct } from "@/components/product";

export const dynamic = "force-dynamic";
import { AboutSection } from "@/components/landing/AboutSection";
import { CollectionSection } from "@/components/landing/CollectionSection";
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

  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b] antialiased selection:bg-[#2f6f78] selection:text-white">
      <SiteHeader navLinks={getNavLinks(loc)} />
      <HeroSection />
      <EditorialSection />
      <CollectionSection locale={loc} products={products} />
      <FeaturesSection />
      <AboutSection />
      <NewsletterSection />
      <SiteFooter
        footerGroups={getFooterGroups(loc)}
        copyright={getCopyright(loc)}
      />
    </div>
  );
}
