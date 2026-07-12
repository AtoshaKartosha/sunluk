import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const [baseMessages, infoMessages] = await Promise.all([
    import(`../../messages/${locale}.json`),
    import(`../../messages/info/${locale}.json`),
  ]);

  return {
    locale,
    messages: {
      ...baseMessages.default,
      info: infoMessages.default,
    },
  };
});
