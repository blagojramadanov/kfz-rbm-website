"use client";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Car, Clock, CheckCircle, AlertCircle } from "lucide-react";
import Image from "next/image";
import type { SubmittedVehicle } from "@/lib/supabase";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { getFuelTypeLabel, getTransmissionLabel } from "@/lib/vehicle-labels";
import { getDeclinedOfferPrice } from "@/lib/submission-workflow";

type DashboardVehicleStatus = "eingereicht" | "in_bearbeitung" | "angebot_gesendet" | "akzeptiert" | "abgelehnt";

export const dynamic = "force-dynamic";

export default function MyVehiclesPage() {
  const t = useTranslations("dashboard.vehicles");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");
  const tButtons = useTranslations("buttons");
  const formatter = useLocaleFormatter();
  const router = useRouter();
  const { loading, isAuthenticated, user } = useAuth();
  const errorMessage = useErrorMessage();
  const [vehicles, setVehicles] = useState<SubmittedVehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  // Offer answer waiting for confirmation in the dialog.
  const [pendingAnswer, setPendingAnswer] = useState<{ vehicleId: string; decision: "accept" | "reject"; price: number } | null>(null);
  const [answering, setAnswering] = useState(false);

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

      // Signed URLs for the cover photo of each vehicle (the only one this page shows).
      // The action only signs photos of the customer's own submissions.
      if (data && data.length > 0) {
        const allPaths = data.map((v) => v.images?.[0]).filter((path): path is string => Boolean(path));
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

  const handleConfirmAnswer = async () => {
    if (!user || !pendingAnswer) return;
    try {
      setAnswering(true);
      const { acceptOffer, rejectOffer } = await import("@/app/actions/vehicles");
      const answer = pendingAnswer.decision === "accept" ? acceptOffer : rejectOffer;
      const result = await answer(pendingAnswer.vehicleId);
      if (!result.ok) {
        alert(errorMessage(result));
        return;
      }
      setPendingAnswer(null);
      await fetchVehicles();
    } catch (error) {
      console.error("Error answering offer:", error);
      alert(errorMessage(error));
    } finally {
      setAnswering(false);
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
                  {/* Image (private photo behind a short-lived signed URL: unoptimized keeps it out of the shared image cache) */}
                  <div className="relative w-full aspect-video bg-gray-200 overflow-hidden">
                    {vehicle.images && vehicle.images.length > 0 && imageUrls[vehicle.images[0]] ? (
                      <Image
                        src={imageUrls[vehicle.images[0]]}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized
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
                            onClick={() => setPendingAnswer({ vehicleId: vehicle.id, decision: "accept", price: vehicle.offered_price! })}
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 font-medium"
                          >
                            {t("acceptOffer")}
                          </button>
                          <button
                            onClick={() => setPendingAnswer({ vehicleId: vehicle.id, decision: "reject", price: vehicle.offered_price! })}
                            className="flex-1 px-3 py-2 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50 font-medium"
                          >
                            {t("rejectOffer")}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* The customer declined our last offer; the vehicle is back with us for review */}
                    {(() => {
                      const declinedPrice = getDeclinedOfferPrice(vehicle);
                      return declinedPrice != null ? (
                        <div className="border-t pt-3 mt-3">
                          <div className="bg-orange-50 p-3 rounded">
                            <p className="text-sm font-semibold text-orange-800">
                              {t("youDeclinedOffer", { price: formatCurrency(declinedPrice) })}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">{t("youDeclinedOfferNext")}</p>
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* Rejection reason entered by the admin (older rows keep it in status_reason) */}
                    {status === "abgelehnt" && (vehicle.rejection_reason || vehicle.status_reason) && (
                      <div className="border-t pt-3 mt-3">
                        <div className="bg-red-50 p-3 rounded">
                          <p className="text-sm font-semibold text-red-700">{t("rejectionReason")}</p>
                          <p className="text-sm text-gray-700 mt-1 whitespace-pre-line break-words">
                            {vehicle.rejection_reason || vehicle.status_reason}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Accepted/Rejected Status */}
                    {status === "akzeptiert" && (
                      <div className="border-t pt-3 mt-3 bg-green-50 p-3 rounded">
                        <p className="text-sm text-green-700"><span className="font-semibold">{t("offerAccepted")}</span></p>
                        {Number(vehicle.offered_price) > 0 && (
                          <>
                            <p className="text-sm text-gray-600 mt-2">{t("acceptedPrice")}</p>
                            <p className="text-2xl font-bold text-green-700">{formatCurrency(Number(vehicle.offered_price))}</p>
                          </>
                        )}
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

      <ConfirmDialog
        open={pendingAnswer != null}
        title={pendingAnswer?.decision === "reject" ? t("rejectConfirm") : t("acceptConfirm")}
        description={
          pendingAnswer &&
          t(pendingAnswer.decision === "reject" ? "rejectConfirmText" : "acceptConfirmText", {
            price: formatCurrency(pendingAnswer.price),
          })
        }
        confirmLabel={pendingAnswer?.decision === "reject" ? t("rejectOffer") : t("acceptOffer")}
        cancelLabel={tButtons("cancel")}
        tone={pendingAnswer?.decision === "reject" ? "destructive" : "default"}
        busy={answering}
        onConfirm={handleConfirmAnswer}
        onCancel={() => setPendingAnswer(null)}
      />
    </div>
  );
}
