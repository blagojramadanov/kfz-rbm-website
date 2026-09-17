"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchBar() {
  const [searchParams, setSearchParams] = useState({
    brand: "",
    priceMin: "",
    priceMax: "",
    year: "",
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search navigation
    console.log("Search:", searchParams);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white rounded-lg shadow-xl p-6 max-w-3xl mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        {/* Brand */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Brand
          </label>
          <input
            type="text"
            placeholder="e.g. BMW, Mercedes"
            value={searchParams.brand}
            onChange={(e) =>
              setSearchParams({ ...searchParams, brand: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-accent focus:border-transparent outline-none"
          />
        </div>

        {/* Min Price */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Min Price (€)
          </label>
          <input
            type="number"
            placeholder="5000"
            value={searchParams.priceMin}
            onChange={(e) =>
              setSearchParams({ ...searchParams, priceMin: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-accent focus:border-transparent outline-none"
          />
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Max Price (€)
          </label>
          <input
            type="number"
            placeholder="50000"
            value={searchParams.priceMax}
            onChange={(e) =>
              setSearchParams({ ...searchParams, priceMax: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-accent focus:border-transparent outline-none"
          />
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Year
          </label>
          <input
            type="number"
            placeholder="2023"
            value={searchParams.year}
            onChange={(e) =>
              setSearchParams({ ...searchParams, year: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-accent focus:border-transparent outline-none"
          />
        </div>

        {/* Search Button */}
        <Button
          type="submit"
          className="w-full bg-kfz-accent hover:bg-kfz-accent-light text-white font-semibold py-2"
        >
          <Search className="w-5 h-5 mr-2" />
          Search
        </Button>
      </div>
    </form>
  );
}
