"use client";

import Image from "next/image";
import { Heart, MapPin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  image: string;
  featured: boolean;
}

const FEATURED_VEHICLES: Vehicle[] = [
  {
    id: "1",
    brand: "BMW",
    model: "3 Series",
    year: 2023,
    price: 45000,
    mileage: 12000,
    fuelType: "Diesel",
    image: "https://picsum.photos/seed/kfzrbm-19/500/400",
    featured: true,
  },
  {
    id: "2",
    brand: "Mercedes-Benz",
    model: "C-Class",
    year: 2022,
    price: 52000,
    mileage: 25000,
    fuelType: "Petrol",
    image: "https://picsum.photos/seed/kfzrbm-20/500/400",
    featured: true,
  },
  {
    id: "3",
    brand: "Audi",
    model: "A4",
    year: 2023,
    price: 48000,
    mileage: 8000,
    fuelType: "Diesel",
    image: "https://picsum.photos/seed/kfzrbm-21/500/400",
    featured: true,
  },
  {
    id: "4",
    brand: "Volkswagen",
    model: "Passat",
    year: 2021,
    price: 35000,
    mileage: 45000,
    fuelType: "Diesel",
    image: "https://picsum.photos/seed/kfzrbm-22/500/400",
    featured: true,
  },
  {
    id: "5",
    brand: "Porsche",
    model: "911",
    year: 2022,
    price: 95000,
    mileage: 18000,
    fuelType: "Petrol",
    image: "https://picsum.photos/seed/kfzrbm-23/500/400",
    featured: true,
  },
  {
    id: "6",
    brand: "Skoda",
    model: "Superb",
    year: 2023,
    price: 38000,
    mileage: 5000,
    fuelType: "Petrol",
    image: "https://picsum.photos/seed/kfzrbm-24/500/400",
    featured: true,
  },
];

export function FeaturedVehicles() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {FEATURED_VEHICLES.map((vehicle) => (
        <div
          key={vehicle.id}
          className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
        >
          {/* Image Container */}
          <div className="relative h-64 bg-gray-200 overflow-hidden">
            <Image
              src={vehicle.image}
              alt={`${vehicle.brand} ${vehicle.model}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-4 right-4">
              <button className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors">
                <Heart className="w-6 h-6 text-red-500" />
              </button>
            </div>
            {vehicle.featured && (
              <div className="absolute top-4 left-4 bg-kfz-accent text-white px-3 py-1 rounded-full text-sm font-semibold">
                Featured
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {vehicle.brand} {vehicle.model}
            </h3>

            {/* Price */}
            <div className="mb-4">
              <p className="text-3xl font-bold text-kfz-blue">
                €{vehicle.price.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                {vehicle.year} • {vehicle.mileage.toLocaleString()} km
              </p>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Zap className="w-4 h-4 text-kfz-accent" />
                {vehicle.fuelType}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-kfz-accent" />
                Germany
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <Button className="w-full bg-kfz-blue hover:bg-kfz-blue-dark text-white">
                View Details
              </Button>
              <Button
                variant="outline"
                className="w-full border-kfz-blue text-kfz-blue hover:bg-kfz-blue hover:text-white"
              >
                Test Drive
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
