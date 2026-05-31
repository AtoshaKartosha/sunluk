"use client";

import { useState } from "react";
import Link from "next/link";
import { BRAND, NAV_LINKS } from "@/lib/landing-data";
import { NavLink } from "@/components/landing/NavLink";
import { useCart } from "@/components/cart/CartContext";

/* ------------------------------------------------------------------ */
/*  inline SVGs – only the icons this component needs                 */
/* ------------------------------------------------------------------ */
const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const UserIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

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

export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { itemCount, openCart } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-[#f4ebe6]/90 backdrop-blur-md border-b border-[#2c211b]/10 transition-all duration-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16 h-20 flex items-center justify-between">

        {/* Logo & Subtitle */}
        <Link href="/" className="flex flex-col group">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-none border-2 border-[#2c211b] flex items-center justify-center font-serif text-xs font-medium leading-none group-hover:bg-[#2c211b] group-hover:text-[#f4ebe6] transition-colors duration-300">
              S
            </span>
            <span className="font-serif text-xl sm:text-2xl font-medium tracking-widest leading-none">
              {BRAND.name}
            </span>
          </div>
          <span className="text-[8px] sm:text-[9px] tracking-[0.05em] uppercase text-[#2c211b]/70 font-semibold mt-1">
            {BRAND.subtitle}
          </span>
        </Link>

        {/* Centered Navigation – desktop */}
        <nav className="hidden md:flex items-center gap-12 text-xs font-medium tracking-widest text-[#2c211b]">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center gap-5 sm:gap-6">
          <button className="text-[#2c211b] hover:text-[#2f6f78] p-1.5 transition-colors duration-200" aria-label="Поиск">
            <SearchIcon className="w-5 h-5" />
          </button>
          <button className="text-[#2c211b] hover:text-[#2f6f78] p-1.5 transition-colors duration-200" aria-label="Профиль">
            <UserIcon className="w-5 h-5" />
          </button>
          <button
            onClick={openCart}
            className="text-[#2c211b] hover:text-[#2f6f78] p-1.5 flex items-center gap-1.5 transition-colors duration-200"
            aria-label="Корзина"
          >
            <div className="relative">
              <ShoppingBagIcon className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#2f6f78] text-white text-[9px] font-bold w-4.5 h-4.5 rounded-none flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </div>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#2c211b] hover:text-[#2f6f78] p-1.5 transition-colors"
            aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
          >
            {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#f4ebe6] border-b border-[#2c211b]/10 py-6 px-4 flex flex-col gap-5 text-sm font-medium tracking-widest text-center shadow-lg animate-fade-in">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              variant="mobile"
              onClick={() => setMobileMenuOpen(false)}
            />
          ))}
        </div>
      )}
    </header>
  );
}
