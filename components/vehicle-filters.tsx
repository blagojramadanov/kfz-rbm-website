"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, X } from "lucide-react";
import {
  getBodyTypeLabel,
  getColorLabel,
  getFuelTypeLabel,
  getTransmissionLabel,
} from "@/lib/vehicle-labels";

export interface VehicleFilterOptions {
  brands: string[];
  fuelTypes: string[];
  transmissions: string[];
  bodyTypes: string[];
  colors: string[];
}

export interface VehicleFilterValues {
  brand?: string;
  priceMin?: number;
  priceMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  yearMin?: number;
  yearMax?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  color?: string;
}

type SingleValueKey = "brand" | "fuelType" | "transmission" | "bodyType" | "color";
type RangeKeys = ["priceMin", "priceMax"] | ["mileageMin", "mileageMax"] | ["yearMin", "yearMax"];

interface VehicleFiltersProps {
  /** Controlled: the active filters, owned by the parent. */
  filters: VehicleFilterValues;
  onFiltersChange: (filters: VehicleFilterValues) => void;
  filterOptions: VehicleFilterOptions;
}

export function VehicleFilters({
  filters,
  onFiltersChange,
  filterOptions,
}: VehicleFiltersProps) {
  const t = useTranslations("vehicles");
  const tCommon = useTranslations("common");
  const idPrefix = useId();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["brand", "price", "mileage"])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleFilterChange = (key: SingleValueKey, value: string) => {
    const newFilters = { ...filters, [key]: value };
    if (value === "") {
      delete newFilters[key];
    }
    onFiltersChange(newFilters);
  };

  const handleRangeChange = (
    [minKey, maxKey]: RangeKeys,
    minVal: number,
    maxVal: number
  ) => {
    const newFilters = {
      ...filters,
      [minKey]: minVal || undefined,
      [maxKey]: maxVal || undefined,
    };
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== undefined && v !== "").length;

  const renderSectionHeader = (id: string, title: string) => (
    <button
      type="button"
      onClick={() => toggleSection(id)}
      aria-expanded={expandedSections.has(id)}
      aria-controls={`${idPrefix}-${id}`}
      className="w-full flex items-center justify-between py-2 hover:text-kfz-blue transition"
    >
      <span className="font-semibold text-gray-900">{title}</span>
      <ChevronDown
        aria-hidden="true"
        className={`w-5 h-5 transition ${expandedSections.has(id) ? "rotate-180" : ""}`}
      />
    </button>
  );

  const renderCheckboxSection = (
    id: string,
    title: string,
    key: SingleValueKey,
    options: string[],
    getLabel: (value: string) => string,
    groupLabel: string = title
  ) => {
    if (options.length === 0) return null;
    return (
      <div className="border-b pb-4">
        {renderSectionHeader(id, title)}
        {expandedSections.has(id) && (
          <div
            id={`${idPrefix}-${id}`}
            role="group"
            aria-label={groupLabel}
            className="mt-3 space-y-2"
          >
            {options.map((option) => (
              <label key={option} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters[key] === option}
                  onChange={(e) => handleFilterChange(key, e.target.checked ? option : "")}
                  className="rounded"
                />
                <span className="text-gray-700">{getLabel(option)}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderRangeSection = (
    id: string,
    title: string,
    keys: RangeKeys,
    groupLabel: string
  ) => {
    const [minKey, maxKey] = keys;
    return (
      <div className="border-b pb-4">
        {renderSectionHeader(id, title)}
        {expandedSections.has(id) && (
          <div id={`${idPrefix}-${id}`} role="group" aria-label={groupLabel} className="mt-3 space-y-3">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder={t("from")}
                aria-label={t("filters.rangeFrom", { label: title })}
                value={filters[minKey] || ""}
                onChange={(e) =>
                  handleRangeChange(keys, parseInt(e.target.value) || 0, filters[maxKey] || 0)
                }
                className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <input
                type="number"
                placeholder={t("to")}
                aria-label={t("filters.rangeTo", { label: title })}
                value={filters[maxKey] || ""}
                onChange={(e) =>
                  handleRangeChange(keys, filters[minKey] || 0, parseInt(e.target.value) || 0)
                }
                className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6" role="region" aria-label={t("filter")}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">{t("filters.title")}</h3>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-kfz-accent hover:text-kfz-blue flex items-center gap-1"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            {t("filters.clearAll", { count: activeFilterCount })}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {renderCheckboxSection(
          "brand",
          t("brand"),
          "brand",
          filterOptions.brands,
          (value) => value,
          t("filterBrand")
        )}
        {renderRangeSection("price", t("filters.priceEur"), ["priceMin", "priceMax"], t("filterPrice"))}
        {renderRangeSection("mileage", t("mileage"), ["mileageMin", "mileageMax"], t("filterMileage"))}
        {renderRangeSection("year", t("firstRegistration"), ["yearMin", "yearMax"], t("filterYear"))}
        {renderCheckboxSection(
          "fuel",
          t("fuelType"),
          "fuelType",
          filterOptions.fuelTypes,
          (value) => getFuelTypeLabel(tCommon, value)
        )}
        {renderCheckboxSection(
          "transmission",
          t("transmission"),
          "transmission",
          filterOptions.transmissions,
          (value) => getTransmissionLabel(tCommon, value)
        )}
        {renderCheckboxSection(
          "bodyType",
          t("bodyType"),
          "bodyType",
          filterOptions.bodyTypes,
          (value) => getBodyTypeLabel(tCommon, value)
        )}
        {renderCheckboxSection(
          "color",
          t("color"),
          "color",
          filterOptions.colors,
          (value) => getColorLabel(tCommon, value)
        )}
      </div>
    </div>
  );
}
