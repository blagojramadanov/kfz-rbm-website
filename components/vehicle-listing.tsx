"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Globe, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicle-card";
import { INPUT_DEBOUNCE_MS, VehicleFilters } from "@/components/vehicle-filters";
import type { PublicVehicle, VehicleFilterOptions } from "@/lib/public-vehicles";
import {
  SORT_OPTIONS,
  cleanText,
  countActiveFilters,
  parseVehicleSearch,
  toSearchQuery,
  type SortOption,
  type VehicleSearchFilters,
} from "@/lib/vehicle-search";

interface VehicleListingProps {
  /** Already filtered on the server for the URL the page was rendered with. */
  vehicles: PublicVehicle[];
  /** Brand/model/color choices over all listed vehicles of this type. */
  filterOptions: VehicleFilterOptions;
  /** "export" adds the globe icon to the header. */
  variant: "sale" | "export";
  heading: string;
  subheading: string;
  /** Shown when there are no vehicles at all (not when filters exclude them). */
  emptyTitle: string;
  emptyHint: string;
}

function sortVehicles(vehicles: PublicVehicle[], sort: SortOption): PublicVehicle[] {
  const newest = (a: PublicVehicle, b: PublicVehicle) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  return [...vehicles].sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return a.price - b.price || newest(a, b);
      case "price-desc":
        return b.price - a.price || newest(a, b);
      case "mileage":
        return a.mileage - b.mileage || newest(a, b);
      case "year":
        return b.year - a.year || newest(a, b);
      case "newest":
      default:
        return newest(a, b);
    }
  });
}

/**
 * Search + filters + sorting. The URL is the source of truth: every change is
 * written to the query string (router.replace, so no extra history entry per
 * keystroke), the server page re-runs the query, and links, reload and
 * back/forward all show the same list. Sorting only reorders what is loaded,
 * so it updates the URL without a server round trip.
 */
export function VehicleListing({
  vehicles,
  filterOptions,
  variant,
  heading,
  subheading,
  emptyTitle,
  emptyHint,
}: VehicleListingProps) {
  const t = useTranslations("vehicles");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);

  const filters = useMemo(() => parseVehicleSearch(searchParams), [searchParams]);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const urlFor = (next: VehicleSearchFilters) => {
    const query = toSearchQuery(next);
    return query ? `${pathname}?${query}` : pathname;
  };

  const applyFilters = (next: VehicleSearchFilters) => {
    const url = urlFor(next);
    startTransition(() => router.replace(url, { scroll: false }));
  };

  const updateFilters = (patch: Partial<VehicleSearchFilters>) =>
    applyFilters({ ...filtersRef.current, ...patch });

  // Free text: typed locally, applied after a pause.
  const [query, setQuery] = useState(filters.q ?? "");
  const queryTimer = useRef<ReturnType<typeof setTimeout>>();
  const committedQuery = useRef(filters.q);
  useEffect(() => {
    // Only take the URL value when it did not come from our own typing
    // (reset, back/forward, a link), so a slow reload never overwrites new input.
    if (filters.q !== committedQuery.current) {
      committedQuery.current = filters.q;
      setQuery(filters.q ?? "");
    }
  }, [filters.q]);
  useEffect(() => () => clearTimeout(queryTimer.current), []);

  const commitQuery = (text: string) => {
    clearTimeout(queryTimer.current);
    const q = cleanText(text, 80);
    if (q === filtersRef.current.q) return;
    committedQuery.current = q;
    updateFilters({ q });
  };

  const sort = filters.sort ?? "newest";
  const handleSortChange = (next: SortOption) => {
    // Shallow: the loaded list is reordered on the client; Next.js keeps
    // useSearchParams in sync with history.replaceState. Pass null, not
    // history.state: Next skips the sync for its own state objects.
    window.history.replaceState(null, "", urlFor({ ...filtersRef.current, sort: next }));
  };

  const resetAll = () => {
    clearTimeout(queryTimer.current);
    committedQuery.current = undefined;
    setQuery("");
    applyFilters({});
  };

  const sortLabels: Record<SortOption, string> = {
    newest: t("listing.sort.newest"),
    "price-asc": t("listing.sort.priceAsc"),
    "price-desc": t("listing.sort.priceDesc"),
    mileage: t("listing.sort.mileage"),
    year: t("listing.sort.year"),
  };

  const sortedVehicles = useMemo(() => sortVehicles(vehicles, sort), [vehicles, sort]);
  const activeFilterCount = countActiveFilters(filters);
  // Every listed vehicle has a brand, so no brands = nothing listed at all.
  const hasAnyVehicles = filterOptions.brands.length > 0;

  const filterPanel = (
    <VehicleFilters
      filterOptions={filterOptions}
      filters={filters}
      onChange={updateFilters}
      onReset={resetAll}
    />
  );

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
            <form
              role="search"
              className="flex-1 relative"
              onSubmit={(e) => {
                e.preventDefault();
                commitQuery(query);
              }}
            >
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" aria-hidden="true" />
              <input
                type="search"
                placeholder={t("listing.searchPlaceholder")}
                aria-label={t("listing.searchLabel")}
                value={query}
                maxLength={80}
                onChange={(e) => {
                  const text = e.target.value;
                  setQuery(text);
                  clearTimeout(queryTimer.current);
                  queryTimer.current = setTimeout(() => commitQuery(text), INPUT_DEBOUNCE_MS);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-accent focus:border-transparent outline-none"
              />
            </form>

            {/* Sort Dropdown */}
            <select
              value={sort}
              aria-label={t("listing.sortLabel")}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-accent focus:border-transparent outline-none bg-white"
            >
              {SORT_OPTIONS.map((option) => (
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
              {activeFilterCount > 0 && ` (${activeFilterCount})`}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block">{filterPanel}</div>

          {/* Mobile Filters - Collapsible */}
          {showFilters && <div className="lg:hidden mb-8">{filterPanel}</div>}

          {/* Vehicle Grid */}
          <div className="lg:col-span-3">
            {!hasAnyVehicles ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{emptyTitle}</h3>
                <p className="text-gray-600">{emptyHint}</p>
              </div>
            ) : (
              <>
                {/* Results Info */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold text-gray-900" aria-live="polite">
                    {t("listing.resultsCount", { count: sortedVehicles.length })}
                  </h2>
                  <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                      <Button variant="outline" onClick={resetAll}>
                        {t("listing.resetFilters")}
                      </Button>
                    )}
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
                </div>

                <div
                  aria-busy={isPending}
                  className={`transition-opacity ${isPending ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {sortedVehicles.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                      {sortedVehicles.map((vehicle) => (
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
