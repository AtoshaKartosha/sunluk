"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { previousPathname, stripLocalePrefix } from "@/components/navigation/pathname-history";
import type { Locale } from "@/i18n/routing";
import { CharReveal } from "./char-reveal";
import { ArrowRightIcon } from "./icons";
import { useEntrance } from "./use-entrance";

const MotionLink = motion.create(Link);

interface HeroSectionProps {
  locale: Locale;
}
export function HeroSection({ locale }: HeroSectionProps) {
  const t = useTranslations("home");
  const pathname = usePathname();
  const playIntroAnimation =
    !previousPathname ||
    stripLocalePrefix(previousPathname) !== stripLocalePrefix(pathname);
  const animate = useEntrance();
  const intro = animate && playIntroAnimation;

  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    "/images/sunluk_main.webp",
    "/images/sunluk_main_2.webp",
    "/images/sunluk_main_3.webp",
    "/images/sunluk_main_4.webp",
    "/images/sunluk_main_5.webp",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="relative flex flex-col overflow-hidden bg-background md:min-h-[350px] lg:min-h-[440px]">
      {/* Hero Contents */}
      <div className="relative flex flex-col pb-2.5 md:flex-1 md:items-center md:pt-16">
        {/* Hero video / split layout */}
        <motion.div
          initial={intro ? { opacity: 0, scale: 1.08 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative aspect-[4/3] w-full overflow-hidden md:absolute md:inset-y-0 md:right-0 md:h-full md:w-[52%] md:aspect-auto md:overflow-visible"
        >
          <div 
            onClick={handleNextSlide}
            className="absolute inset-0 overflow-hidden cursor-pointer"
          >
            {slides.map((src, index) => {
              const getTranslateClass = () => {
                if (index === 0) return "translate-y-[10%]";
                if (index === 2) return "translate-y-[15%]";
                if (index === 3) return "translate-y-[15%]";
                return "";
              };
              return (
                <Image
                  key={src}
                  src={src}
                  alt={`SUNLUK hero slide ${index + 1}`}
                  fill
                  priority={index === 0}
                  sizes="(min-width: 768px) 52vw, 100vw"
                  className={`absolute inset-0 h-full w-full object-cover object-right-bottom scale-[1.30] origin-bottom-right transition-opacity duration-1000 ease-in-out ${getTranslateClass()} ${
                    currentSlide === index ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
                />
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-y-0 -left-16 z-10 hidden w-[38%] bg-[linear-gradient(to_right,var(--color-background)_0%,var(--color-background)_55%,transparent_100%)] backdrop-blur-md [mask-image:linear-gradient(to_right,black_0%,black_55%,transparent_100%)] md:block" />
        </motion.div>
        <div className="relative z-20 mx-auto w-full max-w-[1600px] px-4 py-8 pointer-events-none sm:px-10 md:py-0 lg:px-16">
          <motion.div 
            initial={intro ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex w-full max-w-xl flex-col items-start gap-6 pointer-events-auto sm:gap-8 md:max-w-2xl lg:max-w-3xl"
          >
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-wide leading-[1.1] text-[#2c211b] w-full">
              <CharReveal
                text={t("hero.title1")}
                className="whitespace-nowrap"
                stagger={0.018}
                delay={0}
                y={0}
                duration={0.35}
                playAnimation={intro}
              />
              <br />
              <CharReveal
                text={t("hero.title2")}
                className="whitespace-nowrap"
                stagger={0.018}
                delay={0.14}
                y={0}
                duration={0.35}
                playAnimation={intro}
              />
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-[#2c211b]/80 max-w-md w-full">
              <CharReveal
                text={t("hero.subtitle1")}
                stagger={0.01}
                delay={0.35}
                y={0}
                duration={0.28}
                playAnimation={intro}
              />
              <br className="hidden sm:inline" />
              {" "}
              <CharReveal
                text={t("hero.subtitle2")}
                stagger={0.01}
                delay={0.45}
                y={0}
                duration={0.28}
                playAnimation={intro}
              />
            </p>
            <MotionLink
              initial={intro ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={`/${locale}/products`}
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-[#5a3828] text-white hover:bg-[#2c211b] text-xs font-medium tracking-widest uppercase transition-all duration-300 shadow-md hover:shadow-lg hover:translate-y-[-2px] group"
            >
              {t("hero.cta")}
              <ArrowRightIcon className="w-4 h-4 ml-3 group-hover:translate-x-1.5 transition-transform" />
            </MotionLink>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
