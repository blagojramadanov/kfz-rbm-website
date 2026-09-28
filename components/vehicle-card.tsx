"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Car, Gauge, Zap, MapPin } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { Link } from "@/lib/navigation";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { formatMileage, formatPrice } from "@/lib/format-vehicle";
import type { PublicVehicle } from "@/lib/public-vehicles";
import {
  getBodyTypeLabel,
  getColorLabel,
  getFuelTypeLabel,
  getTransmissionLabel,
} from "@/lib/vehicle-labels";

interface VehicleCardProps {
  vehicle: PublicVehicle;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const t = useTranslations("vehicles");
  const tCommon = useTranslations("common");
  const format = useLocaleFormatter();

  const hasExtraInfo = Boolean(vehicle.bodyType || vehicle.color);

  return (
    <Link href={`/fahrzeuge/${vehicle.slug}`}>
      <div className="group card hover:shadow-xl transition-all overflow-hidden cursor-pointer h-full flex flex-col">
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
              <Car className="w-16 h-16" aria-label={t("card.noImage")} role="img" />
            </div>
          )}
          <FavoriteButton vehicleId={vehicle.id} className="absolute top-4 right-4 z-10" />

          {/* Price Badge */}
          <div className="absolute bottom-4 left-4 bg-primary text-primary-foreground px-3 py-2 rounded-lg font-bold text-lg">
            {formatPrice(format, vehicle.price)}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-grow">
          {/* Title */}
          <h3 className="card-title mb-2 group-hover:text-primary transition">
            {vehicle.brand} {vehicle.model}
          </h3>

          {/* Key Info Row */}
          <div className="flex gap-4 text-sm text-muted-foreground mb-4 pb-4 border-b">
            <span className="font-semibold">{vehicle.year}</span>
            <div className="flex items-center gap-1">
              <Gauge className="w-4 h-4 text-kfz-accent" aria-hidden="true" />
              {formatMileage(format, vehicle.mileage)}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            {vehicle.fuelType && (
              <div className="flex items-center gap-2 text-foreground">
                <Zap className="w-4 h-4 text-kfz-accent flex-shrink-0" aria-hidden="true" />
                <span>{getFuelTypeLabel(tCommon, vehicle.fuelType)}</span>
              </div>
            )}
            {vehicle.powerHp != null && (
              <div className="flex items-center gap-2 text-foreground">
                <MapPin className="w-4 h-4 text-kfz-accent flex-shrink-0" aria-hidden="true" />
                <span>{t("powerValue", { value: format.number(vehicle.powerHp) })}</span>
              </div>
            )}
            {vehicle.transmission && (
              <div className="col-span-2 text-foreground">
                <span className="text-xs bg-secondary px-2 py-1 rounded">
                  {getTransmissionLabel(tCommon, vehicle.transmission)}
                </span>
              </div>
            )}
          </div>

          {/* Additional Info */}
          {hasExtraInfo && (
            <div className="text-xs text-muted-foreground space-y-1 mb-4 pb-4 border-b">
              {vehicle.bodyType && (
                <p>
                  <strong>{t("bodyType")}:</strong> {getBodyTypeLabel(tCommon, vehicle.bodyType)}
                </p>
              )}
              {vehicle.color && (
                <p>
                  <strong>{t("color")}:</strong> {getColorLabel(tCommon, vehicle.color)}
                </p>
              )}
            </div>
          )}

          {/* View Button - Takes up remaining space. The whole card is the link. */}
          <span className="block w-full bg-primary group-hover:bg-primary-hover text-primary-foreground py-2 rounded font-semibold text-center transition-colors mt-auto">
            {tCommon("viewDetails")}
          </span>
        </div>
      </div>
    </Link>
  );
}
