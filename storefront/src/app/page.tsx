"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

const CharReveal = ({ text, className, stagger = 0.025, delay = 0, y = 24, duration = 0.5 }: { text: string; className?: string; stagger?: number; delay?: number; y?: number; duration?: number }) => (
  <motion.span
    initial="hidden"
    animate="visible"
    variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
    className={className}
    aria-label={text}
  >
    {text.split("").map((char, i) => (
      <motion.span
        key={i}
        variants={{ hidden: { opacity: 0, y }, visible: { opacity: 1, y: 0, transition: { duration, ease: [0.25, 0.1, 0.25, 1] } } }}
        className="inline-block"
      >
        {char === " " ? "\u00A0" : char}
      </motion.span>
    ))}
  </motion.span>
);

// Inline lightweight custom SVG icons for maximum compatibility, performance, and zero dependency issues
const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const UserIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const ShoppingBagIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-3-4z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
);

const MenuIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const XIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const ArrowRightIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

const SparklesIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path>
  </svg>
);

const GemIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 3h12l4 6-10 13L2 9z"></path>
    <path d="M11 3 8 9l4 13 4-13-3-6"></path>
    <path d="M2 9h20"></path>
  </svg>
);
const LeafIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.2a7 7 0 0 1-13.9 1.8" />
    <path d="M19 2c-2.26 4.33-5.27 7.14-11 11" />
  </svg>
);
const ShieldIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const CheckCircleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const InstagramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const SendIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const YoutubeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

const MapPinIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b] antialiased selection:bg-[#2f6f78] selection:text-white">
      
      {/* 1. Header Section */}
      <header className="sticky top-0 z-50 bg-[#f4ebe6]/90 backdrop-blur-md border-b border-[#2c211b]/10 transition-all duration-300">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16 h-20 flex items-center justify-between">
          
          {/* Logo & Subtitle */}
          <a href="#" className="flex flex-col group">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-none border-2 border-[#2c211b] flex items-center justify-center font-serif text-xs font-medium leading-none group-hover:bg-[#2c211b] group-hover:text-[#f4ebe6] transition-colors duration-300">
                S
              </span>
              <span className="font-serif text-xl sm:text-2xl font-medium tracking-widest leading-none">
                SUNLUK
              </span>
            </div>
            <span className="text-[8px] sm:text-[9px] tracking-[0.05em] uppercase text-[#2c211b]/70 font-semibold mt-1">
              АКСЕССУАРЫ ДЛЯ ОЧКОВ
            </span>
          </a>

          {/* Centered Navigation */}
          <nav className="hidden md:flex items-center gap-12 text-xs font-medium tracking-widest text-[#2c211b]">
            <a href="#collection" className="relative inline-block hover:translate-y-[-1px] active:translate-y-[0px] transition-transform duration-200 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:bg-[#2f6f78] after:scale-x-0 after:origin-left after:transition-transform after:duration-200 hover:after:scale-x-100 focus-visible:translate-y-[-1px] focus-visible:after:scale-x-100 focus-visible:outline-none">
              КОЛЛЕКЦИЯ
            </a>
            <a href="#about" className="relative inline-block hover:translate-y-[-1px] active:translate-y-[0px] transition-transform duration-200 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:bg-[#2f6f78] after:scale-x-0 after:origin-left after:transition-transform after:duration-200 hover:after:scale-x-100 focus-visible:translate-y-[-1px] focus-visible:after:scale-x-100 focus-visible:outline-none">
              О НАС
            </a>
            <a href="#contacts" className="relative inline-block hover:translate-y-[-1px] active:translate-y-[0px] transition-transform duration-200 after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full after:bg-[#2f6f78] after:scale-x-0 after:origin-left after:transition-transform after:duration-200 hover:after:scale-x-100 focus-visible:translate-y-[-1px] focus-visible:after:scale-x-100 focus-visible:outline-none">
              КОНТАКТЫ
            </a>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-5 sm:gap-6">
            <button className="text-[#2c211b] hover:text-[#2f6f78] p-1.5 transition-colors duration-200" aria-label="Поиск">
              <SearchIcon className="w-5 h-5" />
            </button>
            <button className="text-[#2c211b] hover:text-[#2f6f78] p-1.5 transition-colors duration-200" aria-label="Профиль">
              <UserIcon className="w-5 h-5" />
            </button>
            <button className="text-[#2c211b] hover:text-[#2f6f78] p-1.5 flex items-center gap-1.5 transition-colors duration-200" aria-label="Корзина">
              <div className="relative">
                <ShoppingBagIcon className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-[#2f6f78] text-white text-[9px] font-bold w-4.5 h-4.5 rounded-none flex items-center justify-center">
                  0
                </span>
              </div>
            </button>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-[#2c211b] hover:text-[#2f6f78] p-1.5 transition-colors"
            >
              {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-[#f4ebe6] border-b border-[#2c211b]/10 py-6 px-4 flex flex-col gap-5 text-sm font-medium tracking-widest text-center shadow-lg animate-fade-in">
            <a 
              href="#collection" 
              onClick={() => setMobileMenuOpen(false)}
              className="relative inline-block py-2 hover:translate-y-[-1px] active:translate-y-[0px] transition-transform duration-200 after:absolute after:bottom-1 after:left-0 after:h-[2px] after:w-full after:bg-[#2f6f78] after:scale-x-0 after:origin-left after:transition-transform after:duration-200 hover:after:scale-x-100 focus-visible:translate-y-[-1px] focus-visible:after:scale-x-100 focus-visible:outline-none"
            >
              КОЛЛЕКЦИЯ
            </a>
            <a 
              href="#about" 
              onClick={() => setMobileMenuOpen(false)}
              className="relative inline-block py-2 hover:translate-y-[-1px] active:translate-y-[0px] transition-transform duration-200 after:absolute after:bottom-1 after:left-0 after:h-[2px] after:w-full after:bg-[#2f6f78] after:scale-x-0 after:origin-left after:transition-transform after:duration-200 hover:after:scale-x-100 focus-visible:translate-y-[-1px] focus-visible:after:scale-x-100 focus-visible:outline-none"
            >
              О НАС
            </a>
            <a 
              href="#contacts" 
              onClick={() => setMobileMenuOpen(false)}
              className="relative inline-block py-2 hover:translate-y-[-1px] active:translate-y-[0px] transition-transform duration-200 after:absolute after:bottom-1 after:left-0 after:h-[2px] after:w-full after:bg-[#2f6f78] after:scale-x-0 after:origin-left after:transition-transform after:duration-200 hover:after:scale-x-100 focus-visible:translate-y-[-1px] focus-visible:after:scale-x-100 focus-visible:outline-none"
            >
              КОНТАКТЫ
            </a>
          </div>
        )}
      </header>

      {/* 2. Hero & Editorial Grid Section */}
      <section className="relative min-h-[350px] lg:min-h-[440px] flex flex-col bg-[#f4ebe6] overflow-hidden">
        {/* Hero Contents */}
        <div className="relative flex-1 flex items-center pt-12 md:pt-16 pb-0">
          {/* Background Image / Split Layout - constrained to hero top-half/side */}
          <motion.div
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-y-0 right-0 w-full md:w-[54%] h-full overflow-hidden"
          >
            <div className="absolute inset-y-0 left-0 w-[15%] bg-gradient-to-r from-[#f4ebe6] to-transparent md:-left-2 z-10" />
            <div 
              role="img"
              aria-label="Warm beach editorial sunglasses and premium chain with sea beads" 
              className="w-full h-full bg-cover bg-[position:20%_center]"
              style={{ backgroundImage: "url('/images/hero-wide.webp')" }}
            />
          </motion.div>
          <div className="relative max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16 z-20 w-full">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-xl md:max-w-2xl lg:max-w-3xl flex flex-col items-start gap-6 sm:gap-8"
            >
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light tracking-wide leading-[1.1] text-[#2c211b]">
                <CharReveal text="МЕНЯЙ СЕБЯ." stagger={0.018} delay={0} y={24} duration={0.35} />
                <br />
                <CharReveal text="ВЫРАЖАЙ СЕБЯ." stagger={0.018} delay={0.14} y={24} duration={0.35} />
              </h1>
              <p className="text-base sm:text-lg leading-relaxed text-[#2c211b]/80 max-w-md">
                <CharReveal text="Аксессуары для очков," stagger={0.01} delay={0.35} y={14} duration={0.28} />
                <br className="hidden sm:inline" />
                <CharReveal text="которые становятся частью вашего стиля." stagger={0.01} delay={0.45} y={14} duration={0.28} />
              </p>
              <motion.a 
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="#collection"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#5a3828] text-white hover:bg-[#2c211b] text-xs font-medium tracking-widest uppercase transition-all duration-300 shadow-md hover:shadow-lg hover:translate-y-[-2px] group"
              >
                СМОТРЕТЬ КОЛЛЕКЦИЮ
                <ArrowRightIcon className="w-4 h-4 ml-3 group-hover:translate-x-1.5 transition-transform" />
              </motion.a>
            </motion.div>
          </div>
        </div>
      </section>
      {/* 3. Editorial Grid Section */}
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
      {/* 4. Collection Section */}
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
              ИЗЫСКАННЫЙ ВЫБОР
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide text-[#2c211b] uppercase">
              КОЛЛЕКЦИЯ SUNLUK
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
                  staggerChildren: 0.1
                }
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
          >
            {/* Card 1: Бирюза */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 15 } }
              }}
              className="group flex flex-col text-left bg-transparent transition-all duration-300"
            >
              <div className="aspect-[4/5] overflow-hidden bg-[#f4ebe6] mb-5 rounded-none relative">
                <div 
                  role="img"
                  aria-label="Бирюза" 
                  className="w-full h-full bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                  style={{ backgroundImage: "url('/images/product-turquoise.webp')" }}
                />
              </div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-serif text-lg font-bold text-[#2c211b]">Бирюза</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-3 h-3 rounded-full bg-[#2f6f78] border border-white shadow-inner" />
                  <span className="text-[10px] tracking-wide text-[#2c211b]/60 font-semibold">Цвет</span>
                </div>
              </div>
              <p className="text-xs text-[#2c211b]/70 font-medium">Акцентный цвет и природные мотивы</p>
            </motion.div>
            {/* Card 2: Leather Loop */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 15 } }
              }}
              className="group flex flex-col text-left bg-transparent transition-all duration-300"
            >
              <div className="aspect-[4/5] overflow-hidden bg-[#f4ebe6] mb-5 rounded-none relative">
                <div 
                  role="img"
                  aria-label="Leather Loop" 
                  className="w-full h-full bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                  style={{ backgroundImage: "url('/images/product-leather.webp')" }}
                />
              </div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-serif text-lg font-bold text-[#2c211b]">Leather Loop</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-3 h-3 rounded-full bg-[#5a3828] border border-white shadow-inner" />
                  <span className="text-[10px] tracking-wide text-[#2c211b]/60 font-semibold">Кожа</span>
                </div>
              </div>
              <p className="text-xs text-[#2c211b]/70 font-medium">Натуральная кожа и премиальный металл</p>
            </motion.div>
            {/* Card 3: Silver Chain */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 15 } }
              }}
              className="group flex flex-col text-left bg-transparent transition-all duration-300"
            >
              <div className="aspect-[4/5] overflow-hidden bg-[#f4ebe6] mb-5 rounded-none relative">
                <div 
                  role="img"
                  aria-label="Silver Chain" 
                  className="w-full h-full bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                  style={{ backgroundImage: "url('/images/product-silver.webp')" }}
                />
              </div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-serif text-lg font-bold text-[#2c211b]">Silver Chain</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-3 h-3 rounded-full bg-[#a3b8bc] border border-white shadow-inner" />
                  <span className="text-[10px] tracking-wide text-[#2c211b]/60 font-semibold">Сталь</span>
                </div>
              </div>
              <p className="text-xs text-[#2c211b]/70 font-medium">Минимализм, строгость и лёгкий блеск</p>
            </motion.div>
            {/* Card 4: Sand Chain */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 15 } }
              }}
              className="group flex flex-col text-left bg-transparent transition-all duration-300"
            >
              <div className="aspect-[4/5] overflow-hidden bg-[#f4ebe6] mb-5 rounded-none relative">
                <div 
                  role="img"
                  aria-label="Sand Chain" 
                  className="w-full h-full bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
                  style={{ backgroundImage: "url('/images/product-sand.webp')" }}
                />
              </div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-serif text-lg font-bold text-[#2c211b]">Sand Chain</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-3 h-3 rounded-full bg-[#d4af37] border border-white shadow-inner" />
                  <span className="text-[10px] tracking-wide text-[#2c211b]/60 font-semibold">Золото</span>
                </div>
              </div>
              <p className="text-xs text-[#2c211b]/70 font-medium">Тёплый металл и морской песчаный оттенок</p>
            </motion.div>
          </motion.div>
          <motion.button 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center px-10 py-4 border-2 border-[#2c211b] text-[#2c211b] hover:bg-[#2c211b] hover:text-white text-xs font-medium tracking-widest uppercase transition-all duration-300 rounded-none cursor-pointer"
          >
            ВЫБРАТЬ АКСЕССУАР
          </motion.button>
        </div>
      </section>
      {/* 5. Features/Value Section */}
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
              {/* Feature 1 */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 15 } }
                }}
                className="border-b sm:border-r border-[#2c211b]/15 p-8 sm:p-12 flex items-start gap-6"
              >
                <div className="w-16 h-16 shrink-0 flex items-center justify-center text-[#2c211b]">
                  <span className="font-serif text-5xl sm:text-6xl font-light leading-none">S</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-serif text-lg font-bold text-[#2c211b]">S-элемент</h3>
                  <p className="text-xs sm:text-sm text-[#2c211b]/70 leading-relaxed">Фирменная деталь SUNLUK</p>
                </div>
              </motion.div>
              {/* Feature 2 */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 15 } }
                }}
                className="border-b border-[#2c211b]/15 p-8 sm:p-12 flex items-start gap-6"
              >
                <div className="w-16 h-16 shrink-0 flex items-center justify-center text-[#2c211b]">
                  <GemIcon className="w-12 h-12" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-serif text-lg font-bold text-[#2c211b]">Премиальные материалы</h3>
                  <p className="text-xs sm:text-sm text-[#2c211b]/70 leading-relaxed">Отборные материалы, которые служат долго.</p>
                </div>
              </motion.div>
              {/* Feature 3 */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 15 } }
                }}
                className="border-b sm:border-b-0 sm:border-r border-[#2c211b]/15 p-8 sm:p-12 flex items-start gap-6"
              >
                <div className="w-16 h-16 shrink-0 flex items-center justify-center text-[#2c211b]">
                  <LeafIcon className="w-12 h-12" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-serif text-lg font-bold text-[#2c211b]">Лёгкие</h3>
                  <p className="text-xs sm:text-sm text-[#2c211b]/70 leading-relaxed">Комфортные на весь день.</p>
                </div>
              </motion.div>
              {/* Feature 4 */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 60, damping: 15 } }
                }}
                className="p-8 sm:p-12 flex items-start gap-6"
              >
                <div className="w-16 h-16 shrink-0 flex items-center justify-center text-[#2c211b]">
                  <ShieldIcon className="w-12 h-12" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-serif text-lg font-bold text-[#2c211b]">Надёжные</h3>
                  <p className="text-xs sm:text-sm text-[#2c211b]/70 leading-relaxed">Прочное крепление для ваших очков.</p>
                </div>
              </motion.div>
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
      {/* 6. About / Order split section */}
      <section id="about" className="relative min-h-[500px] grid grid-cols-1 lg:grid-cols-2 bg-[#f4ebe6] overflow-hidden">
        {/* Left packaging/beach image */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative h-96 lg:h-auto overflow-hidden bg-[#f4ebe6]"
        >
          <div 
            role="img"
            aria-label="SUNLUK эксклюзивные упаковочные коробки и аксессуары" 
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: "url('/images/about-packaging.webp')" }}
          />
        </motion.div>
        {/* Right text and button */}
        <div className="bg-[#f4ebe6] py-20 px-8 sm:px-16 lg:px-24 flex flex-col justify-center items-start gap-6 border-l border-[#2c211b]/5">
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-start gap-6 lg:-translate-y-12"
          >
            <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#2f6f78]">
              О БРЕНДЕ
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide text-[#2c211b] uppercase">
              О НАС
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-[#2c211b]/80 max-w-lg">
              SUNLUK — это больше, чем аксессуар. Это свобода выражать себя каждый день — в путешествиях, в городе, в моменты, которые важны.
            </p>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center px-10 py-4 bg-[#5a3828] text-white hover:bg-[#2c211b] text-xs font-medium tracking-widest uppercase transition-all duration-300 shadow-md hover:shadow-lg mt-4 rounded-none cursor-pointer"
            >
              ЗАКАЗАТЬ АКСЕССУАР
            </motion.button>
          </motion.div>
        </div>

      </section>

      {/* 7. Newsletter Band Section */}
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
                ЭКСКЛЮЗИВНЫЕ ПРЕДЛОЖЕНИЯ
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide uppercase">
                БУДЬТЕ ПЕРВЫМИ
              </h2>
              <p className="text-sm sm:text-base text-white/80 max-w-lg leading-relaxed">
                Подпишитесь и узнавайте о новинках, лимитированных дропах и специальных предложениях.
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
                  <p className="text-sm font-bold tracking-wider uppercase">ВЫ УСПЕШНО ПОДПИСАЛИСЬ!</p>
                  <p className="text-xs text-white/85">Спасибо за интерес к SUNLUK. Письмо с приветственным бонусом уже летит к вам.</p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="w-full flex flex-col sm:flex-row gap-3">
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ваш e-mail" 
                    className="flex-1 px-5 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-medium transition-all rounded-none"
                  />
                  <button 
                    type="submit" 
                    className="px-8 py-4 bg-[#5a3828] hover:bg-white hover:text-[#5a3828] text-white text-xs font-medium tracking-widest uppercase transition-all duration-300 rounded-none shrink-0 cursor-pointer"
                  >
                    ПОДПИСАТЬСЯ
                  </button>
                </form>
              )}
              <p className="text-[10px] text-white/60 text-center lg:text-left">
                Никакого спама. Отписаться можно в любой момент.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      {/* 8. Footer Section */}
      <footer id="contacts" className="bg-[#f4ebe6] border-t border-[#2c211b]/10 py-16 sm:py-24 text-sm text-[#2c211b]/80">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 sm:gap-16 mb-16 sm:mb-20">
            
            {/* Column 1: Logo and social */}
            <div className="lg:col-span-2 flex flex-col items-start gap-6">
              <a href="#" className="flex flex-col group">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-none border-2 border-[#2c211b] flex items-center justify-center font-serif text-xs font-medium leading-none">
                    S
                  </span>
                  <span className="font-serif text-xl sm:text-2xl font-medium tracking-widest leading-none">
                    SUNLUK
                  </span>
                </div>
                <span className="text-[8px] sm:text-[9px] tracking-[0.05em] uppercase text-[#2c211b]/70 font-semibold mt-1">
                  АКСЕССУАРЫ ДЛЯ ОЧКОВ
                </span>
              </a>
              <div className="flex items-center gap-4 mt-2">
                <a href="#" className="text-[#2c211b]/70 hover:text-[#2f6f78] p-1 transition-colors duration-200" aria-label="Instagram">
                  <InstagramIcon className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#2c211b]/70 hover:text-[#2f6f78] p-1 transition-colors duration-200" aria-label="Telegram">
                  <SendIcon className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#2c211b]/70 hover:text-[#2f6f78] p-1 transition-colors duration-200" aria-label="YouTube">
                  <YoutubeIcon className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Column 2: Сервис */}
            <div className="flex flex-col gap-4 sm:gap-5">
              <h3 className="text-xs font-medium tracking-widest text-[#2c211b] uppercase">
                СЕРВИС КЛИЕНТОВ
              </h3>
              <ul className="flex flex-col gap-2.5 text-xs font-medium">
                <li><a href="#" className="hover:text-[#2f6f78] transition-colors">Наша история</a></li>
                <li><a href="#" className="hover:text-[#2f6f78] transition-colors">Доставка и возврат</a></li>
                <li><a href="#" className="hover:text-[#2f6f78] transition-colors">Условия и положения</a></li>
                <li><a href="#" className="hover:text-[#2f6f78] transition-colors">Политика конфиденциальности</a></li>
              </ul>
            </div>

            {/* Column 3: Магазин */}
            <div className="flex flex-col gap-4 sm:gap-5">
              <h3 className="text-xs font-medium tracking-widest text-[#2c211b] uppercase">
                МАГАЗИН
              </h3>
              <ul className="flex flex-col gap-2.5 text-xs font-medium">
                <li><a href="#" className="hover:text-[#2f6f78] transition-colors">Все товары</a></li>
                <li><a href="#" className="hover:text-[#2f6f78] transition-colors">Подарочные карты</a></li>
              </ul>
            </div>

            {/* Column 4: Вопросы */}
            <div className="flex flex-col gap-4 sm:gap-5">
              <h3 className="text-xs font-medium tracking-widest text-[#2c211b] uppercase">
                ВОПРОСЫ
              </h3>
              <ul className="flex flex-col gap-2.5 text-xs font-medium">
                <li><a href="#" className="hover:text-[#2f6f78] transition-colors">Связаться с нами</a></li>
                <li><a href="#" className="hover:text-[#2f6f78] transition-colors">Telegram</a></li>
                <li><a href="#" className="hover:text-[#2f6f78] transition-colors">Instagram</a></li>
                <li><a href="mailto:info@sunluk.ru" className="hover:text-[#2f6f78] transition-colors">Email</a></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-[#2c211b]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#2c211b]/60">
            <p>© 2026 SUNLUK. Все права защищены.</p>
          </div>

        </div>
      </footer>

    </div>
  );
}
