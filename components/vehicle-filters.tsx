"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, X } from "lucide-react";
import {
  getBodyTypeLabel,
  getColorLabel,
  getFuelTypeLabel,
  getTransmissionLabel,
} from "@/lib/vehicle-labels";
import type { VehicleFilterOptions } from "@/lib/public-vehicles";
import {
  BODY_TYPE_GROUPS,
  FUEL_GROUPS,
  TRANSMISSION_GROUPS,
  countActiveFilters,
  type VehicleSearchFilters,
} from "@/lib/vehicle-search";

type RangeKeys = ["priceMin", "priceMax"] | ["mileageMin", "mileageMax"] | ["yearMin", "yearMax"];
type ChoiceKey = "fuel" | "transmission" | "body" | "color";

/** How long a typed number waits before it is applied (each change reloads the list). */
export const INPUT_DEBOUNCE_MS = 500;

interface VehicleFiltersProps {
  /** The active filters (from the URL). */
  filters: VehicleSearchFilters;
  /** Applies a change; undefined removes that filter. */
  onChange: (patch: Partial<VehicleSearchFilters>) => void;
  onReset: () => void;
  filterOptions: VehicleFilterOptions;
}

/** Ids of the sections that contain an active filter. */
function activeSections(filters: VehicleSearchFilters): string[] {
  const sections: [string, boolean][] = [
    ["brand", Boolean(filters.brand)],
    ["price", filters.priceMin !== undefined || filters.priceMax !== undefined],
    ["mileage", filters.mileageMin !== undefined || filters.mileageMax !== undefined],
    ["year", filters.yearMin !== undefined || filters.yearMax !== undefined],
    ["fuel", Boolean(filters.fuel)],
    ["transmission", Boolean(filters.transmission)],
    ["bodyType", Boolean(filters.body)],
    ["color", Boolean(filters.color)],
  ];
  return sections.filter(([, active]) => active).map(([id]) => id);
}

/** Number input that keeps what is typed locally and applies it after a pause, on blur or Enter. */
function DebouncedNumberInput({
  value,
  onCommit,
  placeholder,
  label,
}: {
  value: number | undefined;
  onCommit: (value: number | undefined) => void;
  placeholder: string;
  label: string;
}) {
  const [draft, setDraft] = useState(value === undefined ? "" : String(value));
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  // The URL changed (reset, back/forward): show its value.
  useEffect(() => {
    setDraft(value === undefined ? "" : String(value));
  }, [value]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const commit = (text: string) => {
    clearTimeout(timer.current);
    const number = text.trim() === "" ? undefined : Number.parseInt(text, 10);
    const next = number !== undefined && Number.isFinite(number) && number >= 0 ? number : undefined;
    if (next !== value) onCommitRef.current(next);
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      placeholder={placeholder}
      aria-label={label}
      value={draft}
      onChange={(e) => {
        const text = e.target.value;
        setDraft(text);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => commit(text), INPUT_DEBOUNCE_MS);
      }}
      onBlur={() => commit(draft)}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit(draft);
      }}
      className="field w-1/2 text-sm"
    />
  );
}

