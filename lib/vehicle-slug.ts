/**
 * Slugs of the vehicle detail route (/fahrzeuge/[slug]).
 *
 * Format: `<brand>-<model>-<first 8 hex chars of the vehicle id>`, e.g.
 * `mercedes-benz-c-300-ae0119a8`. The trailing id part makes the slug unique and
 * lets the detail page look a vehicle up by id instead of scanning a list.
 * Old `brand-model` URLs are still resolved through getLegacyVehicleSlug().
 */

const ID_SUFFIX = /-([0-9a-f]{8})$/;

/** Lowercase ASCII slug: diacritics stripped, everything else collapsed to "-". */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getVehicleSlug(vehicle: { id: string; brand: string; model: string }): string {
  const base = slugify(`${vehicle.brand} ${vehicle.model}`) || "vehicle";
  return `${base}-${vehicle.id.slice(0, 8).toLowerCase()}`;
}

/** The pre-id slug format (`brand-model`, not unique). Only used to redirect old URLs. */
export function getLegacyVehicleSlug(vehicle: { brand: string; model: string }): string {
  return `${vehicle.brand}-${vehicle.model}`.toLowerCase().replace(/\s+/g, "-");
}

/** The 8-hex id prefix at the end of a slug, or null for a legacy `brand-model` slug. */
export function getSlugIdPrefix(slug: string): string | null {
  return ID_SUFFIX.exec(slug.toLowerCase())?.[1] ?? null;
}

/** Route params may arrive percent-encoded; falls back to the raw value if malformed. */
export function decodeSlugParam(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}
