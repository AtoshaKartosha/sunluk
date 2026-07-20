"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEntrance } from "./use-entrance";

export function AboutSection() {
  const t = useTranslations("home");
  const animate = useEntrance();

  return (
    <section className="relative min-h-[500px] grid grid-cols-1 lg:grid-cols-2 bg-background overflow-hidden">
      {/* Left packaging/beach image */}
      <motion.div 
        role="img"
        aria-label={t("features.sliderAria")}
        initial={animate ? { opacity: 0, scale: 0.95 } : false}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="group relative h-64 lg:h-auto overflow-hidden bg-background rounded-none cursor-pointer"
      >
        <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105">
          <Image
            src="/images/sunluk_slider_01.webp"
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="absolute inset-0 object-cover object-left scale-[1.15] origin-left"
          />
          <Image
            src="/images/sunluk_slider_02.webp"
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="absolute inset-0 object-cover object-center opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
          />
        </div>
      </motion.div>
      {/* Right text and button */}
      <div className="bg-background py-2.5 px-8 sm:px-16 lg:px-24 flex flex-col justify-center items-start gap-6">
        <motion.div 
          initial={animate ? { opacity: 0, x: 30 } : false}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-start gap-6 lg:-translate-y-12"
        >
          <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#2f6f78]">
            {t("about.label")}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide text-[#2c211b] uppercase">
            {t("about.heading")}
          </h2>
          <p className="text-base sm:text-lg leading-relaxed text-[#2c211b]/80 max-w-lg">
            {t("about.description")}
          </p>
          <motion.a
            href="#collection"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center px-10 py-4 bg-[#5a3828] text-white hover:bg-[#2c211b] text-xs font-medium tracking-widest uppercase transition-all duration-300 shadow-md hover:shadow-lg mt-4 rounded-none cursor-pointer"
          >
            {t("about.cta")}
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