export function VehicleFilters({ filters, onChange, onReset, filterOptions }: VehicleFiltersProps) {
  const t = useTranslations("vehicles");
  const tCommon = useTranslations("common");
  const idPrefix = useId();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(["brand", "price", "mileage", ...activeSections(filters)])
  );

  // A filter set by a link or back/forward must not hide in a collapsed section.
  const activeKey = activeSections(filters).join(",");
  useEffect(() => {
    if (!activeKey) return;
    setExpandedSections((current) => {
      const missing = activeKey.split(",").filter((section) => !current.has(section));
      return missing.length > 0 ? new Set([...current, ...missing]) : current;
    });
  }, [activeKey]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const activeFilterCount = countActiveFilters(filters);
  const models = filters.brand ? filterOptions.models[filters.brand] ?? [] : [];

  const renderSectionHeader = (id: string, title: string) => (
    <button
      type="button"
      onClick={() => toggleSection(id)}
      aria-expanded={expandedSections.has(id)}
      aria-controls={`${idPrefix}-${id}`}
      className="w-full flex items-center justify-between py-2 hover:text-primary transition"
    >
      <span className="font-semibold text-foreground">{title}</span>
      <ChevronDown
        aria-hidden="true"
        className={`w-5 h-5 transition ${expandedSections.has(id) ? "rotate-180" : ""}`}
      />
    </button>
  );

  /** Single choice shown as checkboxes (ticking another one replaces it). */
  const renderChoiceSection = (
    id: string,
    title: string,
    key: ChoiceKey,
    options: { value: string; label: string }[]
  ) => {
    if (options.length === 0) return null;
    return (
      <div className="border-b pb-4">
        {renderSectionHeader(id, title)}
        {expandedSections.has(id) && (
          <div id={`${idPrefix}-${id}`} role="group" aria-label={title} className="mt-3 space-y-2">
            {options.map((option) => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters[key] === option.value}
                  onChange={(e) =>
                    onChange({ [key]: e.target.checked ? option.value : undefined } as Partial<VehicleSearchFilters>)
                  }
                  className="rounded"
                />
                <span className="text-foreground">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderRangeSection = (id: string, title: string, [minKey, maxKey]: RangeKeys, groupLabel: string) => (
    <div className="border-b pb-4">
      {renderSectionHeader(id, title)}
      {expandedSections.has(id) && (
        <div id={`${idPrefix}-${id}`} role="group" aria-label={groupLabel} className="mt-3 space-y-3">
          <div className="flex gap-2">
            <DebouncedNumberInput
              value={filters[minKey]}
              onCommit={(value) => onChange({ [minKey]: value })}
              placeholder={t("from")}
              label={t("filters.rangeFrom", { label: title })}
            />
            <DebouncedNumberInput
              value={filters[maxKey]}
              onCommit={(value) => onChange({ [maxKey]: value })}
              placeholder={t("to")}
              label={t("filters.rangeTo", { label: title })}
            />
          </div>
        </div>
      )}
    </div>
  );

  const selectClass =
    "field text-sm disabled:bg-muted";

  return (
    <div className="card p-6" role="region" aria-label={t("filter")}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="card-title">{t("filters.title")}</h3>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-sm text-kfz-accent hover:text-primary flex items-center gap-1"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            {t("filters.clearAll", { count: activeFilterCount })}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {filterOptions.brands.length > 0 && (
          <div className="border-b pb-4">
            {renderSectionHeader("brand", t("brand"))}
            {expandedSections.has("brand") && (
              <div id={`${idPrefix}-brand`} className="mt-3 space-y-3">
                <select
                  value={filters.brand ?? ""}
                  aria-label={t("filterBrand")}
                  onChange={(e) => onChange({ brand: e.target.value || undefined, model: undefined })}
                  className={selectClass}
                >
                  <option value="">{t("allBrands")}</option>
                  {/* A brand from a shared link that is no longer listed stays selectable. */}
                  {filters.brand && !filterOptions.brands.includes(filters.brand) && (
                    <option value={filters.brand}>{filters.brand}</option>
                  )}
                  {filterOptions.brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.model ?? ""}
                  aria-label={t("filterModel")}
                  disabled={!filters.brand}
                  onChange={(e) => onChange({ model: e.target.value || undefined })}
                  className={selectClass}
                >
                  <option value="">{t("allModels")}</option>
                  {filters.model && !models.includes(filters.model) && (
                    <option value={filters.model}>{filters.model}</option>
                  )}
                  {models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
        {renderRangeSection("price", t("filters.priceEur"), ["priceMin", "priceMax"], t("filterPrice"))}
        {renderRangeSection("mileage", t("mileage"), ["mileageMin", "mileageMax"], t("filterMileage"))}
        {renderRangeSection("year", t("firstRegistration"), ["yearMin", "yearMax"], t("filterYear"))}
        {renderChoiceSection(
          "fuel",
          t("fuelType"),
          "fuel",
          Object.entries(FUEL_GROUPS).map(([value, group]) => ({
            value,
            label: getFuelTypeLabel(tCommon, group.labelValue),
          }))
        )}
        {renderChoiceSection(
          "transmission",
          t("transmission"),
          "transmission",
          Object.entries(TRANSMISSION_GROUPS).map(([value, group]) => ({
            value,
            label: getTransmissionLabel(tCommon, group.labelValue),
          }))
        )}
        {renderChoiceSection(
          "bodyType",
          t("bodyType"),
          "body",
          Object.entries(BODY_TYPE_GROUPS).map(([value, group]) => ({
            value,
            label: getBodyTypeLabel(tCommon, group.labelValue),
          }))
        )}
        {renderChoiceSection(
          "color",
          t("color"),
          "color",
          filterOptions.colors.map((color) => ({ value: color, label: getColorLabel(tCommon, color) }))
        )}
      </div>
    </div>
  );
}
