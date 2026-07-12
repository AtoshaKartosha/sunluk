import { getTranslations } from "next-intl/server";
import SiteHeader from "@/components/landing/SiteHeader";
import { SiteFooter } from "@/components/landing/SiteFooter";
import type { Locale } from "@/i18n/routing";
import { getNavLinks, getFooterGroups, getCopyright } from "@/lib/landing-data";
import { INFO_SECTION_IDS } from "@/lib/info-sections";

export const dynamic = "force-dynamic";

type InfoBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "info" });
  return { title: t("pageTitle") };
}

export default async function InfoPage({ params }: Props) {
  const { locale } = await params;
  const resolvedLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: "info" });

  return (
    <div className="min-h-screen flex flex-col bg-[#f4ebe6] text-[#2c211b] antialiased selection:bg-[#2f6f78] selection:text-white">
      <SiteHeader navLinks={getNavLinks(resolvedLocale)} />
      <main className="flex-1 w-full">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-10 lg:px-16 py-16 sm:py-24">
          <div className="mb-12 lg:mb-16">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide text-[#2c211b] uppercase">
              {t("pageTitle")}
            </h1>
            <div className="w-16 h-0.5 bg-[#2f6f78] mt-4" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 lg:gap-16">
            {/* Left Column: Nav */}
            <aside className="lg:sticky lg:top-28 self-start">
              <nav aria-label="Info navigation" className="flex flex-col gap-4">
                {INFO_SECTION_IDS.map((id) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="text-sm font-medium tracking-wider text-[#2c211b]/70 hover:text-[#2f6f78] transition-colors uppercase"
                  >
                    {t(`${id}.title`)}
                  </a>
                ))}
              </nav>
            </aside>

            {/* Right Column: Content */}
            <div className="space-y-16 lg:space-y-24">
              {INFO_SECTION_IDS.map((id) => {
                const title = t(`${id}.title`);
                const blocks = t.raw(`${id}.blocks`) as InfoBlock[];

                return (
                  <section key={id} id={id} className="scroll-mt-24">
                    <h2 className="font-serif text-2xl lg:text-3xl font-light tracking-wide text-[#2c211b] uppercase mb-6 pb-2 border-b border-[#2c211b]/10">
                      {title}
                    </h2>
                    <div className="space-y-4 text-base leading-relaxed text-[#2c211b]/80">
                      {blocks.map((block, index) => {
                        if (block.type === "heading") {
                          return (
                            <h3
                              key={index}
                              className="pt-5 font-serif text-xl font-semibold tracking-wide text-[#2c211b]"
                            >
                              {block.text}
                            </h3>
                          );
                        }

                        if (block.type === "list") {
                          return (
                            <ul key={index} className="list-disc space-y-2 pl-6">
                              {block.items.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          );
                        }

                        return (
                          <p key={index} className="whitespace-pre-line">
                            {block.text}
                          </p>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter
        locale={resolvedLocale}
        footerGroups={getFooterGroups(resolvedLocale)}
        copyright={getCopyright(resolvedLocale)}
      />
    </div>
  );
}
