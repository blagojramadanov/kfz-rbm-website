/**
 * Maps app locales to Intl-compatible locales for number and currency formatting.
 * The browser's Intl API does not support "mk" (Macedonian), so we map it to "de-DE"
 * which uses the same number separators: 85.000 (dot for thousands) and "25.000 €" format.
 */

export function getNumberLocale(locale: string): string {
  const localeMap: Record<string, string> = {
    de: "de-DE",
    en: "en-US",
    mk: "de-DE", // Macedonian uses same separators as German: 85.000, 25.000 €
  };
  return localeMap[locale] || "de-DE";
}

/**
 * Configuration for Intl formatting that can be passed to number/currency format calls.
 * Use this to ensure consistent locale formatting across server and client.
 */
export function getNumberFormatOptions(
  locale: string,
  options?: Intl.NumberFormatOptions
): Intl.NumberFormatOptions {
  return {
    ...options,
    // Note: Intl options are passed as-is; the locale mapping happens at call time
  };
}
