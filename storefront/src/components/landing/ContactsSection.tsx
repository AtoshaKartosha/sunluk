"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

// ponytail: swap hello@sunluk.com + t.me/ + max.ru/ for real handles when known
const contactLinks = [
  { label: "Email", value: "hello@sunluk.com", href: "mailto:hello@sunluk.com" },
  { label: "Telegram", value: "@sunluk", href: "https://t.me/" },
  { label: "Max", value: "@sunluk", href: "https://max.ru/" },
] as const;

export function ContactsSection() {
  const t = useTranslations("home");

  return (
    <section id="contacts" className="py-10 sm:py-16 bg-[#f4ebe6]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-xl mx-auto text-center mb-10 sm:mb-14"
        >
          <h2 className="font-serif text-4xl sm:text-5xl font-light tracking-wide text-[#2c211b] mb-4">
            {t("contacts.heading")}
          </h2>
          <p className="text-base sm:text-lg leading-relaxed text-[#2c211b]/80">
            {t("contacts.description")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {contactLinks.map((c, i) => (
            <motion.a
              key={c.label}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel={c.href.startsWith("http") ? "noreferrer noopener" : undefined}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="flex flex-col items-center text-center p-6 sm:p-8 border border-[#2c211b]/15 hover:border-[#2f6f78] transition-colors duration-200"
            >
              <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#2f6f78] mb-3">
                {c.label}
              </span>
              <span className="font-serif text-lg sm:text-xl text-[#2c211b]">
                {c.value}
              </span>
            </motion.a>
          ))}
        </div>

        {/* Send message CTA row */}
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8 pt-10 sm:pt-14">
          <a
            href="mailto:Sunluk@gmail.com"
            className="text-[10px] sm:text-xs font-medium tracking-[0.3em] uppercase text-[#2f6f78] hover:text-[#2c211b] transition-colors duration-200"
          >
            {t("contacts.sendLabel")}
          </a>
          <a
            href="mailto:Sunluk@gmail.com"
            className="font-serif text-xl sm:text-2xl text-[#2c211b] hover:text-[#2f6f78] transition-colors duration-200"
          >
            Sunluk@gmail.com
          </a>
        </div>
      </div>
    </section>
  );
}
