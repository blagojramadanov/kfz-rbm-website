import { getRequestConfig } from 'next-intl/server';

const locales = ['de', 'en', 'mk'] as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  // Set by the middleware, or by setRequestLocale() on statically rendered pages.
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'de';
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
