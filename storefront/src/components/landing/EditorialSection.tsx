"use client";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowRightIcon } from "./icons";
import Image from "next/image";
import { useEntrance } from "./use-entrance";

export function EditorialSection() {
  const t = useTranslations("home");
  const animate = useEntrance();

  return (
    <section className="relative pt-2.5 pb-2.5 z-20 bg-background">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8 items-center">
          {/* 3 Models Container with 5px padding and 5px gap */}
          <motion.div 
            initial={animate ? "hidden" : false}
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15
                }
              }
            }}
            className="lg:col-span-3 grid grid-cols-3 gap-[5px] -mx-4 sm:mx-0 pt-[5px] pb-[5px] px-0 sm:p-[5px]"
          >
            {/* Model 1 */}
            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { duration: 0.6 } }
              }}
              className="group relative aspect-[3/4] overflow-hidden bg-background rounded-none shadow-sm"
            >
              <Image
                src="/images/model1-2.webp"
                alt={t("editorial.model1Aria")}
                fill
                sizes="(min-width:1024px) 25vw, 33vw"
                className="absolute inset-0 object-cover object-center transition-[transform,opacity] duration-500 ease-out group-hover:scale-105"
              />
              <Image
                src="/images/model1.webp"
                alt=""
                aria-hidden="true"
                fill
                sizes="(min-width:1024px) 25vw, 33vw"
                className="absolute inset-0 object-cover object-center opacity-0 transition-[transform,opacity] duration-500 ease-out group-hover:scale-105 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
            {/* Model 2 */}
            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { duration: 0.6 } }
              }}
              className="group relative aspect-[3/4] overflow-hidden bg-background rounded-none shadow-sm"
            >
              <Image
                src="/images/model2.webp"
                alt={t("editorial.model2Aria")}
                fill
                sizes="(min-width:1024px) 25vw, 33vw"
                className="absolute inset-0 object-cover object-center transition-[transform,opacity] duration-500 ease-out group-hover:scale-105"
              />
              <Image
                src="/images/model2-2.webp"
                alt=""
                aria-hidden="true"
                fill
                sizes="(min-width:1024px) 25vw, 33vw"
                className="absolute inset-0 object-cover object-center opacity-0 transition-[transform,opacity] duration-500 ease-out group-hover:scale-105 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
            {/* Model 3 */}
            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { duration: 0.6 } }
              }}
              className="group relative aspect-[3/4] overflow-hidden bg-background rounded-none shadow-sm"
            >
              <Image
                src="/images/model3.webp"
                alt={t("editorial.model3Aria")}
                fill
                sizes="(min-width:1024px) 25vw, 33vw"
                className="absolute inset-0 object-cover object-center transition-[transform,opacity] duration-500 ease-out group-hover:scale-105"
              />
              <Image
                src="/images/model3-2.webp"
                alt=""
                aria-hidden="true"
                fill
                sizes="(min-width:1024px) 25vw, 33vw"
                className="absolute inset-0 object-cover object-center opacity-0 transition-[transform,opacity] duration-500 ease-out group-hover:scale-105 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          </motion.div>
          {/* Text Editorial block without container wrapper */}
          <motion.div 
            initial={animate ? { opacity: 0 } : false}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-1 flex flex-col justify-between py-4"
          >
            <div className="flex flex-col gap-4">
              <h2 className="font-serif text-3xl sm:text-4xl font-light tracking-wide text-[#2c211b] uppercase">
                {t("editorial.heading")}
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-[#2c211b]/80 mt-2">
                {t("editorial.description")}
              </p>
            </div>
            <a 
              href="#collection" 
              className="inline-flex items-center text-xs font-medium tracking-widest uppercase text-[#5a3828] hover:text-[#2c211b] mt-6 group"
            >
              {t("editorial.cta")}
              <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
