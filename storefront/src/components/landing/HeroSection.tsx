"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { previousPathname, stripLocalePrefix } from "@/components/navigation/pathname-history";
import { CharReveal } from "./char-reveal";
import { ArrowRightIcon } from "./icons";

export function HeroSection() {
  const t = useTranslations("home");
  const pathname = usePathname();
  const playIntroAnimation =
    !previousPathname ||
    stripLocalePrefix(previousPathname) !== stripLocalePrefix(pathname);

  return (
    <section className="relative min-h-[350px] lg:min-h-[440px] flex flex-col bg-[#f4ebe6] overflow-hidden">
      {/* Hero Contents */}
      <div className="relative flex-1 flex items-center pt-10 md:pt-16 pb-10 sm:pb-16">
        {/* Background Image / Split Layout - constrained to hero top-half/side */}
        <motion.div
          initial={playIntroAnimation ? { opacity: 0, scale: 1.08 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-y-0 right-0 w-full md:w-[54%] h-full overflow-hidden"
        >
          <div className="hidden md:block absolute inset-y-0 left-0 w-[15%] bg-gradient-to-r from-[#f4ebe6] to-transparent md:-left-2 z-10" />
          <div 
            role="img"
            aria-label="Warm beach editorial sunglasses and premium chain with sea beads" 
            className="w-full h-full bg-cover bg-[position:20%_center]"
            style={{ backgroundImage: "url('/images/hero-wide.webp')" }}
          />
        </motion.div>
        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16 z-20 w-full">
          <motion.div 
            initial={playIntroAnimation ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl flex flex-col items-start gap-6 sm:gap-8 bg-[#2c211b]/50 backdrop-blur-md border border-white/15 p-6 sm:p-8 md:p-0 md:bg-transparent md:backdrop-blur-none md:border-none shadow-[0_20px_60px_rgba(44,33,27,0.18)] md:shadow-none"
          >
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light tracking-wide leading-[1.1] text-[#f4ebe6] md:text-[#2c211b] [text-shadow:0_1px_2px_rgba(44,33,27,0.45)] md:[text-shadow:none] w-full">
              <CharReveal
                text={t("hero.title1")}
                stagger={0.018}
                delay={0}
                y={0}
                duration={0.35}
                playAnimation={playIntroAnimation}
              />
              <br />
              <CharReveal
                text={t("hero.title2")}
                stagger={0.018}
                delay={0.14}
                y={0}
                duration={0.35}
                playAnimation={playIntroAnimation}
              />
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-[#f4ebe6]/90 md:text-[#2c211b]/80 [text-shadow:0_1px_2px_rgba(44,33,27,0.45)] md:[text-shadow:none] max-w-md w-full">
              <CharReveal
                text={t("hero.subtitle1")}
                stagger={0.01}
                delay={0.35}
                y={0}
                duration={0.28}
                playAnimation={playIntroAnimation}
              />
              <br className="hidden sm:inline" />
              <CharReveal
                text={t("hero.subtitle2")}
                stagger={0.01}
                delay={0.45}
                y={0}
                duration={0.28}
                playAnimation={playIntroAnimation}
              />
            </p>
            <motion.a 
              initial={playIntroAnimation ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href="#collection"
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-[#5a3828] text-white hover:bg-[#2c211b] text-xs font-medium tracking-widest uppercase transition-all duration-300 shadow-md hover:shadow-lg hover:translate-y-[-2px] group"
            >
              {t("hero.cta")}
              <ArrowRightIcon className="w-4 h-4 ml-3 group-hover:translate-x-1.5 transition-transform" />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
