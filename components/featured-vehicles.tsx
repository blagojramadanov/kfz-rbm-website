import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import { Car, MapPin, Zap } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
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
  const format = await getFormatter();

  if (vehicles.length === 0) {
    return (
      <div className="card p-8 sm:p-10 text-center text-muted-foreground">
        {t("featured.empty")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {vehicles.map((vehicle) => (
        <div
          key={vehicle.id}
          className="card hover:shadow-xl transition-shadow overflow-hidden group"
        >
          {/* Image Container */}
          <div className="relative h-64 bg-border overflow-hidden">
            {vehicle.image ? (
              <Image
                src={vehicle.image}
                alt={`${vehicle.brand} ${vehicle.model}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/70">
                <Car className="w-16 h-16" aria-hidden="true" />
              </div>
            )}
            <FavoriteButton vehicleId={vehicle.id} size="md" className="absolute top-4 right-4 z-10 shadow-md" />
            {(vehicle.featured || vehicle.listingType === "export") && (
              <div className="absolute top-4 left-4 flex flex-col items-start gap-2">
                {vehicle.featured && (
                  <div className="bg-kfz-accent text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                    {t("featured.featured")}
                  </div>
                )}
                {vehicle.listingType === "export" && <ListingTypeBadge type="export" />}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="card-title mb-2">
              {vehicle.brand} {vehicle.model}
            </h3>

            {/* Price */}
            <div className="mb-4">
              <p className="text-3xl font-bold text-primary">
                {formatPrice(format, vehicle.price)}
              </p>
              <p className="text-sm text-muted-foreground">
                {vehicle.year} • {formatMileage(format, vehicle.mileage)}
              </p>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b">
              {vehicle.fuelType && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="w-4 h-4 text-kfz-accent" />
                  {getFuelTypeLabel(tCommon, vehicle.fuelType)}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-kfz-accent" />
                {t("vehicles.location")}
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href={`/fahrzeuge/${vehicle.slug}`}>{tCommon("viewDetails")}</Link>
              </Button>
              <Button
                asChild
                variant="outline-primary"
                className="w-full"
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
