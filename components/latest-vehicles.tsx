import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import { Car, Heart, MapPin, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingTypeBadge } from "@/components/listing-type-badge";
import { formatMileage, formatPrice } from "@/lib/format-vehicle";
import { Link } from "@/lib/navigation";
import type { PublicVehicle } from "@/lib/public-vehicles";
import { getFuelTypeLabel } from "@/lib/vehicle-labels";

export async function LatestVehicles({ vehicles }: { vehicles: PublicVehicle[] }) {
  const t = await getTranslations("pages.home");
  const tCommon = await getTranslations("common");
  const tVehicles = await getTranslations("vehicles");
  const format = await getFormatter();

  if (vehicles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-10 text-center text-gray-600">
        {t("latest.empty")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {vehicles.map((vehicle) => (
        <div
          key={vehicle.id}
          className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow overflow-hidden group"
        >
          {/* Image Container */}
          <div className="relative h-48 bg-gray-200 overflow-hidden">
            {vehicle.image ? (
              <Image
                src={vehicle.image}
                alt={`${vehicle.brand} ${vehicle.model}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <Car className="w-12 h-12" aria-hidden="true" />
              </div>
            )}
            {vehicle.listingType === "export" && (
              <div className="absolute top-3 left-3 z-10">
                <ListingTypeBadge type="export" />
              </div>
            )}
            <button
              aria-label={tVehicles("card.addFavorite")}
              className="absolute top-3 right-3 bg-white rounded-full p-2 shadow hover:bg-gray-100 transition-colors z-10"
            >
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
              {formatPrice(format, vehicle.price)}
            </p>

            {/* Specs */}
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{vehicle.year}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Gauge className="w-4 h-4" />
                  {formatMileage(format, vehicle.mileage)}
                </div>
              </div>
              {vehicle.fuelType && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {getFuelTypeLabel(tCommon, vehicle.fuelType)}
                </div>
              )}
            </div>

            {/* CTA */}
            <Button
              asChild
              className="w-full bg-kfz-blue hover:bg-kfz-blue-dark text-white text-sm"
            >
              <Link href={`/fahrzeuge/${vehicle.slug}`}>{tCommon("viewDetails")}</Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
