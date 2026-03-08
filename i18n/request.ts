import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // When using localePrefix: "never", the locale is detected from the request
  // but URLs don't have locale prefixes
  const locale = await requestLocale;

  const validLocale = (routing.locales.includes(locale as any) ? locale : routing.defaultLocale) as string;
  const messages = (await import(`../messages/${validLocale}.json`)).default;

  return {
    locale: validLocale,
    messages,
  };
});
