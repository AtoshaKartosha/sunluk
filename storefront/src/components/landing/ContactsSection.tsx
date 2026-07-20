"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const contactLinks = [
  {
    labelKey: "contacts.emailLabel",
    value: "Infosunluk@gmail.com",
    href: "mailto:Infosunluk@gmail.com",
    icon: "mail",
  },
  {
    labelKey: "contacts.phoneLabel",
    value: "+7 (995) 770-72-54",
    href: "tel:+79957707254",
    icon: "phone",
  },
  {
    labelKey: "contacts.telegramLabel",
    value: "@sunluk",
    href: "https://t.me/sunluk",
    icon: "telegram",
  },
] as const;

function ContactIcon({ icon }: { icon: (typeof contactLinks)[number]["icon"] }) {
  const className = "h-10 w-10 stroke-current";

  if (icon === "mail") {
    return (
      <svg aria-hidden="true" viewBox="0 0 48 48" fill="none" className={className}>
        <rect x="5" y="10" width="38" height="28" rx="2" strokeWidth="1.5" />
        <path d="m7 13 17 14 17-14" strokeWidth="1.5" />
      </svg>
    );
  }

  if (icon === "phone") {
    return (
      <svg aria-hidden="true" viewBox="0 0 48 48" fill="none" className={className}>
        <rect x="14" y="4" width="20" height="40" rx="3" strokeWidth="1.5" />
        <path d="M21 9h6M22 38h4" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" fill="none" className={className}>
      <path d="m5 22 38-16-11 37-9-13-18-8Z" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M23 30 43 6" strokeWidth="1.5" />
    </svg>
  );
}

export function ContactsSection() {
  const t = useTranslations("home");

  return (
    <section id="contacts" className="bg-[#f4ebe6] px-4 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
      <div className="mx-auto max-w-[1600px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="font-serif text-4xl font-light tracking-wide text-[#2c211b] sm:text-5xl lg:text-6xl">
            {t("contacts.heading")}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[#2c211b]/70 sm:text-lg">
            {t("contacts.description")}
          </p>
        </motion.div>

        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-10 md:mt-14 md:grid-cols-3 md:gap-0">
          {contactLinks.map((contact, i) => (
            <motion.div
              key={contact.icon}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative flex min-w-0 justify-center px-4 md:px-10"
            >
              {i > 0 && (
                <div aria-hidden="true" className="absolute inset-y-1/2 left-0 hidden h-28 -translate-y-1/2 md:flex md:flex-col md:items-center">
                  <span className="h-10 w-px bg-[#a78343]/30" />
                  <span className="font-serif text-2xl font-light leading-8 text-[#a78343]/70">S</span>
                  <span className="h-10 w-px bg-[#a78343]/30" />
                </div>
              )}
              <a
                href={contact.href}
                target={contact.href.startsWith("http") ? "_blank" : undefined}
                rel={contact.href.startsWith("http") ? "noreferrer noopener" : undefined}
                className="group flex min-w-0 flex-col items-center text-center text-[#a78343]"
              >
                <ContactIcon icon={contact.icon} />
                <span className="mt-5 text-[10px] font-medium tracking-[0.35em] text-[#2c211b]">
                  {t(contact.labelKey)}
                </span>
                <span className="mt-4 max-w-full border-b border-[#a78343]/60 pb-1 font-sans text-base text-[#2c211b] transition-colors duration-200 group-hover:text-[#2f6f78] sm:text-lg">
                  {contact.value}
                </span>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
