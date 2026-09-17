"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Gauge, Zap, MapPin } from "lucide-react";
import { Vehicle } from "@/lib/vehicle-data";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    // TODO: Implement favorites
    console.log("Added to favorites:", vehicle.id);
  };

  return (
    <Link href={`/fahrzeuge/${vehicle.slug}`}>
      <div className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden cursor-pointer h-full flex flex-col">
        {/* Image Container */}
        <div className="relative h-64 bg-gray-200 overflow-hidden">
          <Image
            src={vehicle.images[0] || "https://picsum.photos/seed/kfzrbm-card/500/400"}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <button
            onClick={handleFavorite}
            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow hover:bg-gray-100 transition-colors z-10"
          >
            <Heart className="w-5 h-5 text-red-500" />
          </button>

          {/* Price Badge */}
          <div className="absolute bottom-4 left-4 bg-kfz-blue text-white px-3 py-2 rounded-lg font-bold text-lg">
            €{vehicle.price.toLocaleString("de-DE")}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-grow">
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-kfz-blue transition">
            {vehicle.brand} {vehicle.model}
          </h3>

          {/* Key Info Row */}
          <div className="flex gap-4 text-sm text-gray-600 mb-4 pb-4 border-b">
            <span className="font-semibold">{vehicle.year}</span>
            <div className="flex items-center gap-1">
              <Gauge className="w-4 h-4 text-kfz-accent" />
              {(vehicle.mileage / 1000).toFixed(0)}k km
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Zap className="w-4 h-4 text-kfz-accent flex-shrink-0" />
              <span>{vehicle.fuelType}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-kfz-accent flex-shrink-0" />
              <span>{vehicle.powerHp} PS</span>
            </div>
            <div className="col-span-2 text-gray-700">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {vehicle.transmission}
              </span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-xs text-gray-500 space-y-1 mb-4 pb-4 border-b">
            <p>
              <strong>Fahrzeugart:</strong> {vehicle.bodyType}
            </p>
            <p>
              <strong>Farbe:</strong> {vehicle.color}
            </p>
            <p className="text-kfz-accent font-semibold">
              {vehicle.damageHistory === "Unfallfrei" ? "✓ " : ""}
              {vehicle.damageHistory}
            </p>
          </div>

          {/* View Button - Takes up remaining space */}
          <button className="w-full bg-kfz-blue hover:bg-kfz-blue-dark text-white py-2 rounded font-semibold transition-colors mt-auto">
            Details ansehen
          </button>
        </div>
      </div>
    </Link>
  );
}
