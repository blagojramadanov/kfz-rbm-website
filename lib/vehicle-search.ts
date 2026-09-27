import { VEHICLE_LIMITS } from "@/lib/vehicle-schema";

/**
 * Vehicle search filters as URL query params (homepage search, /fahrzeuge,
 * /fahrzeuge/export). Pure functions, used on the server (parse searchParams,
 * build the query) and on the client (read/write the URL).
 *
 * Invalid or unknown params are dropped, never an error: a shared or hand-edited
 * link always renders a list.
 */

/**
 * Fuel, transmission and body type are stored with mixed spellings
 * ("Benzin"/"gasoline", "Sedan"/"sedan"). A filter value is a group key; the group
 * lists the DB spellings it matches (compared case-insensitively) and the value its
 * label is looked up with (an existing `common.*` key, via lib/vehicle-labels.ts).
 */
interface FilterGroup {
  /** Passed to getFuelTypeLabel() & co. */
  labelValue: string;
  /** Lowercase DB spellings. */
  matches: readonly string[];
}

export const FUEL_GROUPS = {
  petrol: { labelValue: "Petrol", matches: ["petrol", "gasoline", "benzin"] },
  diesel: { labelValue: "diesel", matches: ["diesel"] },
  electric: { labelValue: "electric", matches: ["electric", "elektro"] },
  hybrid: { labelValue: "hybrid", matches: ["hybrid"] },
} as const satisfies Record<string, FilterGroup>;

export const TRANSMISSION_GROUPS = {
  manual: { labelValue: "manual", matches: ["manual", "manuell", "schaltgetriebe"] },
  automatic: { labelValue: "automatic", matches: ["automatic", "automatik"] },
  cvt: { labelValue: "cvt", matches: ["cvt"] },
} as const satisfies Record<string, FilterGroup>;

export const BODY_TYPE_GROUPS = {
  sedan: { labelValue: "sedan", matches: ["sedan", "limousine"] },
  kombi: { labelValue: "kombi", matches: ["kombi"] },
  suv: { labelValue: "suv", matches: ["suv"] },
  coupe: { labelValue: "coupe", matches: ["coupe", "coupé"] },
  cabriolet: { labelValue: "cabriolet", matches: ["cabriolet", "cabrio"] },
  kleinwagen: { labelValue: "kleinwagen", matches: ["kleinwagen"] },
  van: { labelValue: "van", matches: ["van"] },
} as const satisfies Record<string, FilterGroup>;

export type FuelFilter = keyof typeof FUEL_GROUPS;
export type TransmissionFilter = keyof typeof TRANSMISSION_GROUPS;
export type BodyTypeFilter = keyof typeof BODY_TYPE_GROUPS;

export const SORT_OPTIONS = ["newest", "price-asc", "price-desc", "mileage", "year"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export interface VehicleSearchFilters {
  /** Free text, matched against brand and model. */
  q?: string;
  brand?: string;
  model?: string;
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  fuel?: FuelFilter;
  transmission?: TransmissionFilter;
  body?: BodyTypeFilter;
  color?: string;
  /** Not a filter; "newest" is the default and never written to the URL. */
  sort?: SortOption;
}

export type FilterKey = Exclude<keyof VehicleSearchFilters, "sort">;

const TEXT_MAX = 60;
const QUERY_MAX = 80;

/** URL param order (keeps generated links stable). */
const PARAM_ORDER = [
  "q",
  "brand",
  "model",
  "priceMin",
  "priceMax",
  "yearMin",
  "yearMax",
  "mileageMin",
  "mileageMax",
  "fuel",
  "transmission",
  "body",
  "color",
  "sort",
] as const satisfies readonly (keyof VehicleSearchFilters)[];

const NUMBER_RANGES = {
  priceMin: [0, VEHICLE_LIMITS.maxPrice],
  priceMax: [0, VEHICLE_LIMITS.maxPrice],
  yearMin: [VEHICLE_LIMITS.minYear, VEHICLE_LIMITS.maxYear],
  yearMax: [VEHICLE_LIMITS.minYear, VEHICLE_LIMITS.maxYear],
  mileageMin: [0, VEHICLE_LIMITS.maxMileage],
  mileageMax: [0, VEHICLE_LIMITS.maxMileage],
} as const;
type NumberKey = keyof typeof NUMBER_RANGES;

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function readParam(source: ParamSource, key: string): string | undefined {
  const value = source instanceof URLSearchParams ? source.get(key) ?? undefined : source[key];
  return Array.isArray(value) ? value[0] : value;
}

/** Trimmed, whitespace-collapsed text without control characters; undefined when empty. */
export function cleanText(value: string | undefined, max = TEXT_MAX): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .trim();
  return cleaned || undefined;
}

