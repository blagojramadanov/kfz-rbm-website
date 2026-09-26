"use client";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Plus, Car, Clock, CheckCircle, AlertCircle } from "lucide-react";
import Image from "next/image";
import type { SubmittedVehicle } from "@/lib/supabase";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { getFuelTypeLabel, getTransmissionLabel } from "@/lib/vehicle-labels";

type DashboardVehicleStatus = "eingereicht" | "in_bearbeitung" | "angebot_gesendet" | "akzeptiert" | "abgelehnt";

export const dynamic = "force-dynamic";

export default function MyVehiclesPage() {
  const t = useTranslations("dashboard.vehicles");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");
  const formatter = useLocaleFormatter();
  const router = useRouter();
  const { loading, isAuthenticated, user } = useAuth();
  const errorMessage = useErrorMessage();
  const [vehicles, setVehicles] = useState<SubmittedVehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const formatCurrency = (value: number) => {
    return formatter.number(value, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const getStatusConfig = (status: DashboardVehicleStatus): { label: string; color: string; icon: React.ReactNode; bgColor: string } => {
    const statusLabel = t(`status.${status}`);
    const icons: Record<DashboardVehicleStatus, React.ReactNode> = {
      eingereicht: <Clock className="w-4 h-4" />,
      in_bearbeitung: <Clock className="w-4 h-4" />,
      angebot_gesendet: <CheckCircle className="w-4 h-4" />,
      akzeptiert: <CheckCircle className="w-4 h-4" />,
      abgelehnt: <AlertCircle className="w-4 h-4" />,
    };
    const colors: Record<DashboardVehicleStatus, string> = {
      eingereicht: "text-blue-600",
      in_bearbeitung: "text-yellow-600",
      angebot_gesendet: "text-green-600",
      akzeptiert: "text-green-700",
      abgelehnt: "text-red-600",
    };
    const bgColors: Record<DashboardVehicleStatus, string> = {
      eingereicht: "bg-blue-100",
      in_bearbeitung: "bg-yellow-100",
      angebot_gesendet: "bg-green-100",
      akzeptiert: "bg-green-200",
      abgelehnt: "bg-red-100",
    };
    return {
      label: statusLabel,
      color: colors[status],
      icon: icons[status],
      bgColor: bgColors[status],
    };
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      fetchVehicles();
    }
  }, [user]);

  const fetchVehicles = async () => {
    if (!user) return;
    try {
      setLoadingVehicles(true);
      const { getSubmittedVehicles } = await import("@/app/actions/vehicles");
      const result = await getSubmittedVehicles();
      if (!result.ok) {
        alert(errorMessage(result));
        return;
      }
      const data = result.vehicles;
      setVehicles(data || []);

      // Fetch signed URLs for all images
      if (data && data.length > 0) {
        const allPaths = data.flatMap(v => v.images || []);
        if (allPaths.length > 0) {
          const { getSignedImageUrls } = await import("@/app/actions/storage");
          const signed = await getSignedImageUrls(allPaths);
          if (signed.ok) {
            const urlMap = Object.fromEntries(signed.urls.filter(u => u.url).map(u => [u.path, u.url!]));
            setImageUrls(urlMap);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      alert(errorMessage(error));
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleAcceptOffer = async (vehicleId: string) => {
    if (!user || !confirm(t("acceptConfirm"))) {
      return;
    }

    try {
      const { acceptOffer } = await import("@/app/actions/vehicles");
      const result = await acceptOffer(vehicleId);
      if (!result.ok) {
        alert(errorMessage(result));
        return;
      }
      await fetchVehicles();
    } catch (error) {
      console.error("Error accepting offer:", error);
      alert(errorMessage(error));
    }
  };

  const handleRejectOffer = async (vehicleId: string) => {
    if (!user || !confirm(t("rejectConfirm"))) {
      return;
    }

    try {
      const { rejectOffer } = await import("@/app/actions/vehicles");
      const result = await rejectOffer(vehicleId);
      if (!result.ok) {
        alert(errorMessage(result));
        return;
      }
      await fetchVehicles();
    } catch (error) {
      console.error("Error rejecting offer:", error);
      alert(errorMessage(error));
    }
  };


  if (loading || !isAuthenticated) {
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
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard" className="text-kfz-blue hover:underline mb-2 inline-block text-sm">
                ← {tNav("dashboard")}
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                {t("title")}
              </h1>
              <p className="text-gray-600 mt-1">
                {t("description")}
              </p>
            </div>
            <Link href="/dashboard/fahrzeug-anbieten">
              <Button className="bg-kfz-blue hover:bg-kfz-blue-dark text-white font-semibold">
                <Plus className="mr-2 w-4 h-4" />
                {t("addNew")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loadingVehicles ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
              <p className="text-gray-600">{t("loading")}</p>
            </div>
          </div>
        ) : vehicles.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gray-100 rounded-lg p-6">
                <Car className="w-12 h-12 text-gray-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t("empty")}
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {t("emptyDescription")}
            </p>
            <Link href="/dashboard/fahrzeug-anbieten">
              <Button className="bg-kfz-blue hover:bg-kfz-blue-dark text-white font-semibold">
                <Plus className="mr-2 w-4 h-4" />
                {t("firstVehicle")}
              </Button>
            </Link>
          </div>
        ) : (
          // Vehicle Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => {
              const status = (vehicle.status as DashboardVehicleStatus) || "eingereicht";
              const config = getStatusConfig(status);

              return (
                <div key={vehicle.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image */}
                  <div className="relative w-full aspect-video bg-gray-200 overflow-hidden">
                    {vehicle.images && vehicle.images.length > 0 && imageUrls[vehicle.images[0]] ? (
                      <Image
                        src={imageUrls[vehicle.images[0]]}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium mb-3 ${config.bgColor} ${config.color}`}>
                      {config.icon}
                      {config.label}
                    </div>

                    {/* Vehicle Info */}
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {vehicle.year} • {formatter.number(vehicle.mileage || 0)} km
                    </p>

                    {/* Price */}
                    <p className="text-2xl font-bold text-kfz-blue mb-4">
                      {formatCurrency(vehicle.price || 0)}
                    </p>

                    {/* Quick Specs */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600">
                      <div>
                        <span className="font-semibold">{t("fuel")}:</span> {getFuelTypeLabel(tCommon, vehicle.fuel_type)}
                      </div>
                      <div>
                        <span className="font-semibold">{t("transmission")}:</span> {getTransmissionLabel(tCommon, vehicle.transmission)}
                      </div>
                    </div>

                    {/* Offer Section */}
                    {status === "angebot_gesendet" && vehicle.offered_price && (
                      <div className="border-t pt-3 mt-3">
                        <div className="bg-green-50 p-3 rounded mb-3">
                          <p className="text-sm text-gray-600 mb-1">{t("offeredPrice")}</p>
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(vehicle.offered_price)}</p>
                          {vehicle.offer_terms && (
                            <p className="text-xs text-gray-600 mt-2">{vehicle.offer_terms}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptOffer(vehicle.id)}
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 font-medium"
                          >
                            {t("acceptOffer")}
                          </button>
                          <button
                            onClick={() => handleRejectOffer(vehicle.id)}
                            className="flex-1 px-3 py-2 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50 font-medium"
                          >
                            {t("rejectOffer")}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Accepted/Rejected Status */}
                    {status === "akzeptiert" && (
                      <div className="border-t pt-3 mt-3 bg-green-50 p-3 rounded">
                        <p className="text-sm text-green-700"><span className="font-semibold">{t("offerAccepted")}</span></p>
                        <p className="text-xs text-gray-600 mt-1">{t("contactUs")}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
