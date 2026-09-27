"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/lib/navigation";
import { formatMileage, formatPrice } from "@/lib/format-vehicle";
import type { VehicleFilterOptions } from "@/lib/public-vehicles";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { getBodyTypeLabel, getFuelTypeLabel, getTransmissionLabel } from "@/lib/vehicle-labels";
import { VEHICLE_LIMITS } from "@/lib/vehicle-schema";
import {
  BODY_TYPE_GROUPS,
  FUEL_GROUPS,
  TRANSMISSION_GROUPS,
  parseVehicleSearch,
  toSearchQuery,
} from "@/lib/vehicle-search";

const PRICE_STEPS = [5_000, 10_000, 15_000, 20_000, 25_000, 30_000, 40_000, 50_000, 75_000, 100_000];
const MILEAGE_STEPS = [10_000, 25_000, 50_000, 75_000, 100_000, 125_000, 150_000, 200_000];
const YEARS_BACK = 25;

const FIELDS = [
  "q",
  "brand",
  "model",
  "priceMax",
  "yearMin",
  "mileageMax",
  "fuel",
  "transmission",
  "body",
] as const;
type Field = (typeof FIELDS)[number];

/**
 * Homepage search. Submitting opens /fahrzeuge with the filters as query params;
 * the values go through the same parser as the listing page, so only valid ones
 * end up in the URL.
 */
export function SearchBar({ filterOptions }: { filterOptions: VehicleFilterOptions }) {
  const t = useTranslations("pages.home.search");
  const tVehicles = useTranslations("vehicles");
  const tCommon = useTranslations("common");
  const format = useLocaleFormatter();
  const router = useRouter();
  const [values, setValues] = useState<Record<Field, string>>(
    () => Object.fromEntries(FIELDS.map((field) => [field, ""])) as Record<Field, string>
  );

  const set = (field: Field, value: string) =>
    setValues((current) => ({
      ...current,
      [field]: value,
      // A model belongs to one brand.
      ...(field === "brand" ? { model: "" } : {}),
    }));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    for (const field of FIELDS) {
      if (values[field]) params.set(field, values[field]);
    }
    const query = toSearchQuery(parseVehicleSearch(params));
    router.push(query ? `/fahrzeuge?${query}` : "/fahrzeuge");
  };

  const models = values.brand ? filterOptions.models[values.brand] ?? [] : [];
  const newestYear = VEHICLE_LIMITS.maxYear - 1;
  const years = Array.from({ length: YEARS_BACK + 1 }, (_, index) => newestYear - index);

  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";
  const inputClass =
    "w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-kfz-accent focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-400";

  const select = (field: Field, label: string, options: { value: string; label: string }[], disabled = false) => (
    <div>
      <label htmlFor={`home-search-${field}`} className={labelClass}>
        {label}
      </label>
      <select
        id={`home-search-${field}`}
        value={values[field]}
        onChange={(e) => set(field, e.target.value)}
        disabled={disabled}
        className={inputClass}
      >
        <option value="">{t("any")}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <form
      onSubmit={handleSearch}
      role="search"
      aria-label={t("title")}
      className="bg-white rounded-lg shadow-xl p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-4">{t("title")}</h2>

      <div className="mb-4">
        <label htmlFor="home-search-q" className={labelClass}>
          {t("query")}
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" aria-hidden="true" />
          <input
            id="home-search-q"
            type="search"
            maxLength={80}
            placeholder={t("queryPlaceholder")}
            value={values.q}
            onChange={(e) => set("q", e.target.value)}
            className={`${inputClass} pl-10`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {select(
          "brand",
          tVehicles("brand"),
          filterOptions.brands.map((brand) => ({ value: brand, label: brand }))
        )}
        {select(
          "model",
          t("model"),
          models.map((model) => ({ value: model, label: model })),
          !values.brand
        )}
        {select(
          "priceMax",
          t("priceMax"),
          PRICE_STEPS.map((price) => ({
            value: String(price),
            label: t("upTo", { value: formatPrice(format, price) }),
          }))
        )}
        {select(
          "yearMin",
          t("yearMin"),
          years.map((year) => ({ value: String(year), label: t("from", { value: String(year) }) }))
        )}
        {select(
          "mileageMax",
          t("mileageMax"),
          MILEAGE_STEPS.map((mileage) => ({
            value: String(mileage),
            label: t("upTo", { value: formatMileage(format, mileage) }),
          }))
        )}
        {select(
          "fuel",
          tVehicles("fuelType"),
          Object.entries(FUEL_GROUPS).map(([value, group]) => ({
            value,
            label: getFuelTypeLabel(tCommon, group.labelValue),
          }))
        )}
        {select(
          "transmission",
          tVehicles("transmission"),
          Object.entries(TRANSMISSION_GROUPS).map(([value, group]) => ({
            value,
            label: getTransmissionLabel(tCommon, group.labelValue),
          }))
        )}
        {select(
          "body",
          t("bodyType"),
          Object.entries(BODY_TYPE_GROUPS).map(([value, group]) => ({
            value,
            label: getBodyTypeLabel(tCommon, group.labelValue),
          }))
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="submit"
          className="w-full sm:w-auto bg-kfz-accent hover:bg-kfz-accent-light text-white font-semibold py-2 px-8"
        >
          <Search className="w-5 h-5 mr-2" aria-hidden="true" />
          {t("search")}
        </Button>
      </div>
    </form>
  );
}
