"use client";

import { useFormatter, useLocale } from "next-intl";
import { getNumberLocale } from "./i18n/number-locale";

/**
 * Wrapper around useFormatter that maps unsupported locales (like "mk")
 * to supported Intl locales (like "de-DE") for number, currency and date formatting.
 * Browsers without "mk" data fall back to en-US ("50,000", "September 14, 2026"),
 * so mk is formatted with de-DE conventions instead ("50.000", "14.09.2026").
 * Use numeric date formats: month names would come out in German.
 */
export function useLocaleFormatter() {
  const baseFormatter = useFormatter();
  const locale = useLocale();
  const numberLocale = getNumberLocale(locale);

  if (numberLocale === locale) {
    // If the locale is already supported, return the base formatter as-is
    return baseFormatter;
  }

  // For unsupported locales like "mk", override the number and dateTime methods
  return {
    ...baseFormatter,
    number: (value: number | bigint, formatOrOptions?: any): string => {
      // Use the mapped locale (e.g., "de-DE" for "mk")
      const options = typeof formatOrOptions === "string"
        ? undefined
        : formatOrOptions;
      return new Intl.NumberFormat(numberLocale, options).format(value as number);
    },
    dateTime: (value: Date | number, formatOrOptions?: any): string => {
      const options = typeof formatOrOptions === "string"
        ? undefined
        : formatOrOptions;
      return new Intl.DateTimeFormat(numberLocale, options).format(value);
    },
  };
}
