"use client";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Edit2, Trash2, Plus, Search, AlertCircle, Eye, Star } from "lucide-react";
import Link from "next/link";
import { VehicleSourceBadge } from "@/components/vehicle-source-badge";

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
  const t = useTranslations();
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
      router.push("/admin-access-denied");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const { getVehicles } = await import("@/app/actions/admin");
        const data = await getVehicles({
          search: search || undefined,
          status: statusFilter || undefined,
        });
        setVehicles(data);
      } catch (err) {
        console.error("Error loading vehicles:", err);
        setError("Fehler beim Laden der Fahrzeuge");
      } finally {
        setVehiclesLoading(false);
      }
    };

    setVehiclesLoading(true);
    const timeout = setTimeout(loadVehicles, 300);
    return () => clearTimeout(timeout);
  }, [search, statusFilter, isAdmin]);

  const handleDelete = async (vehicleId: string) => {
    if (!confirm("Sind Sie sicher, dass Sie dieses Fahrzeug löschen möchten?")) return;

    try {
      setDeleting(vehicleId);
      const { deleteVehicle } = await import("@/app/actions/admin");
      await deleteVehicle(vehicleId);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      setError("Fehler beim Löschen des Fahrzeugs");
    } finally {
      setDeleting(null);
    }
  };

  const STATUS_LABELS: Record<string, string> = {
    draft: "Entwurf",
    available: "Verfügbar",
    reserved: "Reserviert",
    sold: "Verkauft",
  };

  const STATUS_COLORS: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    available: "bg-green-100 text-green-800",
    reserved: "bg-blue-100 text-blue-800",
    sold: "bg-red-100 text-red-800",
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fahrzeuge verwalten</h1>
          <p className="text-gray-600 mt-1">Verwaltung des Fahrzeuginventars</p>
        </div>
        <Link href="/admin/fahrzeuge/neu">
          <button className="flex items-center gap-2 px-4 py-2 bg-kfz-blue text-white rounded-lg hover:bg-kfz-blue-dark transition-colors font-medium">
            <Plus className="w-5 h-5" />
            Neues Fahrzeug
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
              placeholder="Nach Marke, Modell oder VIN suchen..."
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
              <option value="">Alle Status</option>
              <option value="draft">Entwurf</option>
              <option value="available">Verfügbar</option>
              <option value="reserved">Reserviert</option>
              <option value="sold">Verkauft</option>
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
            Keine Fahrzeuge gefunden.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fahrzeug</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Jahr</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Kilometer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Preis</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Quelle</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Aktionen</th>
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
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{vehicle.year}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {vehicle.mileage?.toLocaleString("de-DE")} km
                    </td>
                    <td className="px-6 py-4 font-semibold text-kfz-blue">
                      € {vehicle.price?.toLocaleString("de-DE")}
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
                        {STATUS_LABELS[vehicle.status] || vehicle.status}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Link href={`/admin/fahrzeuge/${vehicle.id}`}>
                          <button className="p-2 text-gray-600 hover:text-kfz-blue hover:bg-gray-100 rounded transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <Link href={`/admin/fahrzeuge/${vehicle.id}/edit`}>
                          <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          disabled={deleting === vehicle.id}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
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
