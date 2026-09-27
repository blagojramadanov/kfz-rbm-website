"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Car, Heart, Search, Trash2 } from "lucide-react";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { useFavorites } from "@/lib/favorites-context";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { formatMileage, formatPrice } from "@/lib/format-vehicle";
import { getFuelTypeLabel, getTransmissionLabel } from "@/lib/vehicle-labels";
import { Button } from "@/components/ui/button";
import type { FavoriteEntry } from "@/app/actions/favorites";

export const dynamic = "force-dynamic";

export default function FavoritesPage() {
  const t = useTranslations("dashboard.favorites");
  const tFavorites = useTranslations("favorites");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");
  const format = useLocaleFormatter();
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();
  const { remove, isPending } = useFavorites();
  // undefined = loading
  const [favorites, setFavorites] = useState<FavoriteEntry[] | undefined>(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  const load = useCallback(async () => {
    try {
      const { getFavorites } = await import("@/app/actions/favorites");
      const result = await getFavorites();
      if (!result.ok) {
        setError(errorMessage(result));
        setFavorites([]);
        return;
      }
      setError("");
      setFavorites(result.favorites);
    } catch (err) {
      console.error("Error loading favorites:", err);
      setError(errorMessage(err));
      setFavorites([]);
    }
    // errorMessage is recreated on every render; loading once per login is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated) void load();
  }, [loading, isAuthenticated, load]);

  const handleRemove = async (vehicleId: string) => {
    if (await remove(vehicleId)) {
      setFavorites((current) => current?.filter((favorite) => favorite.vehicleId !== vehicleId));
    }
  };

  if (loading || !isAuthenticated || favorites === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div>
            <Link href="/dashboard" className="text-kfz-blue hover:underline mb-2 inline-block">
              {tNav("dashboard")}
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-gray-600 mt-1">{t("description")}</p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {favorites.length === 0 && !error ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gray-100 rounded-lg p-6">
                <Heart className="w-12 h-12 text-gray-400" aria-hidden="true" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("empty")}</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{t("emptyDescription")}</p>
            <Button asChild className="bg-kfz-blue hover:bg-kfz-blue-dark text-white font-semibold">
              <Link href="/fahrzeuge">
                {t("browse")}
                <Search className="ml-2 w-4 h-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6" aria-live="polite">
              {t("count", { count: favorites.length })}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map(({ vehicleId, vehicle }) => {
                const pending = isPending(vehicleId);
                const removeButton = (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRemove(vehicleId)}
                    disabled={pending}
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                    {tFavorites("removeShort")}
                  </Button>
                );

                if (!vehicle) {
                  // Sold, reserved or back to draft: RLS no longer returns the vehicle,
                  // so there is no name, image or link to show.
                  return (
                    <div
                      key={vehicleId}
                      className="bg-gray-100 rounded-lg border border-dashed border-gray-300 overflow-hidden flex flex-col"
                    >
                      <div className="h-48 flex items-center justify-center text-gray-400">
                        <Car className="w-12 h-12" aria-hidden="true" />
                      </div>
                      <div className="p-5 flex flex-col gap-4 flex-grow">
                        <div>
                          <p className="font-semibold text-gray-700">{t("unavailableTitle")}</p>
                          <p className="text-sm text-gray-500 mt-1">{t("unavailableHint")}</p>
                        </div>
                        <div className="mt-auto">{removeButton}</div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={vehicleId} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                    <Link href={`/fahrzeuge/${vehicle.slug}`} className="group block">
                      <div className="relative h-48 bg-gray-200 overflow-hidden">
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
                            <Car className="w-12 h-12" aria-hidden="true" />
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 bg-kfz-blue text-white px-3 py-1 rounded-lg font-bold">
                          {formatPrice(format, vehicle.price)}
                        </div>
                      </div>
                      <div className="px-5 pt-4">
                        <h2 className="text-lg font-bold text-gray-900 group-hover:text-kfz-blue transition">
                          {vehicle.brand} {vehicle.model}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {[
                            String(vehicle.year),
                            formatMileage(format, vehicle.mileage),
                            vehicle.fuelType ? getFuelTypeLabel(tCommon, vehicle.fuelType) : null,
                            vehicle.transmission ? getTransmissionLabel(tCommon, vehicle.transmission) : null,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </p>
                      </div>
                    </Link>
                    <div className="p-5 mt-auto">{removeButton}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
