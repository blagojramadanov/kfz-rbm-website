"use client";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { Edit2, Trash2, Plus, Search, AlertCircle, Eye, Star } from "lucide-react";
import { VehicleSourceBadge } from "@/components/vehicle-source-badge";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { formatPrice } from "@/lib/format-vehicle";
import { getVehicleStatusLabel } from "@/lib/vehicle-labels";

const VEHICLE_STATUSES = ["draft", "available", "reserved", "sold"] as const;

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  available: "bg-green-100 text-green-800",
  reserved: "bg-blue-100 text-blue-800",
  sold: "bg-red-100 text-red-800",
};

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  status: string;
  featured: boolean;
  source_type?: string;
}

export default function AdminVehiclesPage() {
  const t = useTranslations("adminVehicles");
  const tActions = useTranslations("adminVehicleActions");
  const tAdmin = useTranslations("admin");
  const tCommon = useTranslations("common");
  const format = useLocaleFormatter();
  const errorMessage = useErrorMessage();
  const params = useParams();
  const locale = params.locale as string || 'de';
  const router = useRouter();
  const { loading, isAdmin } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const { getVehicles } = await import("@/app/actions/admin");
        const result = await getVehicles({
          search: search || undefined,
          status: statusFilter || undefined,
        });
        if (!result.ok) {
          setError(errorMessage(result));
          return;
        }
        setVehicles(result.vehicles);
      } catch (err) {
        console.error("Error loading vehicles:", err);
        setError(errorMessage(err));
      } finally {
        setVehiclesLoading(false);
      }
    };

    setVehiclesLoading(true);
    const timeout = setTimeout(loadVehicles, 300);
    return () => clearTimeout(timeout);
  }, [search, statusFilter, isAdmin]);

  const handleDelete = async (vehicleId: string) => {
    if (!confirm(tActions("confirmDelete"))) return;

    try {
      setDeleting(vehicleId);
      const { deleteVehicle } = await import("@/app/actions/admin");
      const result = await deleteVehicle(vehicleId);
      if (!result.ok) {
        setError(`${tActions("deleteFailed")} ${errorMessage(result)}`);
        return;
      }
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      setError(`${tActions("deleteFailed")} ${errorMessage(err)}`);
    } finally {
      setDeleting(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-600 mt-1">{t("subtitle")}</p>
        </div>
        <Link href="/admin/fahrzeuge/neu">
          <button className="flex items-center gap-2 px-4 py-2 bg-kfz-blue text-white rounded-lg hover:bg-kfz-blue-dark transition-colors font-medium">
            <Plus className="w-5 h-5" />
            {t("newVehicle")}
          </button>
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
            />
          </div>

          <div>
            <select
              value={statusFilter || ""}
              onChange={(e) => setStatusFilter(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
            >
              <option value="">{t("allStatuses")}</option>
              {VEHICLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getVehicleStatusLabel(tCommon, status)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {vehiclesLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto"></div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            {t("empty")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t("columns.vehicle")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t("columns.year")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t("columns.mileage")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t("columns.price")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t("columns.source")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t("columns.status")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/fahrzeuge/${vehicle.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {vehicle.brand} {vehicle.model}
                          </p>
                          {vehicle.featured && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" aria-label={t("featured")} />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{vehicle.year}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {vehicle.mileage != null ? tAdmin("units.mileage", { value: format.number(vehicle.mileage) }) : "–"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-kfz-blue">
                      {vehicle.price != null ? formatPrice(format, vehicle.price) : "–"}
                    </td>
                    <td className="px-6 py-4">
                      <VehicleSourceBadge sourceType={vehicle.source_type || "rbm"} />
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          STATUS_COLORS[vehicle.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {getVehicleStatusLabel(tCommon, vehicle.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Link href={`/admin/fahrzeuge/${vehicle.id}`}>
                          <button
                            title={t("actions.view")}
                            aria-label={t("actions.view")}
                            className="p-2 text-gray-600 hover:text-kfz-blue hover:bg-gray-100 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </Link>
                        <Link href={`/admin/fahrzeuge/${vehicle.id}/edit`}>
                          <button
                            title={t("actions.edit")}
                            aria-label={t("actions.edit")}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          disabled={deleting === vehicle.id}
                          title={t("actions.delete")}
                          aria-label={t("actions.delete")}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
