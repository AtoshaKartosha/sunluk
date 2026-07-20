"use client";
import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEntrance } from "./use-entrance";

export function AboutSection() {
  const t = useTranslations("home");
  const animate = useEntrance();
  const [split, setSplit] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback((clientX: number) => {
    const el = sliderRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const relX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSplit((relX / rect.width) * 100);
  }, []);

  return (
    <section className="relative min-h-[500px] grid grid-cols-1 lg:grid-cols-2 bg-background overflow-hidden">
      {/* Left packaging/beach image */}
      <motion.div 
        ref={sliderRef}
        role="img"
        aria-label={t("features.sliderAria")}
        initial={animate ? { opacity: 0, scale: 0.95 } : false}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="relative h-64 lg:h-auto overflow-hidden bg-background cursor-ew-resize touch-none select-none"
        onMouseMove={(e) => handlePointerMove(e.clientX)}
        onTouchMove={(e) => e.touches[0] && handlePointerMove(e.touches[0].clientX)}
      >
        <Image
          src="/images/sunluk_slider_02.webp"
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="absolute inset-0 object-cover object-center"
        />
        <Image
          src="/images/sunluk_slider_01.webp"
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="absolute inset-0 object-cover object-center"
          style={{
            clipPath: `inset(0 ${100 - split}% 0 0)`,
            WebkitClipPath: `inset(0 ${100 - split}% 0 0)`,
          }}
        />
        {split > 0 && split < 100 && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-10"
            style={{
              left: `${split}%`,
              transform: "translateX(-50%)",
              width: "160px",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              maskImage: "linear-gradient(to right, transparent, black, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black, transparent)",
            }}
          />
        )}
      </motion.div>
      {/* Right text and button */}
      <div className="bg-background py-2.5 px-8 sm:px-16 lg:px-24 flex flex-col justify-center items-start gap-6 lg:border-l lg:border-[#2c211b]/5">
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
