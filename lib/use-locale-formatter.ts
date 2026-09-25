"use client";

import { useFormatter, useLocale } from "next-intl";
import { getNumberLocale } from "./i18n/number-locale";

/**
 * Wrapper around useFormatter that maps unsupported locales (like "mk")
 * to supported Intl locales (like "de-DE") for number and currency formatting.
 * This ensures consistent number formatting across server and client.
 */
export function useLocaleFormatter() {
  const baseFormatter = useFormatter();
  const locale = useLocale();
  const numberLocale = getNumberLocale(locale);

  if (numberLocale === locale) {
    // If the locale is already supported, return the base formatter as-is
    return baseFormatter;
  }

  // For unsupported locales like "mk", override the number method
  return {
    ...baseFormatter,
    number: (value: number | bigint, formatOrOptions?: any): string => {
      // Use the mapped locale (e.g., "de-DE" for "mk")
      const options = typeof formatOrOptions === "string"
        ? undefined
        : formatOrOptions;
      return new Intl.NumberFormat(numberLocale, options).format(value as number);
    },
  };
}
