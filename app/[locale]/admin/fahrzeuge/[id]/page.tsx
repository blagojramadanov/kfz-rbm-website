"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, ArrowLeft, Edit2, Trash2, Star, Heart } from "lucide-react";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { formatPrice } from "@/lib/format-vehicle";
import { getSubmissionDetails } from "@/lib/submission-details";
import { VehicleSourceBadge } from "@/components/vehicle-source-badge";
import { StatusBadge } from "@/components/status-badge";
import {
  getBodyTypeLabel,
  getColorLabel,
  getFuelTypeLabel,
  getTransmissionLabel,
  getVehicleStatusLabel,
} from "@/lib/vehicle-labels";

export const dynamic = "force-dynamic";


export default function AdminVehicleDetailPage() {
  const t = useTranslations("adminVehicles.detail");
  const tFeatured = useTranslations("adminVehicles");
  const tActions = useTranslations("adminVehicleActions");
  const tAdmin = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tButtons = useTranslations("buttons");
  const tWizard = useTranslations("wizard");
  const format = useLocaleFormatter();
  const errorMessage = useErrorMessage();
  const params = useParams();
  const locale = params.locale as string || 'de';
  const router = useRouter();
  const vehicleId = params?.id as string;
  const { loading, isAdmin } = useAuth();
  const [vehicle, setVehicle] = useState<any>(null);
  const [favoriteCount, setFavoriteCount] = useState<number | null>(null);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

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
        const { getVehicleById } = await import("@/app/actions/admin");
        const result = await getVehicleById(vehicleId);
        if (!result.ok) {
          setError(errorMessage(result));
          return;
        }
        setVehicle(result.vehicle);
        setFavoriteCount(result.favoriteCount);
        setError("");
      } catch (err) {
        console.error("Error loading vehicle:", err);
        setError(errorMessage(err));
      } finally {
        setVehicleLoading(false);
      }
    };

    if (isAdmin && vehicleId) loadVehicle();
  }, [vehicleId, isAdmin]);

  const handleDelete = async () => {
    if (!confirm(tActions("confirmDelete"))) return;
    try {
      setDeleting(true);
      const { deleteVehicle } = await import("@/app/actions/admin");
      const result = await deleteVehicle(vehicleId);
      if (!result.ok) {
        setError(`${tActions("deleteFailed")} ${errorMessage(result)}`);
        setDeleting(false);
        return;
      }
      router.push("/admin/fahrzeuge");
    } catch (err) {
      setError(`${tActions("deleteFailed")} ${errorMessage(err)}`);
      setDeleting(false);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  if (vehicleLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <Link href="/admin/fahrzeuge">
          <button className="flex min-h-11 items-center gap-2 text-primary hover:text-primary-hover font-medium">
            <ArrowLeft className="w-4 h-4" />
            {t("backToList")}
          </button>
        </Link>
        <div className="bg-destructive-subtle/50 border border-destructive-border rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive-subtle-foreground">{t("notFound")}</p>
        </div>
      </div>
    );
  }

  // Engine: "1.998 cm³, 190 PS"; parts without a value are left out.
  const engineParts = [
    vehicle.engine_cc ? tAdmin("units.engine", { value: format.number(vehicle.engine_cc) }) : null,
    vehicle.power_hp ? tAdmin("units.power", { value: format.number(vehicle.power_hp) }) : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <Link href="/admin/fahrzeuge">
        <button className="flex min-h-11 items-center gap-2 text-primary hover:text-primary-hover font-medium">
          <ArrowLeft className="w-4 h-4" />
          {t("backToList")}
        </button>
      </Link>

      {error && (
        <div className="bg-destructive-subtle/50 border border-destructive-border rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive-subtle-foreground">{error}</p>
        </div>
      )}

      <div className="card p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-title text-foreground">
                {vehicle.year} {vehicle.brand} {vehicle.model}
              </h1>
              {vehicle.featured && (
                <Star className="w-6 h-6 text-featured fill-featured" aria-label={tFeatured("featured")} />
              )}
            </div>
            <p className="text-muted-foreground mt-1">{t("vin", { vin: vehicle.vin })}</p>
            {favoriteCount !== null && (
              <p className="text-muted-foreground mt-1 flex items-center gap-1">
                <Heart
                  className={`w-4 h-4 ${favoriteCount > 0 ? "text-destructive fill-destructive" : "text-muted-foreground/50"}`}
                  aria-hidden="true"
                />
                {tFeatured("favoriteCount", { value: format.number(favoriteCount) })}
              </p>
            )}
          </div>
          <StatusBadge kind="vehicle" status={vehicle.status}>{getVehicleStatusLabel(tCommon, vehicle.status)}</StatusBadge>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="card-title mb-4">{t("basicInfo")}</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">{t("price")}</p>
                <p className="text-2xl font-bold text-primary">
                  {vehicle.price != null ? formatPrice(format, vehicle.price) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("mileage")}</p>
                <p className="font-medium text-foreground">
                  {vehicle.mileage != null ? tAdmin("units.mileage", { value: format.number(vehicle.mileage) }) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("transmission")}</p>
                <p className="font-medium text-foreground">
                  {vehicle.transmission ? getTransmissionLabel(tCommon, vehicle.transmission) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("fuel")}</p>
                <p className="font-medium text-foreground">
                  {vehicle.fuel_type ? getFuelTypeLabel(tCommon, vehicle.fuel_type) : "—"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="card-title mb-4">{t("specifications")}</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">{t("bodyType")}</p>
                <p className="font-medium text-foreground">
                  {vehicle.body_type ? getBodyTypeLabel(tCommon, vehicle.body_type) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("colorExterior")}</p>
                <p className="font-medium text-foreground">
                  {vehicle.color_exterior ? getColorLabel(tCommon, vehicle.color_exterior) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("colorInterior")}</p>
                <p className="font-medium text-foreground">
                  {vehicle.color_interior ? getColorLabel(tCommon, vehicle.color_interior) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("engine")}</p>
                <p className="font-medium text-foreground">
                  {engineParts.length > 0 ? engineParts.join(", ") : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tFeatured("columns.source")}</p>
                <VehicleSourceBadge sourceType={vehicle.source_type || "rbm"} />
              </div>
              {getSubmissionDetails(tWizard, vehicle).map((detail) => (
                <div key={detail.key}>
                  <p className="text-xs text-muted-foreground">{detail.label}</p>
                  <p className="font-medium text-foreground break-words">{detail.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {vehicle.description && (
          <div className="mb-8 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium text-foreground mb-2">{t("description")}</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{vehicle.description}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Link href={`/admin/fahrzeuge/${vehicleId}/edit`} className="flex-1">
            <button className="min-h-11 w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover font-medium transition-colors">
              <Edit2 className="w-4 h-4" />
              {tButtons("edit")}
            </button>
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="min-h-11 flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-destructive-border text-destructive rounded-lg hover:bg-destructive-subtle/50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? t("deleting") : tButtons("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
