/**
 * Label helpers for values that come straight from the database
 * (e.g. fuel_type = "Elektro", "Diesel", "Petrol").
 *
 * DB values are never translated or changed; they are only mapped to a label
 * when the shared `common.fuelTypes` map knows them. An unknown value falls
 * back to the raw value so a message key is never rendered.
 */

// Loose on purpose: next-intl's `t` is typed against the message shape, which
// does not allow keys built from runtime data.
type Translator = {
  (key: any): string;
  has(key: any): boolean;
};

/** `t` must come from `useTranslations("common")` / `getTranslations("common")`. */
export function getFuelTypeLabel(t: Translator, value: string): string {
  const key = `fuelTypes.${value}`;
  return t.has(key) ? t(key) : value;
}

/** `t` must come from `useTranslations("common")` / `getTranslations("common")`. */
export function getTransmissionLabel(t: Translator, value: string): string {
  const key = `transmissions.${value}`;
  return t.has(key) ? t(key) : value;
}
