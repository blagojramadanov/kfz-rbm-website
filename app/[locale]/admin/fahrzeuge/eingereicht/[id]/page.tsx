"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, AlertCircle, Check, CheckCircle, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { SalesTypeLabel } from "@/components/sales-type-label";
import { StatusBadge } from "@/components/status-badge";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { formatPrice } from "@/lib/format-vehicle";
import { getSubmissionDetails } from "@/lib/submission-details";
import { canPublishSubmission, getSourceTypeForSalesType } from "@/lib/submission-workflow";
import { DeclinedOfferBadge, SubmissionActions, SubmissionCustomer, type SubmissionPatch } from "../submission-actions";
import {
  getFuelTypeLabel,
  getTransmissionLabel,
  getBodyTypeLabel,
  getColorLabel,
  getSubmissionStatusLabel,
  getSalesTypeLabel,
} from "@/lib/vehicle-labels";

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
  offered_price?: number | null;
  offer_terms?: string | null;
  offered_at?: string | null;
  offer_rejected_at?: string | null;
  vehicle_id?: string | null;
  rejection_reason?: string | null;
  status_reason?: string | null;
  user?: { full_name?: string | null; email?: string | null; phone?: string | null } | null;
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
  const tSubmissions = useTranslations("admin.submissions");
  const tSource = useTranslations("vehicles.source");
  const format = useLocaleFormatter();
  const errorMessage = useErrorMessage();
  const [vehicle, setVehicle] = useState<SubmittedVehicle | null>(null);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [publishPrice, setPublishPrice] = useState<number | null>(null);
  const [publishDescription, setPublishDescription] = useState("");
  const [publishFeatured, setPublishFeatured] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"draft" | "available">("draft");
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

    if (publishPrice === null || !(publishPrice > 0)) {
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
        status: publishStatus,
      });

      if (!result.ok) {
        // UPLOAD_FAILED: a photo could not be copied, so nothing was created.
        setError(result.error === "UPLOAD_FAILED" ? t("publishPhotosFailed") : errorMessage(result));
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  if (vehicleLoading) {
    return (
      <div className="space-y-6">
        <Link href="/admin/fahrzeuge/eingereicht">
          <button className="flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" />
            {tButtons("back")}
          </button>
        </Link>
        <div className="flex justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t("loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <Link href="/admin/fahrzeuge/eingereicht">
          <button className="flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" />
            {tButtons("back")}
          </button>
        </Link>
        <div className="bg-destructive-subtle/50 border border-destructive-border rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive-subtle-foreground">{t("notFound")}</p>
        </div>
      </div>
    );
  }

  const submissionDetails = getSubmissionDetails(tWizard, vehicle);
  const publishSourceType = getSourceTypeForSalesType(vehicle.sales_type);
  const applyPatch = (patch: SubmissionPatch) => setVehicle((prev) => (prev ? { ...prev, ...patch } : prev));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Link href="/admin/fahrzeuge/eingereicht">
        <button className="flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />
          {t("backToList")}
        </button>
      </Link>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive-subtle/50 border border-destructive-border rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive-subtle-foreground">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="card overflow-hidden">
            <div className="relative w-full aspect-video bg-border">
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
                        <Upload className="w-12 h-12 text-muted-foreground/70 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">{t("imageLoading")}</p>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Upload className="w-12 h-12 text-muted-foreground/70" />
                </div>
              )}
            </div>

            {vehicle.images && vehicle.images.length > 1 && (
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
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
                      className="p-1.5 bg-border rounded hover:bg-input"
                    >
                      <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentImageIndex(
                          currentImageIndex < vehicle.images.length - 1 ? currentImageIndex + 1 : 0
                        )
                      }
                      aria-label={t("nextImage")}
                      className="p-1.5 bg-border rounded hover:bg-input"
                    >
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vehicle Info */}
          {vehicle ? (
            <div className="card p-6 space-y-4">
              <div>
                <h1 className="page-title text-foreground">
                  {vehicle.brand} {vehicle.model}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {vehicle.year} • {tAdmin("units.mileage", { value: format.number(vehicle.mileage) })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">{t("fuel")}</p>
                  <p className="font-semibold text-foreground">{getFuelTypeLabel(tCommon, vehicle.fuel_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("transmission")}</p>
                  <p className="font-semibold text-foreground">{getTransmissionLabel(tCommon, vehicle.transmission)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("color")}</p>
                  <p className="font-semibold text-foreground">{getColorLabel(tCommon, vehicle.color)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("power")}</p>
                  <p className="font-semibold text-foreground">{tAdmin("units.power", { value: format.number(vehicle.power_hp) })}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("bodyType")}</p>
                  <p className="font-semibold text-foreground">{getBodyTypeLabel(tCommon, vehicle.body_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("status")}</p>
                  <StatusBadge kind="submission" status={vehicle.status} withIcon className="mt-1">{getSubmissionStatusLabel(tCommon, vehicle.status)}</StatusBadge>
                </div>
              </div>

            {submissionDetails.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">{t("vehicleDetails")}</p>
                <div className="grid grid-cols-2 gap-4">
                  {submissionDetails.map((detail) => (
                    <div key={detail.key}>
                      <p className="text-sm text-muted-foreground">{detail.label}</p>
                      <p className="font-semibold text-foreground break-words">{detail.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vehicle.sales_type && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">{t("salesType")}</p>
                <SalesTypeLabel salesType={vehicle.sales_type} className="font-semibold text-foreground">
                  {getSalesTypeLabel(tCommon, vehicle.sales_type)}
                </SalesTypeLabel>
              </div>
            )}

            {vehicle.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">{t("description")}</p>
                <p className="text-foreground">{vehicle.description}</p>
              </div>
            )}

            {vehicle.features && vehicle.features.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">{t("features")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {vehicle.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          ) : (
            <div className="card p-6">
              <p className="text-muted-foreground">{t("loading")}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Price Card */}
          {vehicle && (
            <div className="card p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t("requestedPrice")}</p>
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(format, vehicle.price)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("submittedOn", {
                    date: format.dateTime(new Date(vehicle.created_at), { day: "2-digit", month: "2-digit", year: "numeric" }),
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Customer */}
          {vehicle.user && (
            <div className="card p-6 text-sm text-muted-foreground">
              <h3 className="font-bold text-foreground mb-2">{t("customer")}</h3>
              <SubmissionCustomer user={vehicle.user} />
            </div>
          )}

          {/* Offer: current / declined / accepted offer, rejection reason, admin actions */}
          <div className="card p-6 space-y-4">
            <h3 className="font-bold text-foreground">{t("offerTitle")}</h3>
            <DeclinedOfferBadge vehicle={vehicle} />
            {(vehicle.status === "angebot_gesendet" || vehicle.status === "akzeptiert") && (
              <div className="text-sm">
                <p className="text-muted-foreground">
                  {vehicle.status === "akzeptiert" ? tSubmissions("acceptedOffer") : tSubmissions("currentOffer")}
                </p>
                <p className={`text-xl font-bold ${vehicle.status === "akzeptiert" ? "text-success" : "text-success"}`}>
                  {vehicle.offered_price != null ? formatPrice(format, vehicle.offered_price) : tSubmissions("noOfferPrice")}
                </p>
                {vehicle.offer_terms && <p className="text-muted-foreground mt-1 whitespace-pre-line break-words">{vehicle.offer_terms}</p>}
              </div>
            )}
            {vehicle.status === "abgelehnt" && (vehicle.rejection_reason || vehicle.status_reason) && (
              <div className="text-sm">
                <p className="text-muted-foreground">{tSubmissions("rejectionReason")}:</p>
                <p className="text-foreground mt-1 whitespace-pre-line break-words">{vehicle.rejection_reason || vehicle.status_reason}</p>
              </div>
            )}
            <SubmissionActions vehicle={vehicle} onChange={applyPatch} />
          </div>

          {/* Publish Form: only for an accepted offer, once (enforced in publishSubmittedVehicle) */}
          <div className="bg-info-subtle/50 border border-info-border rounded-lg p-6 space-y-4">
            <h3 className="font-bold text-foreground">{t("publishTitle")}</h3>

            {vehicle.vehicle_id ? (
              <div className="space-y-2 text-sm">
                <p className="text-foreground">{tSubmissions("alreadyPublished")}</p>
                <Link href={`/admin/fahrzeuge/${vehicle.vehicle_id}`} className="text-primary font-medium hover:underline">
                  {t("openVehicle")}
                </Link>
              </div>
            ) : !canPublishSubmission(vehicle) ? (
              <p className="text-sm text-foreground">{t("publishOnlyAccepted")}</p>
            ) : !showPublishForm ? (
              <button
                onClick={() => setShowPublishForm(true)}
                className="min-h-11 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover font-medium transition-colors"
              >
                {t("publish")}
              </button>
            ) : (
              <div className="space-y-4">
                {publishSourceType && (
                  <p className="text-sm text-foreground">
                    {t("publishSource", { source: tSource(publishSourceType) })}
                  </p>
                )}

                <div>
                  <label htmlFor="publish-price" className="block text-sm font-medium text-foreground mb-1">
                    {t("salePrice")}
                  </label>
                  <input
                    id="publish-price"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    required
                    value={publishPrice ?? ""}
                    onChange={(e) => setPublishPrice(e.target.value ? parseFloat(e.target.value) : null)}
                    className="field"
                  />
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">{t("requestedPrice")}</dt>
                      <dd className="font-semibold text-foreground">{formatPrice(format, vehicle.price)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("agreedPrice")}</dt>
                      <dd className="font-semibold text-foreground">
                        {vehicle.offered_price != null ? formatPrice(format, vehicle.offered_price) : "—"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <fieldset className="space-y-2">
                  <legend className="block text-sm font-medium text-foreground mb-1">{t("publishStatusLabel")}</legend>
                  {(["draft", "available"] as const).map((option) => (
                    <label key={option} className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="publish-status"
                        value={option}
                        checked={publishStatus === option}
                        onChange={() => setPublishStatus(option)}
                        className="w-4 h-4 mt-0.5"
                      />
                      <span className="text-sm text-foreground">
                        {option === "draft" ? t("publishAsDraft") : t("publishAsAvailable")}
                      </span>
                    </label>
                  ))}
                </fieldset>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t("descriptionOptional")}
                  </label>
                  <textarea
                    value={publishDescription}
                    onChange={(e) => setPublishDescription(e.target.value)}
                    rows={3}
                    className="field"
                  />
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={publishFeatured}
                    onChange={(e) => setPublishFeatured(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-foreground">{t("markFeatured")}</span>
                </label>

                <div className="space-y-2 pt-2 border-t">
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="min-h-11 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success-hover disabled:bg-muted-foreground/50 font-medium transition-colors"
                  >
                    {publishing ? (
                      t("publishing")
                    ) : (
                      <>
                        <Check className="w-4 h-4" aria-hidden="true" />
                        {publishStatus === "available" ? t("confirmPublishAvailable") : t("confirmPublishDraft")}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowPublishForm(false)}
                    className="min-h-11 w-full px-4 py-2 border border-input text-foreground rounded-lg hover:bg-muted font-medium transition-colors"
                  >
                    {tButtons("cancel")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
