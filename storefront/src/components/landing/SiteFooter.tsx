import Link from "next/link";
import Image from "next/image";
import { InstagramIcon, SendIcon } from "./icons";
import { getFooterGroups, getCopyright } from "@/lib/landing-data";
import type { FooterGroupData } from "@/lib/landing-data";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";

export function SiteFooter({
  footerGroups,
  copyright,
  locale,
}: {
  footerGroups?: FooterGroupData[];
  copyright?: string;
  locale?: string;
}) {
  const defaultLocale = useLocale() as Locale;
  const activeLocale = (locale as Locale) || defaultLocale;
  const groups = footerGroups ?? getFooterGroups(activeLocale);
  const copy = copyright ?? getCopyright(activeLocale);

  const [serviceGroup, ...secondaryGroups] = groups;

  return (
    <footer className="bg-background border-t border-[#2c211b]/10 py-16 sm:py-24 text-sm text-[#2c211b]/80">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16">

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-10 sm:gap-x-10 sm:gap-y-12 lg:gap-16 mb-16 sm:mb-20">

          {/* Logo and social */}
          <div className="lg:col-span-2 flex flex-col items-start gap-6">
            <Link href={locale ? `/${locale}` : "/"} className="flex items-center group">
              <Image
                src={activeLocale === "ru" ? "/images/sunluk_logo_cyrillic.svg" : "/images/sunluk_logo.svg"}
                width={activeLocale === "ru" ? 1201 : 1212}
                height={202}
                alt="Sunluk"
                className="h-8 w-auto transition-opacity duration-300 group-hover:opacity-80 sm:h-10"
              />
            </Link>
            <div className="flex items-center gap-4 mt-2">
              <a href="https://www.instagram.com/sunluk.accessories/" className="text-[#2c211b]/70 hover:text-[#2f6f78] p-1 transition-colors duration-200" aria-label="Instagram">
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a href="#" className="text-[#2c211b]/70 hover:text-[#2f6f78] p-1 transition-colors duration-200" aria-label="Telegram">
                <SendIcon className="w-5 h-5" />
              </a>
              {activeLocale === "ru" && (
                <a href="https://max.ru/" target="_blank" rel="noreferrer noopener" className="text-[#2c211b]/70 hover:text-[#2f6f78] p-1 transition-colors duration-200" aria-label="Max">
                  <Image src="/images/max.svg" width={720} height={720} alt="" className="w-5 h-5 opacity-70" />
                </a>
              )}
            </div>
          </div>

          {serviceGroup && (
            <div className="flex flex-col gap-4 sm:gap-5">
              <h3 className="text-xs font-medium tracking-widest text-[#2c211b] uppercase">
                {serviceGroup.title}
              </h3>
              <ul className="flex flex-col gap-2.5 text-xs font-medium">
                {serviceGroup.links.map((link, j) => (
                  <li key={j}><a href={link.href} className="hover:text-[#2f6f78] transition-colors">{link.label}</a></li>
                ))}
              </ul>
            </div>
          )}

          {secondaryGroups.map((group, i) => (
            <div key={i} className="flex flex-col gap-4 sm:gap-5">
              <h3 className="text-xs font-medium tracking-widest text-[#2c211b] uppercase">
                {group.title}
              </h3>
              <ul className="flex flex-col gap-2.5 text-xs font-medium">
                {group.links.map((link, j) => (
                  <li key={j}><a href={link.href} className="hover:text-[#2f6f78] transition-colors">{link.label}</a></li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        <div className="pt-8 border-t border-[#2c211b]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#2c211b]/60">
          <p>{copy}</p>
        </div>

      </div>
    </footer>
  );
}
