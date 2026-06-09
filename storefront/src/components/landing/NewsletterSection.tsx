"use client";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/*  inline SVG – only the icon this component needs                   */
/* ------------------------------------------------------------------ */
const CheckCircleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  NewsletterSection                                                 */
/* ------------------------------------------------------------------ */
export default function NewsletterSection() {
  const t = useTranslations("home");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <section className="relative py-24 overflow-hidden text-white bg-slate-900">
      {/* Teal Sea background image with dark overlay */}
      <div className="absolute inset-0">
        <div
          role="img"
          aria-label="Warm turquoise sea waves background"
          className="w-full h-full bg-cover bg-center opacity-40 scale-105"
          style={{ backgroundImage: "url('/images/newsletter-bg.webp')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2f6f78]/95 via-[#2f6f78]/80 to-[#5a3828]/90 mix-blend-multiply" />
      </div>
      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Left Column: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left flex flex-col items-center lg:items-start gap-4"
          >
            <span className="text-[10px] font-medium tracking-[0.4em] uppercase text-white/90 block">
              {t("newsletter.label")}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide uppercase">
              {t("newsletter.heading")}
            </h2>
            <p className="text-sm sm:text-base text-white/80 max-w-lg leading-relaxed">
              {t("newsletter.description")}
            </p>
          </motion.div>
          {/* Right Column: Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="w-full max-w-md mx-auto lg:mr-0 flex flex-col gap-4"
          >
            {subscribed ? (
              <div className="w-full bg-white/10 backdrop-blur-md p-6 rounded-none border border-white/20 animate-fade-in flex flex-col items-center lg:items-start text-center lg:text-left gap-3">
                <CheckCircleIcon className="w-10 h-10 text-white" />
                <p className="text-sm font-bold tracking-wider uppercase">{t("newsletter.successTitle")}</p>
                <p className="text-xs text-white/85">{t("newsletter.successDesc")}</p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="w-full flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("newsletter.placeholder")}
                  className="flex-1 px-5 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-medium transition-all rounded-none"
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-[#5a3828] hover:bg-white hover:text-[#5a3828] text-white text-xs font-medium tracking-widest uppercase transition-all duration-300 rounded-none shrink-0 cursor-pointer"
                >
                  {t("newsletter.cta")}
                </button>
              </form>
            )}
            <p className="text-[10px] text-white/60 text-center lg:text-left">
              {t("newsletter.note")}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
