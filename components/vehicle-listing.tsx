"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { SITE_IMAGES } from "@/lib/site-images";
import { Globe, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBodyScrollLock, useEscapeKey } from "@/lib/use-body-scroll-lock";
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
  const tImg = useTranslations("siteImages");
  const tCommon = useTranslations("common");
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

  const closeFilters = useCallback(() => setShowFilters(false), []);
  useBodyScrollLock(showFilters);
  useEscapeKey(showFilters, closeFilters);

  return (
    <div className="min-h-screen bg-muted">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-gradient-to-r from-kfz-blue to-kfz-blue-dark text-primary-foreground py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        {variant === "export" && (
          <>
            <Image
              src={SITE_IMAGES.export}
              alt={tImg("export")}
              fill
              sizes="100vw"
              placeholder="blur"
              // Focus on the ship and cars; keeps the text baked into the photo out of the band
              className="-z-20 object-cover object-[50%_65%]"
            />
            <div
              className="absolute inset-0 -z-10 bg-gradient-to-r from-kfz-blue-dark/90 via-kfz-blue-dark/80 via-60% to-kfz-blue-dark/50"
              aria-hidden="true"
            />
          </>
        )}
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            {variant === "export" && <Globe className="w-8 h-8 shrink-0" aria-hidden="true" />}
            <h1 className="display">{heading}</h1>
          </div>
          <p className="text-lg sm:text-xl text-primary-foreground/80 max-w-2xl">{subheading}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-card border-b py-4 sm:py-6 px-4 sm:px-6 lg:px-8 sm:sticky sm:top-20 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {/* Search Input */}
            <form
              role="search"
              className="relative w-full sm:w-auto sm:flex-1"
              onSubmit={(e) => {
                e.preventDefault();
                commitQuery(query);
              }}
            >
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground/70" aria-hidden="true" />
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
                className="field pl-10 pr-4"
              />
            </form>

            {/* Sort Dropdown */}
            <select
              value={sort}
              aria-label={t("listing.sortLabel")}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="field w-auto flex-1 sm:flex-none min-w-0"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {sortLabels[option]}
                </option>
              ))}
            </select>

            {/* Filter drawer button (below lg; the sidebar is shown from lg) */}
            <Button
              onClick={() => setShowFilters(true)}
              variant="outline"
              className="lg:hidden h-auto min-h-11 shrink-0"
              aria-expanded={showFilters}
              aria-controls="vehicle-filter-drawer"
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" aria-hidden="true" />
              {t("filters.title")}
              {activeFilterCount > 0 && ` (${activeFilterCount})`}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block">{filterPanel}</div>

          {/* Filter drawer - below lg */}
          {showFilters && (
            <div className="lg:hidden fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label={t("filters.title")} id="vehicle-filter-drawer">
              <div className="absolute inset-0 bg-foreground/50 animate-in fade-in" onClick={closeFilters} aria-hidden="true" />
              <div className="relative flex h-full w-full max-w-sm flex-col bg-card shadow-xl animate-in slide-in-from-right duration-200">
                <div className="flex-1 overflow-y-auto overscroll-contain">
                  <VehicleFilters
                    filterOptions={filterOptions}
                    filters={filters}
                    onChange={updateFilters}
                    onReset={resetAll}
                    onClose={closeFilters}
                    closeLabel={tCommon("close")}
                  />
                </div>
                <div className="border-t p-4">
                  <Button size="lg" className="w-full" onClick={closeFilters}>
                    {t("listing.resultsCount", { count: sortedVehicles.length })}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Vehicle Grid */}
          <div className="lg:col-span-3">
            {!hasAnyVehicles ? (
              <div className="card p-8 sm:p-12 text-center">
                <h3 className="card-title mb-2">{emptyTitle}</h3>
                <p className="text-muted-foreground">{emptyHint}</p>
              </div>
            ) : (
              <>
                {/* Results Info */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="section-title" aria-live="polite">
                    {t("listing.resultsCount", { count: sortedVehicles.length })}
                  </h2>
                  {activeFilterCount > 0 && (
                    <Button variant="outline" onClick={resetAll}>
                      {t("listing.resetFilters")}
                    </Button>
                  )}
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
                    <div className="card p-8 sm:p-12 text-center">
                      <h3 className="card-title mb-2">
                        {t("listing.noResultsTitle")}
                      </h3>
                      <p className="text-muted-foreground mb-6">{t("listing.noResultsHint")}</p>
                      <Button onClick={resetAll} >
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
