"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LOCALE_LABELS: Record<string, string> = {
  ru: "RU",
  en: "EN",
};

export function LocaleSwitcher() {
  const pathname = usePathname();

  // Extract current locale and path suffix
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = segments[0] ?? "ru";
  const rest = segments.slice(1).join("/");

  const otherLocale = currentLocale === "ru" ? "en" : "ru";
  const targetPath = `/${otherLocale}/${rest}`;

  return (
    <Link
      href={targetPath}
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase text-[#2c211b]/50 hover:text-[#2f6f78] transition-colors duration-200"
    >
      <span>{LOCALE_LABELS[currentLocale] ?? currentLocale.toUpperCase()}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3 h-3"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
      <span>{LOCALE_LABELS[otherLocale] ?? otherLocale.toUpperCase()}</span>
    </Link>
  );
}
