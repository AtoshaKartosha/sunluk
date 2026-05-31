import { AboutSection } from "@/components/landing/AboutSection";
import { CollectionSection } from "@/components/landing/CollectionSection";
import { EditorialSection } from "@/components/landing/EditorialSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HeroSection } from "@/components/landing/HeroSection";
import NewsletterSection from "@/components/landing/NewsletterSection";
import { SiteFooter } from "@/components/landing/SiteFooter";
import SiteHeader from "@/components/landing/SiteHeader";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b] antialiased selection:bg-[#2f6f78] selection:text-white">
      <SiteHeader />
      <HeroSection />
      <EditorialSection />
      <CollectionSection />
      <FeaturesSection />
      <AboutSection />
      <NewsletterSection />
      <SiteFooter />
    </div>
  );
}
