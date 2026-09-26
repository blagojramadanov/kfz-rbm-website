"use client";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { Check, X, AlertCircle, Car, MapPin, Calendar, Gauge } from "lucide-react";
import Image from "next/image";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { formatPrice } from "@/lib/format-vehicle";
import { canRejectSubmission, canSendOffer } from "@/lib/submission-workflow";
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
  const tButtons = useTranslations("buttons");
  const format = useLocaleFormatter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const errorMessage = useErrorMessage();
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("eingereicht");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [offeringId, setOfferingId] = useState<string | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerTerms, setOfferTerms] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
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

            // Replace paths with signed URLs in vehicles
            const vehiclesWithSignedUrls = result.vehicles.map((vehicle: any) => ({
              ...vehicle,
              images: vehicle.images?.map((path: string) => pathToSignedUrl[path] || path) || [],
            }));
            setVehicles(vehiclesWithSignedUrls);
          } else {
            // Fall back to original vehicles if signing fails
            setVehicles(result.vehicles);
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

  const openOfferForm = (vehicle: any) => {
    setRejectingId(null);
    if (offeringId === vehicle.id) {
      setOfferingId(null);
      return;
    }
    setOfferingId(vehicle.id);
    // Prefill with the current offer, else the customer's asking price.
    const prefill = vehicle.offered_price ?? vehicle.price;
    setOfferPrice(prefill != null && Number(prefill) > 0 ? String(prefill) : "");
    setOfferTerms(vehicle.offer_terms ?? "");
  };

  const handleSendOffer = async (vehicleId: string) => {
    const price = Number(offerPrice);
    if (!offerPrice.trim() || !Number.isFinite(price) || price <= 0) {
      setError(t("offerPriceRequired"));
      return;
    }
    try {
      setActionInProgress(vehicleId);
      const { sendOffer } = await import("@/app/actions/admin");
      const result = await sendOffer(vehicleId, price, offerTerms.trim() || undefined);
      if (!result.ok) {
        setError(errorMessage(result));
        return;
      }
      const now = new Date().toISOString();
      setVehicles((prev) =>
        statusFilter === "angebot_gesendet"
          ? prev.map((v) =>
              v.id === vehicleId
                ? { ...v, status: "angebot_gesendet", offered_price: price, offer_terms: offerTerms.trim() || null, offered_at: now }
                : v
            )
          : prev.filter((v) => v.id !== vehicleId)
      );
      setOfferingId(null);
      setOfferPrice("");
      setOfferTerms("");
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (vehicleId: string) => {
    if (!rejectReason.trim()) {
      setError(t("rejectReasonRequired"));
      return;
    }
    try {
      setActionInProgress(vehicleId);
      const { rejectSubmittedVehicle } = await import("@/app/actions/admin");
      const result = await rejectSubmittedVehicle(vehicleId, rejectReason);
      if (!result.ok) {
        setError(errorMessage(result));
        return;
      }
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
      setRejectingId(null);
      setRejectReason("");
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionInProgress(null);
    }
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
        <div className="flex gap-2 px-4">
          {statuses.map((status) => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={`flex items-center gap-2 px-5 py-4 font-medium text-sm transition-all border-b-2 ${
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
                onClick={() => router.push(`/admin/fahrzeuge/eingereicht/${vehicle.id}`)}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer group"
              >
                {/* Image Section */}
                <div className="relative overflow-hidden bg-gray-100">
                  <div className="relative w-full aspect-video">
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
                  </div>

                  {/* Image Counter */}
                  {vehicle.images && vehicle.images.length > 0 && (
                    <div className="absolute top-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {getSelectedImageIndex(vehicle.id) + 1}/{vehicle.images.length}
                    </div>
                  )}

                  {/* Thumbnails */}
                  {vehicle.images && vehicle.images.length > 1 && (
                    <div className="absolute bottom-3 left-3 right-3 flex gap-2 overflow-x-auto pb-1">
                      {vehicle.images.map((image: string, index: number) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageIndex(vehicle.id, index);
                          }}
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
                  <div className="absolute top-3 left-3">
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
                    {vehicle.brand} {vehicle.model}
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
                    <p className="font-medium text-gray-900">{vehicle.user?.full_name}</p>
                    <p>{vehicle.user?.email}</p>
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

                  {/* Current offer / rejection reason */}
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
                  {vehicle.status === "abgelehnt" && (vehicle.rejection_reason || vehicle.status_reason) && (
                    <div className="mb-4 pb-4 border-b border-gray-100 text-xs">
                      <p className="text-gray-600">{t("rejectionReason")}:</p>
                      <p className="text-gray-900 mt-1 whitespace-pre-line break-words">{vehicle.rejection_reason || vehicle.status_reason}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {(canSendOffer(vehicle.status) || canRejectSubmission(vehicle.status)) && (
                    <div
                      className="space-y-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-2">
                        {canSendOffer(vehicle.status) && (
                          <button
                            onClick={() => openOfferForm(vehicle)}
                            disabled={actionInProgress === vehicle.id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Check className="w-4 h-4" />
                            {vehicle.status === "angebot_gesendet" ? t("updateOffer") : t("sendOffer")}
                          </button>
                        )}
                        {canRejectSubmission(vehicle.status) && (
                          <button
                            onClick={() => {
                              setOfferingId(null);
                              setRejectingId(rejectingId === vehicle.id ? null : vehicle.id);
                            }}
                            disabled={actionInProgress === vehicle.id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="w-4 h-4" />
                            {t("reject")}
                          </button>
                        )}
                      </div>

                      {offeringId === vehicle.id && (
                        <div className="pt-3 border-t border-gray-100 space-y-2">
                          <label className="block text-xs font-medium text-gray-700">
                            {t("offerPriceLabel")}
                            <input
                              type="number"
                              min="1"
                              step="1"
                              inputMode="decimal"
                              value={offerPrice}
                              onChange={(e) => setOfferPrice(e.target.value)}
                              className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </label>
                          <label className="block text-xs font-medium text-gray-700">
                            {t("offerTermsLabel")}
                            <textarea
                              value={offerTerms}
                              onChange={(e) => setOfferTerms(e.target.value)}
                              placeholder={t("offerTermsPlaceholder")}
                              rows={2}
                              maxLength={5000}
                              className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            />
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSendOffer(vehicle.id)}
                              disabled={actionInProgress === vehicle.id || !offerPrice.trim()}
                              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionInProgress === vehicle.id ? "..." : t("confirmOffer")}
                            </button>
                            <button
                              onClick={() => setOfferingId(null)}
                              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors"
                            >
                              {tButtons("cancel")}
                            </button>
                          </div>
                        </div>
                      )}

                      {rejectingId === vehicle.id && (
                        <div className="pt-3 border-t border-gray-100">
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder={t("rejectReasonPlaceholder")}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleReject(vehicle.id)}
                              disabled={actionInProgress === vehicle.id || !rejectReason.trim()}
                              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {tCommon("confirm")}
                            </button>
                            <button
                              onClick={() => {
                                setRejectingId(null);
                                setRejectReason("");
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors"
                            >
                              {tButtons("cancel")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
