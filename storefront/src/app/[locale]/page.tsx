import { AboutSection } from "@/components/landing/AboutSection";
import { CollectionSection } from "@/components/landing/CollectionSection";
import { EditorialSection } from "@/components/landing/EditorialSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HeroSection } from "@/components/landing/HeroSection";
import NewsletterSection from "@/components/landing/NewsletterSection";
import { SiteFooter } from "@/components/landing/SiteFooter";
import SiteHeader from "@/components/landing/SiteHeader";
import { LocaleSwitcher } from "@/components/product";
import { getNavLinks, getFooterGroups, getCopyright } from "@/lib/landing-data";
import type { Locale } from "@/i18n/routing";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const loc = locale as Locale;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b] antialiased selection:bg-[#2f6f78] selection:text-white">
      <SiteHeader navLinks={getNavLinks(loc)} />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16 pt-4 flex justify-end">
        <LocaleSwitcher />
      </div>
      <HeroSection />
      <EditorialSection />
      <CollectionSection locale={loc} />
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
