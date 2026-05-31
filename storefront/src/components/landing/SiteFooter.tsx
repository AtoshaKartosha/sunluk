import Link from "next/link";
import { InstagramIcon, SendIcon, YoutubeIcon } from "./icons";
import { BRAND, FOOTER_GROUPS } from "@/lib/landing-data";

export function SiteFooter() {
  return (
    <footer id="contacts" className="bg-[#f4ebe6] border-t border-[#2c211b]/10 py-16 sm:py-24 text-sm text-[#2c211b]/80">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 sm:gap-16 mb-16 sm:mb-20">
          
          {/* Column 1: Logo and social */}
          <div className="lg:col-span-2 flex flex-col items-start gap-6">
            <Link href="/" className="flex flex-col group">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-none border-2 border-[#2c211b] flex items-center justify-center font-serif text-xs font-medium leading-none">
                  {BRAND.name.charAt(0)}
                </span>
                <span className="font-serif text-xl sm:text-2xl font-medium tracking-widest leading-none">
                  {BRAND.name}
                </span>
              </div>
              <span className="text-[8px] sm:text-[9px] tracking-[0.05em] uppercase text-[#2c211b]/70 font-semibold mt-1">
                {BRAND.subtitle}
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

          {FOOTER_GROUPS.map((group, i) => (
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
          <p>© 2026 SUNLUK. Все права защищены.</p>
        </div>

      </div>
    </footer>
  );
}
