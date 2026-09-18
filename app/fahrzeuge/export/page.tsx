"use client";

import { useState, useMemo } from "react";
import { VehicleCard } from "@/components/vehicle-card";
import { VehicleFilters } from "@/components/vehicle-filters";
import { MOCK_VEHICLES } from "@/lib/vehicle-data";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Globe } from "lucide-react";

type SortOption = "newest" | "price-asc" | "price-desc" | "mileage" | "year";

interface FilterOptions {
  brands: string[];
  models: string[];
  fuelTypes: string[];
  transmissions: string[];
  bodyTypes: string[];
  colors: string[];
}

interface Filters {
  [key: string]: any;
}

export default function ExportFahrzeugeListingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Extract unique filter options from export vehicles
  const filterOptions: FilterOptions = useMemo(() => {
    const brands = [...new Set(MOCK_VEHICLES.map((v) => v.brand))].sort();
    const models = [...new Set(MOCK_VEHICLES.map((v) => v.model))].sort();
    const fuelTypes = [...new Set(MOCK_VEHICLES.map((v) => v.fuelType))].sort();
    const transmissions = [...new Set(MOCK_VEHICLES.map((v) => v.transmission))].sort();
    const bodyTypes = [...new Set(MOCK_VEHICLES.map((v) => v.bodyType))].sort();
    const colors = [...new Set(MOCK_VEHICLES.map((v) => v.color))].sort();

    return { brands, models, fuelTypes, transmissions, bodyTypes, colors };
  }, []);

  // Filter and sort export vehicles
  const filteredAndSortedVehicles = useMemo(() => {
    let filtered = MOCK_VEHICLES.filter((vehicle) => {
      // Search query
      if (
        searchQuery &&
        !`${vehicle.brand} ${vehicle.model}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Apply filters (same as normal fahrzeuge)
      if (filters.brand && vehicle.brand !== filters.brand) return false;
      if (filters.fuelType && vehicle.fuelType !== filters.fuelType) return false;
      if (filters.transmission && vehicle.transmission !== filters.transmission) return false;
      if (filters.bodyType && vehicle.bodyType !== filters.bodyType) return false;
      if (filters.color && vehicle.color !== filters.color) return false;

      return true;
    });

    // Sort vehicles
    filtered.sort((a, b) => {
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

    return filtered;
  }, [searchQuery, sortBy, filters]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Exportfahrzeuge</h1>
          </div>
          <p className="text-blue-100">
            Fahrzeuge für den Export ins Ausland • Professionelle Qualität für internationale Märkte
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Bar */}
        <div className="mb-8 flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Marke, Modell durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <VehicleFilters
              filterOptions={filterOptions}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        )}

        {/* Sort */}
        <div className="mb-8 flex justify-between items-center">
          <p className="text-gray-600">
            {filteredAndSortedVehicles.length} Fahrzeuge gefunden
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Neueste zuerst</option>
            <option value="price-asc">Preis: Niedrig zu Hoch</option>
            <option value="price-desc">Preis: Hoch zu Niedrig</option>
            <option value="mileage">Kilometerstand</option>
            <option value="year">Jahr</option>
          </select>
        </div>

        {/* Vehicle Grid */}
        {filteredAndSortedVehicles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Keine Exportfahrzeuge gefunden</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
