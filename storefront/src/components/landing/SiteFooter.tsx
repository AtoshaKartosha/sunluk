import Link from "next/link";
import { InstagramIcon, SendIcon, YoutubeIcon } from "./icons";
import { BRAND, getFooterGroups, getCopyright } from "@/lib/landing-data";
import type { FooterGroupData } from "@/lib/landing-data";
import { useLocale, useTranslations } from "next-intl";
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
  const t = useTranslations("footer");
  const defaultLocale = useLocale() as Locale;
  const activeLocale = (locale as Locale) || defaultLocale;
  const groups = footerGroups ?? getFooterGroups(activeLocale);
  const copy = copyright ?? getCopyright(activeLocale);

  const [serviceGroup, ...secondaryGroups] = groups;

  return (
    <footer id="contacts" className="bg-[#f4ebe6] border-t border-[#2c211b]/10 py-16 sm:py-24 text-sm text-[#2c211b]/80">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16">

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-10 sm:gap-x-10 sm:gap-y-12 lg:gap-16 mb-16 sm:mb-20">

          {/* Logo and social */}
          <div className="lg:col-span-2 flex flex-col items-start gap-6">
            <Link href={locale ? `/${locale}` : "/"} className="flex flex-col group">
              <div className="flex items-center gap-2">
                <svg
                  viewBox="435.3 335.2 229.1 204.3"
                  className="w-6 h-6 fill-[#2c211b] transition-colors duration-300 group-hover:fill-[#2f6f78]"
                >
                  <path d="M597.8,408h-73.5c-4.7,0-8.5,3.8-8.5,8.5s3.8,8.5,8.5,8.5h73.5c26.5,0,48,21.5,48,48s-21.5,48-48,48-26.5-5.8-35.6-15.8c0-.6.2-1.2.2-1.9,0-6.9-5.6-12.5-12.5-12.5s-12.5,5.6-12.5,12.5,5.1,11.9,11.5,12.4c12.4,14.1,30.2,22.3,49,22.3,35.9,0,65-29.2,65-65s-29.2-65-65-65ZM544.8,503.3c0-2.8,2.2-5,5-5s5,2.2,5,5-2.2,5-5,5-5-2.2-5-5Z" />
                  <path d="M501.9,466.7h73.5c4.7,0,8.5-3.8,8.5-8.5s-3.8-8.5-8.5-8.5h-73.5c-26.5,0-48-21.5-48-48,0-26.5,21.5-48,48-48s26.5,5.8,35.6,15.8c0,.6-.2,1.2-.2,1.9,0,6.9,5.6,12.5,12.5,12.5,6.9,0,12.5-5.6,12.5-12.5s-5.1-11.9-11.5-12.4c-12.4-14.1-30.2-22.3-49-22.3-35.9,0-65,29.2-65,65s29.2,65,65,65ZM554.9,371.4c0,2.8-2.2,5-5,5s-5-2.2-5-5,2.2-5,5-5,5,2.2,5,5Z" />
                </svg>
                <span className="font-serif text-xl sm:text-2xl font-medium tracking-widest leading-none">
                  {BRAND.name}
                </span>
              </div>
              <span className="text-[8px] sm:text-[9px] tracking-[0.05em] uppercase text-[#2c211b]/70 font-semibold mt-1">
                {t("brandSubtitle")}
              </span>
            </Link>
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
