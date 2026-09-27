"use client";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, Car, MapPin, Calendar, Gauge } from "lucide-react";
import Image from "next/image";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { formatPrice } from "@/lib/format-vehicle";
import { DeclinedOfferBadge, SubmissionActions, SubmissionCustomer, type SubmissionPatch } from "./submission-actions";
import {
  getFuelTypeLabel,
  getTransmissionLabel,
  getSubmissionStatusLabel,
  getSalesTypeLabel,
} from "@/lib/vehicle-labels";

export default function AdminSubmittedVehiclesPage() {
  const params = useParams();
  const locale = params.locale as string || 'de';
  const router = useRouter();
  const { loading, isAdmin } = useAuth();
  const t = useTranslations("admin.submissions");
  const tAdmin = useTranslations("admin");
  const tCommon = useTranslations("common");
  const format = useLocaleFormatter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const errorMessage = useErrorMessage();
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("eingereicht");
  const [selectedImageIndex, setSelectedImageIndex] = useState<Record<string, number>>({});

  const getSelectedImageIndex = (vehicleId: string) => selectedImageIndex[vehicleId] ?? 0;
  const setImageIndex = (vehicleId: string, index: number) => {
    setSelectedImageIndex((prev) => ({ ...prev, [vehicleId]: index }));
  };

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setVehiclesLoading(true);
        const { getSubmittedVehicles } = await import("@/app/actions/admin");
        const result = await getSubmittedVehicles({
          status: statusFilter || undefined,
        });
        if (!result.ok) {
          setError(errorMessage(result));
          return;
        }

        // Collect all image paths from all vehicles
        const allImagePaths: string[] = [];
        const imagePathToVehicleMap: Record<string, { vehicleId: string; index: number }> = {};

        result.vehicles.forEach((vehicle: any) => {
          if (vehicle.images && Array.isArray(vehicle.images)) {
            vehicle.images.forEach((imagePath: string, index: number) => {
              allImagePaths.push(imagePath);
              imagePathToVehicleMap[imagePath] = { vehicleId: vehicle.id, index };
            });
          }
        });

        // Fetch signed URLs for all images
        if (allImagePaths.length > 0) {
          const { getSignedImageUrls } = await import("@/app/actions/storage");
          const urlResult = await getSignedImageUrls(allImagePaths);

          if (urlResult.ok && urlResult.urls) {
            // Create a mapping of original paths to signed URLs
            const pathToSignedUrl: Record<string, string> = {};
            urlResult.urls.forEach((item: { path: string; url: string | null }) => {
              if (item.url) {
                pathToSignedUrl[item.path] = item.url;
              }
            });

            // Replace paths with signed URLs. A raw path is not a loadable URL, so a photo
            // that could not be signed (the action already tried every fallback) is left out
            // instead of rendering a broken image.
            const vehiclesWithSignedUrls = result.vehicles.map((vehicle: any) => ({
              ...vehicle,
              images: (vehicle.images ?? [])
                .map((path: string) => pathToSignedUrl[path])
                .filter((url: string | undefined): url is string => Boolean(url)),
            }));
            setVehicles(vehiclesWithSignedUrls);
          } else {
            setVehicles(result.vehicles.map((vehicle: any) => ({ ...vehicle, images: [] })));
          }
        } else {
          setVehicles(result.vehicles);
        }

        setError("");
      } catch (err) {
        console.error("Error loading vehicles:", err);
        setError(errorMessage(err));
      } finally {
        setVehiclesLoading(false);
      }
    };

    if (isAdmin) loadVehicles();
  }, [statusFilter, isAdmin]);

  // An action moves the submission to another status: keep it only if it still matches the tab.
  const applyPatch = (vehicleId: string, patch: SubmissionPatch) => {
    setVehicles((prev) =>
      patch.status === statusFilter
        ? prev.map((v) => (v.id === vehicleId ? { ...v, ...patch } : v))
        : prev.filter((v) => v.id !== vehicleId)
    );
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  const statuses = [
    { value: "eingereicht", icon: "📥" },
    { value: "in_bearbeitung", icon: "⏳" },
    { value: "angebot_gesendet", icon: "📤" },
    { value: "akzeptiert", icon: "✅" },
    { value: "abgelehnt", icon: "❌" },
  ];

  const salesTypeIcons: Record<string, string> = {
    direct: "🤝",
    Direktverkauf: "🤝",
    tradeIn: "🔄",
    Inzahlungnahme: "🔄",
    consignment: "📋",
  };

  const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
    eingereicht: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    in_bearbeitung: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    angebot_gesendet: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    akzeptiert: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300" },
    abgelehnt: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  };

  return (
    <div className="bg-gray-50 min-h-screen -mx-6 -my-6 px-6 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{t("title")}</h1>
        <p className="text-gray-600">{t("description")}</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-8 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex gap-2 px-4 overflow-x-auto">
          {statuses.map((status) => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={`flex flex-shrink-0 items-center gap-2 px-5 py-4 font-medium text-sm transition-all border-b-2 ${
                statusFilter === status.value
                  ? "border-kfz-blue text-kfz-blue"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>{status.icon}</span>
              {getSubmissionStatusLabel(tCommon, status.value)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {vehiclesLoading ? (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
              <p className="text-gray-600">{t("loading")}</p>
            </div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-white rounded-lg p-16 text-center">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg text-gray-600">{t("emptyTitle")}</p>
            <p className="text-sm text-gray-500 mt-1">{t("emptyDescription")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group"
              >
                {/* Image Section (the main image links to the detail page; thumbnails stay buttons) */}
                <div className="relative overflow-hidden bg-gray-100">
                  <Link
                    href={`/admin/fahrzeuge/eingereicht/${vehicle.id}`}
                    aria-label={`${vehicle.brand} ${vehicle.model}`}
                    className="relative block w-full aspect-video"
                  >
                    {vehicle.images && vehicle.images.length > 0 ? (
                      <Image
                        src={vehicle.images[getSelectedImageIndex(vehicle.id)]}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <Car className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </Link>

                  {/* Image Counter */}
                  {vehicle.images && vehicle.images.length > 0 && (
                    <div className="pointer-events-none absolute top-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {getSelectedImageIndex(vehicle.id) + 1}/{vehicle.images.length}
                    </div>
                  )}

                  {/* Thumbnails */}
                  {vehicle.images && vehicle.images.length > 1 && (
                    <div className="absolute bottom-3 left-3 right-3 flex gap-2 overflow-x-auto pb-1">
                      {vehicle.images.map((image: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => setImageIndex(vehicle.id, index)}
                          className={`flex-shrink-0 w-10 h-10 rounded-md overflow-hidden border-2 transition-all ${
                            getSelectedImageIndex(vehicle.id) === index
                              ? "border-white shadow-lg"
                              : "border-white/40 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <Image
                            src={image}
                            alt={`${vehicle.brand} ${vehicle.model} ${index + 1}`}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="pointer-events-none absolute top-3 left-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        statusConfig[vehicle.status]?.bg
                      } ${statusConfig[vehicle.status]?.text}`}
                    >
                      {getSubmissionStatusLabel(tCommon, vehicle.status)}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5">
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    <Link href={`/admin/fahrzeuge/eingereicht/${vehicle.id}`} className="hover:text-kfz-blue hover:underline">
                      {vehicle.brand} {vehicle.model}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">{vehicle.year}</p>

                  {/* Price */}
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">{t("askingPrice")}</p>
                    <p className="text-2xl font-bold text-kfz-blue">
                      {vehicle.price != null ? formatPrice(format, vehicle.price) : "–"}
                    </p>
                  </div>

                  {/* Quick Specs */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="flex items-center gap-2 text-sm">
                      <Gauge className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">{t("mileage")}</p>
                        <p className="font-semibold text-gray-900">
                          {vehicle.mileage != null ? tAdmin("units.mileage", { value: format.number(vehicle.mileage) }) : "–"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">{t("transmission")}</p>
                        <p className="font-semibold text-gray-900">{getTransmissionLabel(tCommon, vehicle.transmission)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">{t("fuel")}</p>
                        <p className="font-semibold text-gray-900">{getFuelTypeLabel(tCommon, vehicle.fuel_type)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="text-xs text-gray-600 mb-4 pb-4 border-b border-gray-100">
                    <SubmissionCustomer user={vehicle.user} />
                  </div>

                  {/* Sales Type & Commission */}
                  <div className="mb-4 space-y-2">
                    {vehicle.sales_type && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{t("salesType")}:</span>
                        <span className="font-semibold text-gray-900">
                          {salesTypeIcons[vehicle.sales_type] ? `${salesTypeIcons[vehicle.sales_type]} ` : ""}
                          {getSalesTypeLabel(tCommon, vehicle.sales_type)}
                        </span>
                      </div>
                    )}
                    {vehicle.commission && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{t("commission")}:</span>
                        <span className="font-semibold text-purple-600">
                          {format.number(vehicle.commission / 100, { style: "percent", maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Declined / current / accepted offer, rejection reason */}
                  <div className="mb-4 empty:hidden">
                    <DeclinedOfferBadge vehicle={vehicle} />
                  </div>
                  {vehicle.status === "angebot_gesendet" && (
                    <div className="mb-4 pb-4 border-b border-gray-100 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">{t("currentOffer")}:</span>
                        <span className="font-semibold text-green-700">
                          {vehicle.offered_price != null ? formatPrice(format, vehicle.offered_price) : t("noOfferPrice")}
                        </span>
                      </div>
                      {vehicle.offer_terms && <p className="text-gray-600 mt-1 whitespace-pre-line break-words">{vehicle.offer_terms}</p>}
                    </div>
                  )}
                  {vehicle.status === "akzeptiert" && (
                    <div className="mb-4 pb-4 border-b border-gray-100 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">{t("acceptedOffer")}:</span>
                        <span className="font-semibold text-emerald-700">
                          {vehicle.offered_price != null ? formatPrice(format, vehicle.offered_price) : t("noOfferPrice")}
                        </span>
                      </div>
                      {vehicle.vehicle_id && <p className="text-gray-600 mt-1">{t("alreadyPublished")}</p>}
                    </div>
                  )}
                  {vehicle.status === "abgelehnt" && (vehicle.rejection_reason || vehicle.status_reason) && (
                    <div className="mb-4 pb-4 border-b border-gray-100 text-xs">
                      <p className="text-gray-600">{t("rejectionReason")}:</p>
                      <p className="text-gray-900 mt-1 whitespace-pre-line break-words">{vehicle.rejection_reason || vehicle.status_reason}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <SubmissionActions vehicle={vehicle} onChange={(patch) => applyPatch(vehicle.id, patch)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
