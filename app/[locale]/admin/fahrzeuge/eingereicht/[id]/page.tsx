"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, AlertCircle, CheckCircle, Upload } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { formatPrice } from "@/lib/format-vehicle";
import { getSubmissionDetails } from "@/lib/submission-details";
import {
  getFuelTypeLabel,
  getTransmissionLabel,
  getBodyTypeLabel,
  getColorLabel,
  getSubmissionStatusLabel,
  getSalesTypeLabel,
} from "@/lib/vehicle-labels";

const SALES_TYPE_ICONS: Record<string, string> = {
  direct: "🤝",
  Direktverkauf: "🤝",
  tradeIn: "🔄",
  Inzahlungnahme: "🔄",
  consignment: "📋",
};

interface SubmittedVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  fuel_type: string;
  transmission: string;
  color: string;
  description: string;
  features: string[];
  body_type: string;
  power_hp: number;
  status: string;
  user_id: string;
  images: string[];
  created_at: string;
  sales_type?: string;
  commission?: number;
  variant?: string | null;
  previous_owners?: string | null;
  hu_au?: string | null;
  accident_history?: string | null;
  service_book?: string | null;
}

export default function SubmittedVehicleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { loading, isAdmin } = useAuth();
  const t = useTranslations("admin.submissionDetail");
  const tAdmin = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tButtons = useTranslations("buttons");
  const tWizard = useTranslations("wizard");
  const format = useLocaleFormatter();
  const errorMessage = useErrorMessage();
  const [vehicle, setVehicle] = useState<SubmittedVehicle | null>(null);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [publishPrice, setPublishPrice] = useState<number | null>(null);
  const [publishDescription, setPublishDescription] = useState("");
  const [publishFeatured, setPublishFeatured] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({}); // Map of path -> signed URL

  const vehicleId = params?.id as string;

  // Fetch signed URLs for submission images
  useEffect(() => {
    const fetchSignedUrls = async () => {
      if (!vehicle?.images || vehicle.images.length === 0) {
        setImageUrls({});
        return;
      }

      try {
        const { getSignedImageUrls } = await import("@/app/actions/storage");
        const urlsResult = await getSignedImageUrls(vehicle.images);
        if (!urlsResult.ok) {
          setImageUrls({});
          return;
        }
        const urlMap: Record<string, string> = {};
        for (const item of urlsResult.urls) {
          if (item.url) urlMap[item.path] = item.url;
        }
        setImageUrls(urlMap);
      } catch (err) {
        console.error("Error fetching signed URLs:", err);
        setImageUrls({});
      }
    };

    fetchSignedUrls();
  }, [vehicle?.images]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    const loadVehicle = async () => {
      if (!vehicleId) return;

      try {
        setVehicleLoading(true);
        setError("");
        const { getSubmittedVehicleById } = await import("@/app/actions/admin");
        const result = await getSubmittedVehicleById(vehicleId);

        // Check if result exists and has ok property
        if (!result || !result.ok) {
          setError(errorMessage(result || { error: "UNKNOWN" }));
          setVehicle(null);
          return;
        }

        if (!result.vehicle) {
          setError(t("notFound"));
          setVehicle(null);
          return;
        }

        setVehicle(result.vehicle);
        setPublishPrice(result.vehicle.price);
        setPublishDescription(result.vehicle.description || "");

      } catch (err) {
        console.error("Error loading vehicle:", err);
        setError(errorMessage(err));
        setVehicle(null);
      } finally {
        setVehicleLoading(false);
      }
    };

    if (isAdmin && vehicleId) {
      loadVehicle();
    }
  }, [isAdmin, vehicleId]);

  const handlePublish = async () => {
    if (!vehicle) return;

    if (publishPrice === null || publishPrice < 0) {
      setError(t("invalidPrice"));
      return;
    }

    try {
      setPublishing(true);
      const { publishSubmittedVehicle } = await import("@/app/actions/admin");
      const result = await publishSubmittedVehicle(vehicle.id, {
        price: publishPrice,
        description: publishDescription,
        featured: publishFeatured,
      });

      if (!result.ok) {
        setError(errorMessage(result));
        setPublishing(false);
        return;
      }

      router.push(`/admin/fahrzeuge/${result.vehicleId}`);
    } catch (err) {
      setError(errorMessage(err));
      setPublishing(false);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  if (vehicleLoading) {
    return (
      <div className="space-y-6">
        <Link href="/admin/fahrzeuge/eingereicht">
          <button className="flex items-center gap-2 text-kfz-blue hover:underline">
            <ArrowLeft className="w-4 h-4" />
            {tButtons("back")}
          </button>
        </Link>
        <div className="flex justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
            <p className="text-gray-600">{t("loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <Link href="/admin/fahrzeuge/eingereicht">
          <button className="flex items-center gap-2 text-kfz-blue hover:underline">
            <ArrowLeft className="w-4 h-4" />
            {tButtons("back")}
          </button>
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-800">{t("notFound")}</p>
        </div>
      </div>
    );
  }

  const submissionDetails = getSubmissionDetails(tWizard, vehicle);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Link href="/admin/fahrzeuge/eingereicht">
        <button className="flex items-center gap-2 text-kfz-blue hover:underline">
          <ArrowLeft className="w-4 h-4" />
          {t("backToList")}
        </button>
      </Link>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative w-full aspect-video bg-gray-200">
              {vehicle && vehicle.images && vehicle.images.length > 0 ? (
                (() => {
                  const currentPath = vehicle.images[currentImageIndex];
                  const signedUrl = imageUrls[currentPath];
                  return signedUrl ? (
                    <Image
                      src={signedUrl}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">{t("imageLoading")}</p>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Upload className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>

            {vehicle.images && vehicle.images.length > 1 && (
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {t("imageCounter", { current: currentImageIndex + 1, total: vehicle.images.length })}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setCurrentImageIndex(
                          currentImageIndex > 0 ? currentImageIndex - 1 : vehicle.images.length - 1
                        )
                      }
                      aria-label={t("previousImage")}
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                    >
                      ←
                    </button>
                    <button
                      onClick={() =>
                        setCurrentImageIndex(
                          currentImageIndex < vehicle.images.length - 1 ? currentImageIndex + 1 : 0
                        )
                      }
                      aria-label={t("nextImage")}
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vehicle Info */}
          {vehicle ? (
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {vehicle.brand} {vehicle.model}
                </h1>
                <p className="text-gray-600 mt-1">
                  {vehicle.year} • {tAdmin("units.mileage", { value: format.number(vehicle.mileage) })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">{t("fuel")}</p>
                  <p className="font-semibold text-gray-900">{getFuelTypeLabel(tCommon, vehicle.fuel_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("transmission")}</p>
                  <p className="font-semibold text-gray-900">{getTransmissionLabel(tCommon, vehicle.transmission)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("color")}</p>
                  <p className="font-semibold text-gray-900">{getColorLabel(tCommon, vehicle.color)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("power")}</p>
                  <p className="font-semibold text-gray-900">{tAdmin("units.power", { value: format.number(vehicle.power_hp) })}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("bodyType")}</p>
                  <p className="font-semibold text-gray-900">{getBodyTypeLabel(tCommon, vehicle.body_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("status")}</p>
                  <p className="font-semibold text-gray-900">{getSubmissionStatusLabel(tCommon, vehicle.status)}</p>
                </div>
              </div>

            {submissionDetails.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-3">{t("vehicleDetails")}</p>
                <div className="grid grid-cols-2 gap-4">
                  {submissionDetails.map((detail) => (
                    <div key={detail.key}>
                      <p className="text-sm text-gray-600">{detail.label}</p>
                      <p className="font-semibold text-gray-900 break-words">{detail.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vehicle.sales_type && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-1">{t("salesType")}</p>
                <p className="font-semibold text-gray-900">
                  {SALES_TYPE_ICONS[vehicle.sales_type] ? `${SALES_TYPE_ICONS[vehicle.sales_type]} ` : ""}
                  {getSalesTypeLabel(tCommon, vehicle.sales_type)}
                </p>
              </div>
            )}

            {vehicle.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">{t("description")}</p>
                <p className="text-gray-900">{vehicle.description}</p>
              </div>
            )}

            {vehicle.features && vehicle.features.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-3">{t("features")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {vehicle.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600">{t("loading")}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Price Card */}
          {vehicle && (
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t("requestedPrice")}</p>
                <p className="text-2xl font-bold text-kfz-blue">
                  {formatPrice(format, vehicle.price)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("submittedOn", {
                    date: format.dateTime(new Date(vehicle.created_at), { day: "2-digit", month: "2-digit", year: "numeric" }),
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Publish Form */}
          {vehicle && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
            <h3 className="font-bold text-gray-900">{t("publishTitle")}</h3>

            {!showPublishForm ? (
              <button
                onClick={() => setShowPublishForm(true)}
                className="w-full px-4 py-2 bg-kfz-blue text-white rounded-lg hover:bg-kfz-blue-dark font-medium transition-colors"
              >
                {t("publish")}
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    {t("salePrice")}
                  </label>
                  <input
                    type="number"
                    value={publishPrice || ""}
                    onChange={(e) => setPublishPrice(e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    {t("descriptionOptional")}
                  </label>
                  <textarea
                    value={publishDescription}
                    onChange={(e) => setPublishDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                  />
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={publishFeatured}
                    onChange={(e) => setPublishFeatured(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-700">{t("markFeatured")}</span>
                </label>

                <div className="space-y-2 pt-2 border-t">
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium transition-colors"
                  >
                    {publishing ? t("publishing") : `✓ ${t("confirmPublish")}`}
                  </button>
                  <button
                    onClick={() => setShowPublishForm(false)}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
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
    </div>
  );
}
