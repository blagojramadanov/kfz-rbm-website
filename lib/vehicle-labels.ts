/**
 * Label helpers for values that come straight from the database
 * (e.g. fuel_type = "Elektro", "Diesel", "Petrol").
 *
 * DB values are never translated or changed; they are only mapped to a label
 * when the shared `common.*` maps know them. An unknown value falls back to the
 * raw value so a message key is never rendered.
 */

// Loose on purpose: next-intl's `t` is typed against the message shape, which
// does not allow keys built from runtime data.
type Translator = {
  (key: any): string;
  has(key: any): boolean;
};

/**
 * Looks `value` up in `common.<group>`: first as-is, then trimmed and lowercased
 * (so "Silber" and "silber" hit the same lowercase key). Values that contain a
 * "." are never looked up because next-intl would read them as a nested path.
 */
function getLabel(t: Translator, group: string, value: string): string {
  if (!value || value.includes(".")) return value;
  for (const candidate of new Set([value, value.trim().toLowerCase()])) {
    const key = `${group}.${candidate}`;
    if (t.has(key)) return t(key);
  }
  return value;
}

/** `t` must come from `useTranslations("common")` / `getTranslations("common")`. */
export function getFuelTypeLabel(t: Translator, value: string): string {
  return getLabel(t, "fuelTypes", value);
}

/** `t` must come from `useTranslations("common")` / `getTranslations("common")`. */
export function getTransmissionLabel(t: Translator, value: string): string {
  return getLabel(t, "transmissions", value);
}

/** Body type (e.g. "Sedan", "SUV"). `t` must come from the `common` namespace. */
export function getBodyTypeLabel(t: Translator, value: string): string {
  return getLabel(t, "bodyTypes", value);
}

/** Exterior colour (free text in the DB, e.g. "Silber"). `t` must come from the `common` namespace. */
export function getColorLabel(t: Translator, value: string): string {
  return getLabel(t, "colors", value);
}

/** Export condition (`vehicles.zustand`: fahrbereit, nicht_fahrbereit, unfallwagen). `t` must come from the `common` namespace. */
export function getVehicleConditionLabel(t: Translator, value: string): string {
  return getLabel(t, "vehicleConditions", value);
}
