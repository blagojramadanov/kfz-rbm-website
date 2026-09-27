"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, ArrowLeft, Edit2, Trash2, Star } from "lucide-react";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { formatPrice } from "@/lib/format-vehicle";
import { getSubmissionDetails } from "@/lib/submission-details";
import { VehicleSourceBadge } from "@/components/vehicle-source-badge";
import {
  getBodyTypeLabel,
  getColorLabel,
  getFuelTypeLabel,
  getTransmissionLabel,
  getVehicleStatusLabel,
} from "@/lib/vehicle-labels";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  available: "bg-green-100 text-green-800",
  reserved: "bg-blue-100 text-blue-800",
  sold: "bg-red-100 text-red-800",
};

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  if (vehicleLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <Link href="/admin/fahrzeuge">
          <button className="flex items-center gap-2 text-kfz-blue hover:text-kfz-blue-dark font-medium">
            <ArrowLeft className="w-4 h-4" />
            {t("backToList")}
          </button>
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{t("notFound")}</p>
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
        <button className="flex items-center gap-2 text-kfz-blue hover:text-kfz-blue-dark font-medium">
          <ArrowLeft className="w-4 h-4" />
          {t("backToList")}
        </button>
      </Link>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {vehicle.year} {vehicle.brand} {vehicle.model}
              </h1>
              {vehicle.featured && (
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" aria-label={tFeatured("featured")} />
              )}
            </div>
            <p className="text-gray-600 mt-1">{t("vin", { vin: vehicle.vin })}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              STATUS_COLORS[vehicle.status] || "bg-gray-100 text-gray-800"
            }`}
          >
            {getVehicleStatusLabel(tCommon, vehicle.status)}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("basicInfo")}</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-600">{t("price")}</p>
                <p className="text-2xl font-bold text-kfz-blue">
                  {vehicle.price != null ? formatPrice(format, vehicle.price) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t("mileage")}</p>
                <p className="font-medium text-gray-900">
                  {vehicle.mileage != null ? tAdmin("units.mileage", { value: format.number(vehicle.mileage) }) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t("transmission")}</p>
                <p className="font-medium text-gray-900">
                  {vehicle.transmission ? getTransmissionLabel(tCommon, vehicle.transmission) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t("fuel")}</p>
                <p className="font-medium text-gray-900">
                  {vehicle.fuel_type ? getFuelTypeLabel(tCommon, vehicle.fuel_type) : "—"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("specifications")}</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-600">{t("bodyType")}</p>
                <p className="font-medium text-gray-900">
                  {vehicle.body_type ? getBodyTypeLabel(tCommon, vehicle.body_type) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t("colorExterior")}</p>
                <p className="font-medium text-gray-900">
                  {vehicle.color_exterior ? getColorLabel(tCommon, vehicle.color_exterior) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t("colorInterior")}</p>
                <p className="font-medium text-gray-900">
                  {vehicle.color_interior ? getColorLabel(tCommon, vehicle.color_interior) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t("engine")}</p>
                <p className="font-medium text-gray-900">
                  {engineParts.length > 0 ? engineParts.join(", ") : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{tFeatured("columns.source")}</p>
                <VehicleSourceBadge sourceType={vehicle.source_type || "rbm"} />
              </div>
              {getSubmissionDetails(tWizard, vehicle).map((detail) => (
                <div key={detail.key}>
                  <p className="text-xs text-gray-600">{detail.label}</p>
                  <p className="font-medium text-gray-900 break-words">{detail.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {vehicle.description && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900 mb-2">{t("description")}</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{vehicle.description}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Link href={`/admin/fahrzeuge/${vehicleId}/edit`} className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
              <Edit2 className="w-4 h-4" />
              {tButtons("edit")}
            </button>
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? t("deleting") : tButtons("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
