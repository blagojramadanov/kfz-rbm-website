"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

interface FilterOptions {
  brands: string[];
  models: string[];
  fuelTypes: string[];
  transmissions: string[];
  bodyTypes: string[];
  colors: string[];
}

interface Filters {
  brand?: string;
  model?: string;
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
  tu?: string;
  au?: string;
  damageHistory?: string;
  taxable?: string;
  powerMin?: number;
  powerMax?: number;
}

interface VehicleFiltersProps {
  onFiltersChange: (filters: Filters) => void;
  initialFilters?: Filters;
  filterOptions: FilterOptions;
}

export function VehicleFilters({
  onFiltersChange,
  initialFilters = {},
  filterOptions,
}: VehicleFiltersProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["marke", "preis", "kilometer"])
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

  const handleFilterChange = (key: keyof Filters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    if (value === "" || value === null) {
      delete newFilters[key];
    }
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleRangeChange = (minKey: keyof Filters, maxKey: keyof Filters, minVal: number, maxVal: number) => {
    const newFilters = {
      ...filters,
      [minKey]: minVal || undefined,
      [maxKey]: maxVal || undefined,
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== "").length;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Filter</h3>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-kfz-accent hover:text-kfz-blue flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Alle löschen ({activeFilterCount})
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Marke */}
        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection("marke")}
            className="w-full flex items-center justify-between py-2 hover:text-kfz-blue transition"
          >
            <span className="font-semibold text-gray-900">Marke</span>
            <ChevronDown
              className={`w-5 h-5 transition ${expandedSections.has("marke") ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSections.has("marke") && (
            <div className="mt-3 space-y-2">
              {filterOptions.brands.map((brand) => (
                <label key={brand} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.brand === brand}
                    onChange={(e) => handleFilterChange("brand", e.target.checked ? brand : "")}
                    className="rounded"
                  />
                  <span className="text-gray-700">{brand}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Preis */}
        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection("preis")}
            className="w-full flex items-center justify-between py-2 hover:text-kfz-blue transition"
          >
            <span className="font-semibold text-gray-900">Preis (€)</span>
            <ChevronDown
              className={`w-5 h-5 transition ${expandedSections.has("preis") ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSections.has("preis") && (
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Von"
                  value={filters.priceMin || ""}
                  onChange={(e) =>
                    handleRangeChange(
                      "priceMin",
                      "priceMax",
                      parseInt(e.target.value) || 0,
                      filters.priceMax || 0
                    )
                  }
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="number"
                  placeholder="Bis"
                  value={filters.priceMax || ""}
                  onChange={(e) =>
                    handleRangeChange(
                      "priceMin",
                      "priceMax",
                      filters.priceMin || 0,
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Kilometer */}
        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection("kilometer")}
            className="w-full flex items-center justify-between py-2 hover:text-kfz-blue transition"
          >
            <span className="font-semibold text-gray-900">Kilometer</span>
            <ChevronDown
              className={`w-5 h-5 transition ${expandedSections.has("kilometer") ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSections.has("kilometer") && (
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Von"
                  value={filters.mileageMin || ""}
                  onChange={(e) =>
                    handleRangeChange(
                      "mileageMin",
                      "mileageMax",
                      parseInt(e.target.value) || 0,
                      filters.mileageMax || 0
                    )
                  }
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="number"
                  placeholder="Bis"
                  value={filters.mileageMax || ""}
                  onChange={(e) =>
                    handleRangeChange(
                      "mileageMin",
                      "mileageMax",
                      filters.mileageMin || 0,
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Erstzulassung */}
        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection("erstzulassung")}
            className="w-full flex items-center justify-between py-2 hover:text-kfz-blue transition"
          >
            <span className="font-semibold text-gray-900">Erstzulassung</span>
            <ChevronDown
              className={`w-5 h-5 transition ${expandedSections.has("erstzulassung") ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSections.has("erstzulassung") && (
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Von"
                  value={filters.yearMin || ""}
                  onChange={(e) =>
                    handleRangeChange(
                      "yearMin",
                      "yearMax",
                      parseInt(e.target.value) || 0,
                      filters.yearMax || 0
                    )
                  }
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="number"
                  placeholder="Bis"
                  value={filters.yearMax || ""}
                  onChange={(e) =>
                    handleRangeChange(
                      "yearMin",
                      "yearMax",
                      filters.yearMin || 0,
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Kraftstoff */}
        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection("kraftstoff")}
            className="w-full flex items-center justify-between py-2 hover:text-kfz-blue transition"
          >
            <span className="font-semibold text-gray-900">Kraftstoff</span>
            <ChevronDown
              className={`w-5 h-5 transition ${expandedSections.has("kraftstoff") ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSections.has("kraftstoff") && (
            <div className="mt-3 space-y-2">
              {filterOptions.fuelTypes.map((fuel) => (
                <label key={fuel} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.fuelType === fuel}
                    onChange={(e) => handleFilterChange("fuelType", e.target.checked ? fuel : "")}
                    className="rounded"
                  />
                  <span className="text-gray-700">{fuel}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Getriebe */}
        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection("getriebe")}
            className="w-full flex items-center justify-between py-2 hover:text-kfz-blue transition"
          >
            <span className="font-semibold text-gray-900">Getriebe</span>
            <ChevronDown
              className={`w-5 h-5 transition ${expandedSections.has("getriebe") ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSections.has("getriebe") && (
            <div className="mt-3 space-y-2">
              {filterOptions.transmissions.map((trans) => (
                <label key={trans} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.transmission === trans}
                    onChange={(e) => handleFilterChange("transmission", e.target.checked ? trans : "")}
                    className="rounded"
                  />
                  <span className="text-gray-700">{trans}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Fahrzeugart */}
        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection("fahrzeugart")}
            className="w-full flex items-center justify-between py-2 hover:text-kfz-blue transition"
          >
            <span className="font-semibold text-gray-900">Fahrzeugart</span>
            <ChevronDown
              className={`w-5 h-5 transition ${expandedSections.has("fahrzeugart") ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSections.has("fahrzeugart") && (
            <div className="mt-3 space-y-2">
              {filterOptions.bodyTypes.map((type) => (
                <label key={type} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.bodyType === type}
                    onChange={(e) => handleFilterChange("bodyType", e.target.checked ? type : "")}
                    className="rounded"
                  />
                  <span className="text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Farbe */}
        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection("farbe")}
            className="w-full flex items-center justify-between py-2 hover:text-kfz-blue transition"
          >
            <span className="font-semibold text-gray-900">Farbe</span>
            <ChevronDown
              className={`w-5 h-5 transition ${expandedSections.has("farbe") ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSections.has("farbe") && (
            <div className="mt-3 space-y-2">
              {filterOptions.colors.map((color) => (
                <label key={color} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.color === color}
                    onChange={(e) => handleFilterChange("color", e.target.checked ? color : "")}
                    className="rounded"
                  />
                  <span className="text-gray-700">{color}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Unfallfrei */}
        <div className="border-b pb-4">
          <button
            onClick={() => toggleSection("unfallfrei")}
            className="w-full flex items-center justify-between py-2 hover:text-kfz-blue transition"
          >
            <span className="font-semibold text-gray-900">Unfallfrei</span>
            <ChevronDown
              className={`w-5 h-5 transition ${expandedSections.has("unfallfrei") ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSections.has("unfallfrei") && (
            <div className="mt-3 space-y-2">
              {["Unfallfrei", "Mit Schaden"].map((value) => (
                <label key={value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.damageHistory === value}
                    onChange={(e) =>
                      handleFilterChange("damageHistory", e.target.checked ? value : "")
                    }
                    className="rounded"
                  />
                  <span className="text-gray-700">{value}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* MwSt. ausweisbar */}
        <div className="pb-4">
          <button
            onClick={() => toggleSection("mwst")}
            className="w-full flex items-center justify-between py-2 hover:text-kfz-blue transition"
          >
            <span className="font-semibold text-gray-900">MwSt. ausweisbar</span>
            <ChevronDown
              className={`w-5 h-5 transition ${expandedSections.has("mwst") ? "rotate-180" : ""}`}
            />
          </button>
          {expandedSections.has("mwst") && (
            <div className="mt-3 space-y-2">
              {["Ja", "Nein"].map((value) => (
                <label key={value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.taxable === value}
                    onChange={(e) => handleFilterChange("taxable", e.target.checked ? value : "")}
                    className="rounded"
                  />
                  <span className="text-gray-700">{value}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