/** Whole number inside [min, max]; anything else (text, decimals, negative) is undefined. */
function parseInteger(value: string | undefined, [min, max]: readonly [number, number]): number | undefined {
  if (!value || !/^\d{1,10}$/.test(value.trim())) return undefined;
  const number = Number(value.trim());
  return number >= min && number <= max ? number : undefined;
}

function parseKey<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return allowed.find((key) => key === value);
}

export function parseVehicleSearch(source: ParamSource): VehicleSearchFilters {
  const filters: VehicleSearchFilters = {
    q: cleanText(readParam(source, "q"), QUERY_MAX),
    brand: cleanText(readParam(source, "brand")),
    model: cleanText(readParam(source, "model")),
    color: cleanText(readParam(source, "color")),
    fuel: parseKey(readParam(source, "fuel"), Object.keys(FUEL_GROUPS) as FuelFilter[]),
    transmission: parseKey(
      readParam(source, "transmission"),
      Object.keys(TRANSMISSION_GROUPS) as TransmissionFilter[],
    ),
    body: parseKey(readParam(source, "body"), Object.keys(BODY_TYPE_GROUPS) as BodyTypeFilter[]),
    sort: parseKey(readParam(source, "sort"), SORT_OPTIONS),
  };
  for (const key of Object.keys(NUMBER_RANGES) as NumberKey[]) {
    filters[key] = parseInteger(readParam(source, key), NUMBER_RANGES[key]);
  }
  // A model only makes sense together with its brand.
  if (!filters.brand) filters.model = undefined;
  return compact(filters);
}

/** Drops undefined values and the default sort. */
function compact(filters: VehicleSearchFilters): VehicleSearchFilters {
  const result: VehicleSearchFilters = {};
  for (const key of PARAM_ORDER) {
    const value = filters[key];
    if (value === undefined || value === "") continue;
    if (key === "sort" && value === "newest") continue;
    (result as Record<string, unknown>)[key] = value;
  }
  return result;
}

/** Query string without "?" (empty when nothing is set). */
export function toSearchQuery(filters: VehicleSearchFilters): string {
  const params = new URLSearchParams();
  const clean = compact(filters);
  for (const key of PARAM_ORDER) {
    const value = clean[key];
    if (value !== undefined) params.set(key, String(value));
  }
  return params.toString();
}

/** Number of active filters (sort does not count). */
export function countActiveFilters(filters: VehicleSearchFilters): number {
  return Object.keys(compact(filters)).filter((key) => key !== "sort").length;
}

/** Every case variant of the group's spellings, for an exact `.in()` match. */
export function groupDbValues(matches: readonly string[]): string[] {
  const variants = new Set<string>();
  for (const value of matches) {
    variants.add(value);
    variants.add(value.toUpperCase());
    variants.add(value.charAt(0).toUpperCase() + value.slice(1));
  }
  return [...variants];
}

/**
 * Search words (max. 5), each matched against brand or model with
 * `ilike "%word%"` inside `.or()`. Removed from the words: the LIKE wildcards
 * % and _, the escape character \, and the PostgREST syntax characters " , ( ).
 * PostgREST drops a backslash inside a quoted value, so escaping them is not
 * reliable; no brand or model needs them. The word is then double-quoted, so a
 * "." (e.g. "2.0") stays literal.
 */
export function searchWords(q: string | undefined): string[] {
  return (q ?? "")
    .replace(/[%_\\"(),]/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 5);
}

export function containsPattern(word: string): string {
  return `"%${word}%"`;
}
