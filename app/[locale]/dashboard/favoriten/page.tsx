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
import { PageHeader } from "@/components/page-header";

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
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <PageHeader
        title={t("title")}
        description={t("description")}
        backHref="/dashboard"
        backLabel={tNav("dashboard")}
      />

      <main className="page-container">
        {error && (
          <div className="bg-destructive-subtle/50 border border-destructive-border rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-destructive-subtle-foreground">{error}</p>
          </div>
        )}

        {favorites.length === 0 && !error ? (
          <div className="card p-8 sm:p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-secondary rounded-lg p-6">
                <Heart className="w-12 h-12 text-muted-foreground/70" aria-hidden="true" />
              </div>
            </div>
            <h2 className="section-title mb-2">{t("empty")}</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t("emptyDescription")}</p>
            <Button asChild >
              <Link href="/fahrzeuge">
                {t("browse")}
                <Search className="ml-2 w-4 h-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground mb-6" aria-live="polite">
              {t("count", { count: favorites.length })}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map(({ vehicleId, vehicle }) => {
                const pending = isPending(vehicleId);
                const removeButton = (
                  <Button
                    type="button"
                    variant="outline-destructive"
                    onClick={() => handleRemove(vehicleId)}
                    disabled={pending}
                    className="w-full"
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
                      className="bg-secondary rounded-lg border border-dashed border-input overflow-hidden flex flex-col"
                    >
                      <div className="h-48 flex items-center justify-center text-muted-foreground/70">
                        <Car className="w-12 h-12" aria-hidden="true" />
                      </div>
                      <div className="p-5 flex flex-col gap-4 flex-grow">
                        <div>
                          <p className="font-semibold text-foreground">{t("unavailableTitle")}</p>
                          <p className="text-sm text-muted-foreground mt-1">{t("unavailableHint")}</p>
                        </div>
                        <div className="mt-auto">{removeButton}</div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={vehicleId} className="card overflow-hidden flex flex-col">
                    <Link href={`/fahrzeuge/${vehicle.slug}`} className="group block">
                      <div className="relative h-48 bg-border overflow-hidden">
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
                            <Car className="w-12 h-12" aria-hidden="true" />
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 bg-primary text-primary-foreground px-3 py-1 rounded-lg font-bold">
                          {formatPrice(format, vehicle.price)}
                        </div>
                      </div>
                      <div className="px-5 pt-4">
                        <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition">
                          {vehicle.brand} {vehicle.model}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
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
