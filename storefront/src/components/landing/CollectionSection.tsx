"use client";

import { PRODUCTS } from "@/lib/landing-data";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Locale } from "@/i18n/routing";

interface CollectionSectionProps {
  locale: Locale;
}

export function CollectionSection({ locale }: CollectionSectionProps) {
  const t = useTranslations("home");

  return (
    <section id="collection" className="pt-8 sm:pt-32 pb-10 sm:pb-16 bg-[#f4ebe6]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-xl mx-auto mb-8 sm:mb-20"
        >
          <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#2f6f78] block mb-3">
            {t("collectionLabel")}
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-light tracking-wide text-[#2c211b] uppercase">
            {t("collectionHeading")}
          </h2>
          <div className="w-16 h-0.5 bg-[#2f6f78] mx-auto mt-4" />
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-6 sm:gap-8 mb-10 sm:mb-16"
        >
          {PRODUCTS.map((product, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { duration: 0.6 } },
              }}
              className="group flex flex-col text-left bg-transparent transition-all duration-300"
            >
              <div className="aspect-[4/5] overflow-hidden bg-[#f4ebe6] mb-3 sm:mb-5 rounded-none relative">
                <div
                  role="img"
                  aria-label={t(`collection.products.${i}.title`)}
                  className="w-full h-full bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                  style={{ backgroundImage: `url('${product.image}')` }}
                />
              </div>
              <h3 className="font-serif text-xs sm:text-lg font-bold text-[#2c211b] mb-2">
                {t(`collection.products.${i}.title`)}
              </h3>
              <p className="text-[9px] sm:text-xs text-[#2c211b]/70 font-medium">
                {t(`collection.products.${i}.description`)}
              </p>
            </motion.div>
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 sm:px-0"
        >
          <Link
            href={`/${locale}/products`}
            className="inline-flex items-center justify-center px-10 py-4 border-2 border-[#2c211b] text-[#2c211b] hover:bg-[#2c211b] hover:text-white text-xs font-medium tracking-widest uppercase transition-all duration-300 rounded-none"
          >
            {t("collectionCta")}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
