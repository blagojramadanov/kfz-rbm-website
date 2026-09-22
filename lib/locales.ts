export const locales = ['de', 'en', 'mk'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
  mk: 'Македонски',
};
