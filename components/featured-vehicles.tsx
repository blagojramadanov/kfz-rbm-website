import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import { Car, Heart, MapPin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingTypeBadge } from "@/components/listing-type-badge";
import { TEST_DRIVE_HASH } from "@/lib/inquiries";
import { formatMileage, formatPrice } from "@/lib/format-vehicle";
import { Link } from "@/lib/navigation";
import type { PublicVehicle } from "@/lib/public-vehicles";
import { getFuelTypeLabel } from "@/lib/vehicle-labels";

export async function FeaturedVehicles({ vehicles }: { vehicles: PublicVehicle[] }) {
  const t = await getTranslations("pages.home");
  const tCommon = await getTranslations("common");
  const tVehicles = await getTranslations("vehicles");
  const format = await getFormatter();

  if (vehicles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-10 text-center text-gray-600">
        {t("featured.empty")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {vehicles.map((vehicle) => (
        <div
          key={vehicle.id}
          className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
        >
          {/* Image Container */}
          <div className="relative h-64 bg-gray-200 overflow-hidden">
            {vehicle.image ? (
              <Image
                src={vehicle.image}
                alt={`${vehicle.brand} ${vehicle.model}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <Car className="w-16 h-16" aria-hidden="true" />
              </div>
            )}
            <div className="absolute top-4 right-4">
              <button
                aria-label={tVehicles("card.addFavorite")}
                className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
              >
                <Heart className="w-6 h-6 text-red-500" />
              </button>
            </div>
            {(vehicle.featured || vehicle.listingType === "export") && (
              <div className="absolute top-4 left-4 flex flex-col items-start gap-2">
                {vehicle.featured && (
                  <div className="bg-kfz-accent text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {t("featured.featured")}
                  </div>
                )}
                {vehicle.listingType === "export" && <ListingTypeBadge type="export" />}
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
                {formatPrice(format, vehicle.price)}
              </p>
              <p className="text-sm text-gray-600">
                {vehicle.year} • {formatMileage(format, vehicle.mileage)}
              </p>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b">
              {vehicle.fuelType && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Zap className="w-4 h-4 text-kfz-accent" />
                  {getFuelTypeLabel(tCommon, vehicle.fuelType)}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-kfz-accent" />
                {t("vehicles.location")}
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <Button asChild className="w-full bg-kfz-blue hover:bg-kfz-blue-dark text-white">
                <Link href={`/fahrzeuge/${vehicle.slug}`}>{tCommon("viewDetails")}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full border-kfz-blue text-kfz-blue hover:bg-kfz-blue hover:text-white"
              >
                <Link href={`/fahrzeuge/${vehicle.slug}#${TEST_DRIVE_HASH}`}>
                  {t("featured.testDrive")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
