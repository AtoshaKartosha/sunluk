"use client";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function AboutSection() {
  const t = useTranslations("home");

  return (
    <section className="relative min-h-[500px] grid grid-cols-1 lg:grid-cols-2 bg-[#f4ebe6] overflow-hidden">
      {/* Left packaging/beach image */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="relative h-64 lg:h-auto overflow-hidden bg-[#f4ebe6]"
      >
        <div 
          role="img"
          aria-label={t("about.imageAria")} 
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: "url('/images/about-packaging.webp')" }}
        />
      </motion.div>
      {/* Right text and button */}
      <div className="bg-[#f4ebe6] py-20 px-8 sm:px-16 lg:px-24 flex flex-col justify-center items-start gap-6 border-l border-[#2c211b]/5">
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
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
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center px-10 py-4 bg-[#5a3828] text-white hover:bg-[#2c211b] text-xs font-medium tracking-widest uppercase transition-all duration-300 shadow-md hover:shadow-lg mt-4 rounded-none cursor-pointer"
          >
            {t("about.cta")}
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
