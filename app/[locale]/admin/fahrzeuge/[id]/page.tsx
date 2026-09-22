"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, ArrowLeft, Edit2, Trash2, Star } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminVehicleDetailPage() {
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
      router.push("/admin-access-denied");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    const loadVehicle = async () => {
      if (!vehicleId) return;
      try {
        setVehicleLoading(true);
        const { getVehicleById } = await import("@/app/actions/admin");
        const data = await getVehicleById(vehicleId);
        setVehicle(data);
        setError("");
      } catch (err) {
        console.error("Error loading vehicle:", err);
        setError("Fehler beim Laden des Fahrzeugs");
      } finally {
        setVehicleLoading(false);
      }
    };

    if (isAdmin && vehicleId) loadVehicle();
  }, [vehicleId, isAdmin]);

  const handleDelete = async () => {
    if (!confirm("Sind Sie sicher, dass Sie dieses Fahrzeug löschen möchten?")) return;
    try {
      setDeleting(true);
      const { deleteVehicle } = await import("@/app/actions/admin");
      await deleteVehicle(vehicleId);
      router.push("/admin/fahrzeuge");
    } catch (err) {
      setError("Fehler beim Löschen des Fahrzeugs");
      setDeleting(false);
    }
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

  if (vehicleLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Wird geladen...</p>
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
            Zurück zur Fahrzeugliste
          </button>
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">Fahrzeug nicht gefunden.</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      <Link href="/admin/fahrzeuge">
        <button className="flex items-center gap-2 text-kfz-blue hover:text-kfz-blue-dark font-medium">
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Fahrzeugliste
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
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <p className="text-gray-600 mt-1">VIN: {vehicle.vin}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              STATUS_COLORS[vehicle.status] || "bg-gray-100 text-gray-800"
            }`}
          >
            {STATUS_LABELS[vehicle.status] || vehicle.status}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Grundinformationen</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-600">Preis</p>
                <p className="text-2xl font-bold text-kfz-blue">
                  € {vehicle.price?.toLocaleString("de-DE")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Kilometer</p>
                <p className="font-medium text-gray-900">{vehicle.mileage?.toLocaleString("de-DE")} km</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Getriebe</p>
                <p className="font-medium text-gray-900">{vehicle.transmission}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Kraftstoff</p>
                <p className="font-medium text-gray-900">{vehicle.fuel_type}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Spezifikationen</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-600">Karosserie</p>
                <p className="font-medium text-gray-900">{vehicle.body_type || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Farbe (Außen)</p>
                <p className="font-medium text-gray-900">{vehicle.color_exterior || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Farbe (Innen)</p>
                <p className="font-medium text-gray-900">{vehicle.color_interior || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Motor</p>
                <p className="font-medium text-gray-900">
                  {vehicle.engine_cc} cc, {vehicle.power_hp} PS
                </p>
              </div>
            </div>
          </div>
        </div>

        {vehicle.description && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900 mb-2">Beschreibung</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{vehicle.description}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Link href={`/admin/fahrzeuge/${vehicleId}/edit`} className="flex-1">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
              <Edit2 className="w-4 h-4" />
              Bearbeiten
            </button>
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Wird gelöscht..." : "Löschen"}
          </button>
        </div>
      </div>
    </div>
  );
}
