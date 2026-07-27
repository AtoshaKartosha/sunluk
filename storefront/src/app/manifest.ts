import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const defaultLocale = routing.defaultLocale as Locale;
  // Fallback to default locale translations for the manifest
  const t = await getTranslations({ locale: defaultLocale, namespace: "metadata" });

  return {
    name: "SUNLUK",
    short_name: "SUNLUK",
    description: t("description"),
    start_url: "/",
    display: "standalone",
    background_color: "#f4ebe6",
    theme_color: "#f4ebe6",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
