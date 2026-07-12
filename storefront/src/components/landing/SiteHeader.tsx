"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getNavLinks } from "@/lib/landing-data";
import type { NavLinkData } from "@/lib/landing-data";
import type { Locale } from "@/i18n/routing";
import { NavLink } from "@/components/landing/NavLink";
import { useCart } from "@/components/cart/CartContext";
import { LocaleSwitcher } from "@/components/product";

const ShoppingBagIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const MenuIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

const XIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export default function SiteHeader({ navLinks }: { navLinks?: NavLinkData[] }) {
  const locale = useLocale() as Locale;
  const links = navLinks ?? getNavLinks(locale);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations("header");

  const { itemCount, openCart } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-[#f4ebe6]/90 backdrop-blur-md border-b border-[#2c211b]/10 transition-all duration-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16 h-20 flex items-center justify-between">

        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center group">
          <img
            src={locale === "ru" ? "/images/sunluk_logo_cyrillic.svg" : "/images/sunluk_logo.svg"}
            alt="Sunluk"
            className="h-8 w-auto transition-opacity duration-300 group-hover:opacity-80 sm:h-10"
          />
        </Link>

        {/* Centered Navigation – desktop */}
        <nav className="hidden md:flex items-center gap-12 text-xs font-medium tracking-widest text-[#2c211b]">
          {links.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* ponytail: swap # for real Telegram / Max handles when known */}
          <a href="https://t.me/" target="_blank" rel="noreferrer noopener" aria-label={t("telegram")} className="p-1.5 opacity-70 hover:opacity-100 transition-opacity duration-200">
            <img src="/images/telegram.svg" alt="" className="w-6 h-6" />
          </a>
          {locale === "ru" && (
            <a href="https://max.ru/" target="_blank" rel="noreferrer noopener" aria-label={t("max")} className="p-1.5 opacity-70 hover:opacity-100 transition-opacity duration-200">
              <img src="/images/max.svg" alt="" className="w-5 h-5" />
            </a>
          )}
          <button
            onClick={openCart}
            className="text-[#2c211b] hover:text-[#2f6f78] p-1.5 flex items-center gap-1.5 transition-colors duration-200"
            aria-label={t("cart")}
          >
            <div className="relative">
              <ShoppingBagIcon className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#2f6f78] text-white text-[9px] font-bold w-[18px] h-[18px] rounded-none flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </div>
          </button>

          <div className="hidden md:block"><LocaleSwitcher /></div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#2c211b] hover:text-[#2f6f78] p-1.5 transition-colors"
            aria-label={mobileMenuOpen ? t("closeMenu") : t("openMenu")}
          >
            {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#f4ebe6] border-b border-[#2c211b]/10 py-6 px-4 flex flex-col gap-5 text-sm font-medium tracking-widest text-center shadow-lg animate-fade-in max-h-[calc(100dvh-5rem)] overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              variant="mobile"
              onClick={() => setMobileMenuOpen(false)}
            />
          ))}
          <div className="mt-4 pt-4 border-t border-[#2c211b]/10 flex justify-center">
            <LocaleSwitcher />
          </div>
        </div>
      )}
    </header>
  );
}
