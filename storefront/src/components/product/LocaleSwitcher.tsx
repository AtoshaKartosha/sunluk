"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const LOCALE_LABELS: Record<string, string> = {
  ru: "RU",
  en: "EN",
};

export function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract current locale and path suffix
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = segments[0] ?? "ru";
  const rest = segments.slice(1).join("/");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocaleChange = (locale: string) => {
    if (locale === currentLocale) return;
    const targetPath = `/${locale}/${rest}`;
    setIsOpen(false);
    router.push(targetPath);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase text-[#2c211b]/50 hover:text-[#2c211b] bg-transparent transition-all duration-200"
      >
        <span>{LOCALE_LABELS[currentLocale] ?? currentLocale.toUpperCase()}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-3.5 h-3.5 text-[#2c211b]/30 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-20 bg-[#f4ebe6] border border-[#2c211b]/10 shadow-lg z-50 py-1 animate-fade-in">
          {Object.entries(LOCALE_LABELS).map(([code, label]) => {
            const isSelected = code === currentLocale;
            return (
              <button
                key={code}
                type="button"
                onClick={() => handleLocaleChange(code)}
                className={`w-full text-center px-3 py-2 text-[10px] font-semibold tracking-[0.2em] uppercase transition-colors duration-150 ${
                  isSelected
                    ? "bg-[#2f6f78]/15 text-[#2f6f78]"
                    : "text-[#2c211b]/60 hover:bg-[#2c211b]/5 hover:text-[#2c211b]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
