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
    <section id="collection" className="pt-20 sm:pt-32 pb-10 sm:pb-16 bg-[#f4ebe6]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-xl mx-auto mb-16 sm:mb-20"
        >
          <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#2f6f78] block mb-3">
            {t("collectionLabel")}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide text-[#2c211b] uppercase">
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
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
        >
          {PRODUCTS.map((product, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 15 } },
              }}
              className="group flex flex-col text-left bg-transparent transition-all duration-300"
            >
              <div className="aspect-[4/5] overflow-hidden bg-[#f4ebe6] mb-5 rounded-none relative">
                <div
                  role="img"
                  aria-label={product.ariaLabel}
                  className="w-full h-full bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                  style={{ backgroundImage: `url('${product.image}')` }}
                />
              </div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-serif text-lg font-bold text-[#2c211b]">{product.title}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-3 h-3 rounded-full ${product.colorDot} border border-white shadow-inner`} />
                  <span className="text-[10px] tracking-wide text-[#2c211b]/60 font-semibold">{product.material}</span>
                </div>
              </div>
              <p className="text-xs text-[#2c211b]/70 font-medium">{product.description}</p>
            </motion.div>
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
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
