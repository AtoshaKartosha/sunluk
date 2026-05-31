"use client";

import { FEATURES, FEATURE_BORDER_CLASSES } from "@/lib/landing-data";

import { motion } from "framer-motion";
import { GemIcon, LeafIcon, ShieldIcon } from "./icons";

export function FeaturesSection() {
  return (
    <section className="pt-10 sm:pt-16 pb-20 sm:pb-32 bg-[#f4ebe6]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left 2x2 grid */}
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
            className="grid grid-cols-1 sm:grid-cols-2 gap-0"
          >
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 15 } }
                }}
                className={`${FEATURE_BORDER_CLASSES[i]} p-8 sm:p-12 flex items-start gap-6`}
              >
                <div className="w-16 h-16 shrink-0 flex items-center justify-center text-[#2c211b]">
                  {feature.icon === "S" ? (
                    <span className="font-serif text-5xl sm:text-6xl font-light leading-none">S</span>
                  ) : feature.icon === "gem" ? (
                    <GemIcon className="w-12 h-12" />
                  ) : feature.icon === "leaf" ? (
                    <LeafIcon className="w-12 h-12" />
                  ) : (
                    <ShieldIcon className="w-12 h-12" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-serif text-lg font-bold text-[#2c211b]">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-[#2c211b]/70 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
          {/* Right text content */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-start gap-6 lg:pl-8 lg:pt-12"
          >
            <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#2f6f78]">
              ФИЛОСОФИЯ ДЕТАЛЕЙ
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl font-light tracking-wide leading-[1.15] text-[#2c211b]">
              Всё держится на деталях
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-[#2c211b]/80">
              Форма, фактура, металл и цвет подобраны так, чтобы аксессуар выглядел естественно рядом с очками.
            </p>
            <div className="w-20 h-0.5 bg-[#2c211b]/20 mt-2" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
