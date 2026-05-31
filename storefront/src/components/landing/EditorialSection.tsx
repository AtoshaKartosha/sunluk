"use client";

import { motion } from "framer-motion";
import { ArrowRightIcon } from "./icons";

export function EditorialSection() {
  return (
    <section className="relative pt-0 pb-16 px-4 sm:px-10 lg:px-16 z-20 bg-[#f4ebe6]">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8 items-center">
          {/* 3 Models Container with 5px padding and 5px gap */}
          <motion.div 
            initial="hidden"
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
            className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-[5px] p-[5px]"
          >
            {/* Model 1 */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 15 } }
              }}
              className="group relative aspect-[3/4] overflow-hidden bg-[#f4ebe6] rounded-none shadow-sm"
            >
              <div 
                role="img"
                aria-label="Эстетичный образ" 
                className="w-full h-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ backgroundImage: "url('/images/model1.webp')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
            {/* Model 2 */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 15 } }
              }}
              className="group relative aspect-[3/4] overflow-hidden bg-[#f4ebe6] rounded-none shadow-sm"
            >
              <div 
                role="img"
                aria-label="Элегантный стиль" 
                className="w-full h-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ backgroundImage: "url('/images/model2.webp')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
            {/* Model 3 */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 15 } }
              }}
              className="group relative aspect-[3/4] overflow-hidden bg-[#f4ebe6] rounded-none shadow-sm"
            >
              <div 
                role="img"
                aria-label="Лаконичная деталь" 
                className="w-full h-full bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ backgroundImage: "url('/images/model3.webp')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          </motion.div>
          {/* Text Editorial block without container wrapper */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-1 flex flex-col justify-between py-4"
          >
            <div className="flex flex-col gap-4">
              <h2 className="font-serif text-3xl sm:text-4xl font-light tracking-wide text-[#2c211b] uppercase">
                НОСИ ПО-СВОЕМУ
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-[#2c211b]/80 mt-2">
                SUNLUK — аксессуары для очков, которые становятся гармоничной частью образа: в путешествиях, в динамичном городе, на берегу тёплого моря.
              </p>
            </div>
            <a 
              href="#collection" 
              className="inline-flex items-center text-xs font-medium tracking-widest uppercase text-[#5a3828] hover:text-[#2c211b] mt-6 group"
            >
              СМОТРЕТЬ КОЛЛЕКЦИЮ
              <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
