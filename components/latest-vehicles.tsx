"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Heart, MapPin, Gauge } from "lucide-react";
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
}

const LATEST_VEHICLES: Vehicle[] = [
  {
    id: "l1",
    brand: "Tesla",
    model: "Model 3",
    year: 2023,
    price: 55000,
    mileage: 5000,
    fuelType: "Elektro",
    image: "https://picsum.photos/seed/kfzrbm-15/500/400",
  },
  {
    id: "l2",
    brand: "Porsche",
    model: "Cayenne",
    year: 2022,
    price: 75000,
    mileage: 22000,
    fuelType: "Diesel",
    image: "https://picsum.photos/seed/kfzrbm-16/500/400",
  },
  {
    id: "l3",
    brand: "BMW",
    model: "X5",
    year: 2023,
    price: 65000,
    mileage: 8000,
    fuelType: "Diesel",
    image: "https://picsum.photos/seed/kfzrbm-17/500/400",
  },
  {
    id: "l4",
    brand: "Mercedes-Benz",
    model: "GLE",
    year: 2023,
    price: 72000,
    mileage: 6000,
    fuelType: "Diesel",
    image: "https://picsum.photos/seed/kfzrbm-18/500/400",
  },
];

export function LatestVehicles() {
  const t = useTranslations("pages.home");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {LATEST_VEHICLES.map((vehicle) => (
        <div
          key={vehicle.id}
          className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow overflow-hidden group"
        >
          {/* Image Container */}
          <div className="relative h-48 bg-gray-200 overflow-hidden">
            <Image
              src={vehicle.image}
              alt={`${vehicle.brand} ${vehicle.model}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <button className="absolute top-3 right-3 bg-white rounded-full p-2 shadow hover:bg-gray-100 transition-colors z-10">
              <Heart className="w-5 h-5 text-red-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="text-lg font-bold text-gray-900">
              {vehicle.brand} {vehicle.model}
            </h3>

            {/* Price */}
            <p className="text-2xl font-bold text-kfz-blue mt-2 mb-2">
              €{vehicle.price.toLocaleString()}
            </p>

            {/* Specs */}
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{vehicle.year}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Gauge className="w-4 h-4" />
                  {vehicle.mileage.toLocaleString()} km
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {vehicle.fuelType}
              </div>
            </div>

            {/* CTA */}
            <Button className="w-full bg-kfz-blue hover:bg-kfz-blue-dark text-white text-sm">
              {t("latest.viewDetails")}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
