"use client";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { Edit2, Trash2, Plus, Search, AlertCircle, Eye, Star, Heart } from "lucide-react";
import { VehicleSourceBadge } from "@/components/vehicle-source-badge";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { formatPrice } from "@/lib/format-vehicle";
import { StatusBadge } from "@/components/status-badge";
import { getVehicleStatusLabel } from "@/lib/vehicle-labels";

const VEHICLE_STATUSES = ["draft", "available", "reserved", "sold"] as const;


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
  favoriteCount: number;
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="page-title text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button asChild className="self-start sm:self-auto">
          <Link href="/admin/fahrzeuge/neu">
            <Plus className="mr-2 w-5 h-5" aria-hidden="true" />
            {t("newVehicle")}
          </Link>
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive-subtle/50 border border-destructive-border rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive-subtle-foreground">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground/70" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field pl-10 pr-4"
            />
          </div>

          <div>
            <select
              value={statusFilter || ""}
              onChange={(e) => setStatusFilter(e.target.value || null)}
              className="field"
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
      <div className="card overflow-hidden">
        {vehiclesLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <>
          {/* Phones: one card per vehicle */}
          <ul className="md:hidden divide-y divide-border">
            {vehicles.map((vehicle) => (
              <li key={vehicle.id} className="p-4 space-y-3">
                <Link href={`/admin/fahrzeuge/${vehicle.id}`} className="block">
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <span className="min-w-0 break-words">{vehicle.brand} {vehicle.model}</span>
                    {vehicle.featured && (
                      <Star className="w-4 h-4 shrink-0 text-featured fill-featured" aria-label={t("featured")} />
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {vehicle.year}
                    {vehicle.mileage != null && <> · {tAdmin("units.mileage", { value: format.number(vehicle.mileage) })}</>}
                  </p>
                  <p className="font-semibold text-primary mt-1">
                    {vehicle.price != null ? formatPrice(format, vehicle.price) : "–"}
                  </p>
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <VehicleSourceBadge sourceType={vehicle.source_type || "rbm"} />
                  <StatusBadge kind="vehicle" status={vehicle.status}>{getVehicleStatusLabel(tCommon, vehicle.status)}</StatusBadge>
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <Heart
                      className={`w-4 h-4 ${vehicle.favoriteCount > 0 ? "text-destructive fill-destructive" : "text-muted-foreground/50"}`}
                      aria-hidden="true"
                    />
                    {t("favoriteCount", { value: format.number(vehicle.favoriteCount) })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/fahrzeuge/${vehicle.id}`}
                    aria-label={t("actions.view")}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-input text-muted-foreground hover:text-primary hover:bg-secondary"
                  >
                    <Eye className="w-5 h-5" aria-hidden="true" />
                  </Link>
                  <Link
                    href={`/admin/fahrzeuge/${vehicle.id}/edit`}
                    aria-label={t("actions.edit")}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-input text-muted-foreground hover:text-primary hover:bg-secondary"
                  >
                    <Edit2 className="w-5 h-5" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(vehicle.id)}
                    disabled={deleting === vehicle.id}
                    aria-label={t("actions.delete")}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-input text-muted-foreground hover:text-destructive hover:bg-secondary disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* md+: table (scrolls horizontally inside the card if needed) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t("columns.vehicle")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t("columns.year")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t("columns.mileage")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t("columns.price")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t("columns.source")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t("columns.status")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t("columns.favorites")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="hover:bg-info-subtle/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/fahrzeuge/${vehicle.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {vehicle.brand} {vehicle.model}
                          </p>
                          {vehicle.featured && (
                            <Star className="w-4 h-4 text-featured fill-featured" aria-label={t("featured")} />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{vehicle.year}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {vehicle.mileage != null ? tAdmin("units.mileage", { value: format.number(vehicle.mileage) }) : "–"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-primary">
                      {vehicle.price != null ? formatPrice(format, vehicle.price) : "–"}
                    </td>
                    <td className="px-6 py-4">
                      <VehicleSourceBadge sourceType={vehicle.source_type || "rbm"} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge kind="vehicle" status={vehicle.status}>{getVehicleStatusLabel(tCommon, vehicle.status)}</StatusBadge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Heart
                          className={`w-4 h-4 ${vehicle.favoriteCount > 0 ? "text-destructive fill-destructive" : "text-muted-foreground/50"}`}
                          aria-hidden="true"
                        />
                        {t("favoriteCount", { value: format.number(vehicle.favoriteCount) })}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Link href={`/admin/fahrzeuge/${vehicle.id}`}>
                          <button
                            title={t("actions.view")}
                            aria-label={t("actions.view")}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </Link>
                        <Link href={`/admin/fahrzeuge/${vehicle.id}/edit`}>
                          <button
                            title={t("actions.edit")}
                            aria-label={t("actions.edit")}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          disabled={deleting === vehicle.id}
                          title={t("actions.delete")}
                          aria-label={t("actions.delete")}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-secondary rounded transition-colors disabled:opacity-50"
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
          </>
        )}
      </div>
    </div>
  );
}
