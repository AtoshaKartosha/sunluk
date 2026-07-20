"use client";
import { FEATURES, FEATURE_BORDER_CLASSES } from "@/lib/landing-data";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { GemIcon, LeafIcon, ModulesIcon, ShieldIcon } from "./icons";


export function FeaturesSection() {
  const t = useTranslations("home");

  // Map features with translated titles/descriptions but keep icons
  const localizedFeatures = FEATURES.map((feature, i) => ({
    ...feature,
    title: t(`features.list.${i}.title`),
    description: t(`features.list.${i}.description`),
  }));

  return (
    <section id="about" className="bg-background pt-2.5 pb-2.5 overflow-hidden">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="order-2 grid grid-cols-1 sm:grid-cols-2 lg:order-1"
          >
            {localizedFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { duration: 0.6 } }
                }}
                className={`${FEATURE_BORDER_CLASSES[i]} flex items-start gap-3 p-5 text-left sm:gap-6 sm:p-8 lg:py-12 ${
                  i % 2 === 1 ? "lg:pl-8 lg:pr-0" : "lg:pl-0 lg:pr-8"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center text-[#2c211b] sm:h-16 sm:w-16">
                  {feature.icon === "S" ? (
                    <span className="font-serif text-4xl font-light leading-none sm:text-6xl">S</span>
                  ) : feature.icon === "gem" ? (
                    <GemIcon className="h-7 w-7 sm:h-12 sm:w-12" />
                  ) : feature.icon === "leaf" ? (
                    <LeafIcon className="h-7 w-7 sm:h-12 sm:w-12" />
                  ) : feature.icon === "modules" ? (
                    <ModulesIcon className="h-7 w-7 sm:h-12 sm:w-12" />
                  ) : (
                    <ShieldIcon className="h-7 w-7 sm:h-12 sm:w-12" />
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-1 sm:gap-1.5">
                  <h3 className="font-serif text-sm font-bold leading-tight text-[#2c211b] sm:text-lg">
                    {feature.title}
                  </h3>
                  <p className="text-xs leading-tight text-[#2c211b]/70 sm:text-sm sm:leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="order-1 flex flex-col items-start gap-6 lg:order-2 lg:pt-12"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#2f6f78]">
              {t("features.philosophy")}
            </span>
            <h2 className="font-serif text-4xl font-light leading-[1.15] tracking-wide text-[#2c211b] sm:text-5xl">
              {t("features.heading")}
            </h2>
            <p className="text-base leading-relaxed text-[#2c211b]/80 sm:text-lg">
              {t("features.description")}
            </p>
            <div className="mt-2 h-0.5 w-20 bg-[#2c211b]/20" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
