"use client";

import { useState, useMemo } from "react";
import { VehicleCard } from "@/components/vehicle-card";
import { VehicleFilters } from "@/components/vehicle-filters";
import { MOCK_VEHICLES } from "@/lib/vehicle-data";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";

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

export default function FahrzeugeListingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Extract unique filter options from vehicles
  const filterOptions: FilterOptions = useMemo(() => {
    const brands = [...new Set(MOCK_VEHICLES.map((v) => v.brand))].sort();
    const models = [...new Set(MOCK_VEHICLES.map((v) => v.model))].sort();
    const fuelTypes = [...new Set(MOCK_VEHICLES.map((v) => v.fuelType))].sort();
    const transmissions = [...new Set(MOCK_VEHICLES.map((v) => v.transmission))].sort();
    const bodyTypes = [...new Set(MOCK_VEHICLES.map((v) => v.bodyType))].sort();
    const colors = [...new Set(MOCK_VEHICLES.map((v) => v.color))].sort();

    return { brands, models, fuelTypes, transmissions, bodyTypes, colors };
  }, []);

  // Filter and sort vehicles
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

      // Apply filters
      if (
        filters.brand &&
        vehicle.brand !== filters.brand
      ) {
        return false;
      }
      if (
        filters.fuelType &&
        vehicle.fuelType !== filters.fuelType
      ) {
        return false;
      }
      if (
        filters.transmission &&
        vehicle.transmission !== filters.transmission
      ) {
        return false;
      }
      if (
        filters.bodyType &&
        vehicle.bodyType !== filters.bodyType
      ) {
        return false;
      }
      if (
        filters.color &&
        vehicle.color !== filters.color
      ) {
        return false;
      }
      if (
        filters.damageHistory &&
        vehicle.damageHistory !== filters.damageHistory
      ) {
        return false;
      }
      if (
        filters.taxable &&
        vehicle.taxable !== filters.taxable
      ) {
        return false;
      }

      // Range filters
      if (filters.priceMin && vehicle.price < filters.priceMin) {
        return false;
      }
      if (filters.priceMax && vehicle.price > filters.priceMax) {
        return false;
      }
      if (filters.mileageMin && vehicle.mileage < filters.mileageMin) {
        return false;
      }
      if (filters.mileageMax && vehicle.mileage > filters.mileageMax) {
        return false;
      }
      if (filters.yearMin && vehicle.year < filters.yearMin) {
        return false;
      }
      if (filters.yearMax && vehicle.year > filters.yearMax) {
        return false;
      }

      return true;
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
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
          return 0;
      }
    });

    return sorted;
  }, [searchQuery, filters, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-kfz-blue to-kfz-blue-dark text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Fahrzeuginventar
          </h1>
          <p className="text-xl text-blue-100">
            Durchsuchen Sie unsere Auswahl an Premium-Fahrzeugen
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b py-6 px-4 sm:px-6 lg:px-8 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Marke, Modell..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-accent focus:border-transparent outline-none"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-accent focus:border-transparent outline-none bg-white"
            >
              <option value="newest">Neueste</option>
              <option value="price-asc">Preis aufsteigend</option>
              <option value="price-desc">Preis absteigend</option>
              <option value="mileage">Kilometer</option>
              <option value="year">Erstzulassung</option>
            </select>

            {/* Mobile Filter Button */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="sm:hidden"
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filter
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
              initialFilters={filters}
            />
          </div>

          {/* Mobile Filters - Collapsible */}
          {showFilters && (
            <div className="lg:hidden mb-8">
              <VehicleFilters
                filterOptions={filterOptions}
                onFiltersChange={setFilters}
                initialFilters={filters}
              />
            </div>
          )}

          {/* Vehicle Grid */}
          <div className="lg:col-span-3">
            {/* Results Info */}
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {filteredAndSortedVehicles.length} Fahrzeug
                {filteredAndSortedVehicles.length !== 1 ? "e" : ""} gefunden
              </h2>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="ghost"
                className="lg:hidden"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </Button>
            </div>

            {/* Vehicle Cards Grid */}
            {filteredAndSortedVehicles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                {filteredAndSortedVehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Keine Fahrzeuge gefunden
                </h3>
                <p className="text-gray-600 mb-6">
                  Versuchen Sie, die Filter anzupassen oder die Suche zu verfeinern.
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({});
                    setSortBy("newest");
                  }}
                  className="bg-kfz-blue hover:bg-kfz-blue-dark text-white"
                >
                  Filter zurücksetzen
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
