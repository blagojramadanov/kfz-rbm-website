"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Globe, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicle-card";
import {
  VehicleFilters,
  type VehicleFilterOptions,
  type VehicleFilterValues,
} from "@/components/vehicle-filters";
import type { PublicVehicle } from "@/lib/public-vehicles";

type SortOption = "newest" | "price-asc" | "price-desc" | "mileage" | "year";

interface VehicleListingProps {
  vehicles: PublicVehicle[];
  /** "export" adds the globe icon to the header. */
  variant: "sale" | "export";
  heading: string;
  subheading: string;
  /** Shown when there are no vehicles at all (not when filters exclude them). */
  emptyTitle: string;
  emptyHint: string;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}

/** Search + filters + sorting over the vehicles the server page loaded. */
export function VehicleListing({
  vehicles,
  variant,
  heading,
  subheading,
  emptyTitle,
  emptyHint,
}: VehicleListingProps) {
  const t = useTranslations("vehicles");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filters, setFilters] = useState<VehicleFilterValues>({});
  const [showFilters, setShowFilters] = useState(false);

  const sortLabels: Record<SortOption, string> = {
    newest: t("listing.sort.newest"),
    "price-asc": t("listing.sort.priceAsc"),
    "price-desc": t("listing.sort.priceDesc"),
    mileage: t("listing.sort.mileage"),
    year: t("listing.sort.year"),
  };

  // Unique filter options from the vehicles (raw DB values; labels are mapped in the filters)
  const filterOptions: VehicleFilterOptions = useMemo(
    () => ({
      brands: uniqueSorted(vehicles.map((v) => v.brand)),
      fuelTypes: uniqueSorted(vehicles.map((v) => v.fuelType)),
      transmissions: uniqueSorted(vehicles.map((v) => v.transmission)),
      bodyTypes: uniqueSorted(vehicles.map((v) => v.bodyType)),
      colors: uniqueSorted(vehicles.map((v) => v.color)),
    }),
    [vehicles]
  );

  const filteredAndSortedVehicles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = vehicles.filter((vehicle) => {
      if (query && !`${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(query)) return false;

      if (filters.brand && vehicle.brand !== filters.brand) return false;
      if (filters.fuelType && vehicle.fuelType !== filters.fuelType) return false;
      if (filters.transmission && vehicle.transmission !== filters.transmission) return false;
      if (filters.bodyType && vehicle.bodyType !== filters.bodyType) return false;
      if (filters.color && vehicle.color !== filters.color) return false;

      if (filters.priceMin && vehicle.price < filters.priceMin) return false;
      if (filters.priceMax && vehicle.price > filters.priceMax) return false;
      if (filters.mileageMin && vehicle.mileage < filters.mileageMin) return false;
      if (filters.mileageMax && vehicle.mileage > filters.mileageMax) return false;
      if (filters.yearMin && vehicle.year < filters.yearMin) return false;
      if (filters.yearMax && vehicle.year > filters.yearMax) return false;

      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "mileage":
          return a.mileage - b.mileage;
        case "year":
          return b.year - a.year;
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [searchQuery, filters, sortBy, vehicles]);

  const resetAll = () => {
    setSearchQuery("");
    setFilters({});
    setSortBy("newest");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-kfz-blue to-kfz-blue-dark text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            {variant === "export" && <Globe className="w-8 h-8" aria-hidden="true" />}
            <h1 className="text-4xl sm:text-5xl font-bold">{heading}</h1>
          </div>
          <p className="text-xl text-blue-100">{subheading}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b py-6 px-4 sm:px-6 lg:px-8 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                placeholder={t("listing.searchPlaceholder")}
                aria-label={t("listing.searchLabel")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-accent focus:border-transparent outline-none"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              aria-label={t("listing.sortLabel")}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-accent focus:border-transparent outline-none bg-white"
            >
              {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                <option key={option} value={option}>
                  {sortLabels[option]}
                </option>
              ))}
            </select>

            {/* Mobile Filter Button */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="sm:hidden"
              aria-expanded={showFilters}
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" aria-hidden="true" />
              {t("filters.title")}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block">
            <VehicleFilters
              filterOptions={filterOptions}
              onFiltersChange={setFilters}
              filters={filters}
            />
          </div>

          {/* Mobile Filters - Collapsible */}
          {showFilters && (
            <div className="lg:hidden mb-8">
              <VehicleFilters
                filterOptions={filterOptions}
                onFiltersChange={setFilters}
                filters={filters}
              />
            </div>
          )}

          {/* Vehicle Grid */}
          <div className="lg:col-span-3">
            {/* Results Info */}
            {vehicles.length > 0 && (
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900" aria-live="polite">
                  {t("listing.resultsCount", { count: filteredAndSortedVehicles.length })}
                </h2>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="ghost"
                  className="lg:hidden"
                  aria-label={t("listing.toggleFilters")}
                  aria-expanded={showFilters}
                >
                  <SlidersHorizontal className="w-5 h-5" aria-hidden="true" />
                </Button>
              </div>
            )}

            {/* Vehicle Cards Grid */}
            {vehicles.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{emptyTitle}</h3>
                <p className="text-gray-600">{emptyHint}</p>
              </div>
            ) : filteredAndSortedVehicles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                {filteredAndSortedVehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {t("listing.noResultsTitle")}
                </h3>
                <p className="text-gray-600 mb-6">{t("listing.noResultsHint")}</p>
                <Button onClick={resetAll} className="bg-kfz-blue hover:bg-kfz-blue-dark text-white">
                  {t("listing.resetFilters")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
