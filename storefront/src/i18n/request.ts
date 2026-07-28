import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import { fetchSiteContent, mergeMessages } from "@/lib/site-content";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const [baseMessages, infoMessages, remoteOverrides] = await Promise.all([
    import(`../../messages/${locale}.json`),
    import(`../../messages/info/${locale}.json`),
    fetchSiteContent(locale),
  ]);

  const localMessages: Record<string, unknown> = {
    ...baseMessages.default,
    info: infoMessages.default,
  };

  const finalMessages = mergeMessages(localMessages, remoteOverrides);

  return {
    locale,
    messages: finalMessages,
  };
});
