import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ru", "en"],
  defaultLocale: "ru",
});

export type Locale = (typeof routing.locales)[number];

/** Map URL-prefix locale to Medusa BCP 47 locale code. */
export function toMedusaLocale(locale: Locale): string {
  switch (locale) {
    case "ru":
      return "ru-RU";
    case "en":
      return "en-US";
  }
}
