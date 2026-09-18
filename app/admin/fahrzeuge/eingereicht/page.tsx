"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Check, X, AlertCircle, Car } from "lucide-react";
import Image from "next/image";

export default function AdminSubmittedVehiclesPage() {
  const router = useRouter();
  const { loading, isAdmin } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("under_review");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<Record<string, number>>({});

  const getSelectedImageIndex = (vehicleId: string) => selectedImageIndex[vehicleId] ?? 0;
  const setImageIndex = (vehicleId: string, index: number) => {
    setSelectedImageIndex((prev) => ({ ...prev, [vehicleId]: index }));
  };

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/admin-access-denied");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setVehiclesLoading(true);
        const { getSubmittedVehicles } = await import("@/app/actions/admin");
        const data = await getSubmittedVehicles({
          status: statusFilter || undefined,
        });
        setVehicles(data);
        setError("");
      } catch (err) {
        console.error("Error loading vehicles:", err);
        setError("Fehler beim Laden der Fahrzeuge");
      } finally {
        setVehiclesLoading(false);
      }
    };

    if (isAdmin) loadVehicles();
  }, [statusFilter, isAdmin]);

  const handleApprove = async (vehicleId: string) => {
    try {
      setActionInProgress(vehicleId);
      const { approveSubmittedVehicle } = await import("@/app/actions/admin");
      await approveSubmittedVehicle(vehicleId);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
      setError("");
    } catch (err) {
      setError("Fehler beim Genehmigen: " + (err instanceof Error ? err.message : "Unbekannter Fehler"));
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (vehicleId: string) => {
    if (!rejectReason.trim()) {
      setError("Bitte geben Sie einen Ablehnungsgrund ein");
      return;
    }
    try {
      setActionInProgress(vehicleId);
      const { rejectSubmittedVehicle } = await import("@/app/actions/admin");
      await rejectSubmittedVehicle(vehicleId, rejectReason);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
      setRejectingId(null);
      setRejectReason("");
      setError("");
    } catch (err) {
      setError("Fehler beim Ablehnen: " + (err instanceof Error ? err.message : "Unbekannter Fehler"));
    } finally {
      setActionInProgress(null);
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

  const statuses = [
    { value: "submitted", label: "Eingereicht" },
    { value: "under_review", label: "Zur Überprüfung" },
    { value: "approved", label: "Genehmigt" },
    { value: "rejected", label: "Abgelehnt" },
  ];

  const STATUS_COLORS: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-800",
    under_review: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Eingereichte Fahrzeuge</h1>
        <p className="text-gray-600 mt-1">Überprüfung und Genehmigung von Kundenfahrzeugen</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((status) => (
          <button
            key={status.value}
            onClick={() => setStatusFilter(status.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === status.value
                ? "bg-kfz-blue text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {vehiclesLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto"></div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Keine Fahrzeuge gefunden.</p>
          </div>
        ) : (
          vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Vehicle Image Gallery */}
              <div>
                {/* Main Image - Fixed height for consistent layout */}
                <div className="relative w-full h-80 bg-gray-200 overflow-hidden">
                  {vehicle.images && vehicle.images.length > 0 ? (
                    <Image
                      src={vehicle.images[getSelectedImageIndex(vehicle.id)]}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {vehicle.images && vehicle.images.length > 1 && (
                  <div className="bg-gray-100 px-4 py-4 flex gap-3 overflow-x-auto">
                    {vehicle.images.map((image: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setImageIndex(vehicle.id, index)}
                        className={`relative flex-shrink-0 w-24 h-24 rounded-lg border-2 transition-all ${
                          getSelectedImageIndex(vehicle.id) === index
                            ? "border-kfz-blue shadow-md"
                            : "border-gray-300 hover:border-gray-400 opacity-70 hover:opacity-100"
                        }`}
                        title={`Bild ${index + 1}`}
                      >
                        <Image
                          src={image}
                          alt={`${vehicle.brand} ${vehicle.model} - Photo ${index + 1}`}
                          fill
                          className="object-cover rounded-md"
                          sizes="96px"
                        />
                        <span className="absolute -top-2 -right-2 bg-kfz-blue text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                          {index + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Image Count */}
                {vehicle.images && vehicle.images.length > 0 && (
                  <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 border-t border-gray-200">
                    <strong>Bild {getSelectedImageIndex(vehicle.id) + 1}</strong> von {vehicle.images.length}
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {vehicle.year} {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Eingereicht von: <span className="font-medium">{vehicle.user?.full_name}</span>
                    </p>
                    <p className="text-sm text-gray-500">{vehicle.user?.email}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      STATUS_COLORS[vehicle.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {statuses.find((s) => s.value === vehicle.status)?.label || vehicle.status}
                  </span>
                </div>

              <div className="grid md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600">Kilometer</p>
                  <p className="font-semibold text-gray-900">{vehicle.mileage?.toLocaleString("de-DE")} km</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Jahr</p>
                  <p className="font-semibold text-gray-900">{vehicle.year}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Getriebe</p>
                  <p className="font-semibold text-gray-900">{vehicle.transmission}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Kraftstoff</p>
                  <p className="font-semibold text-gray-900">{vehicle.fuel_type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Preis</p>
                  <p className="font-semibold text-kfz-blue">€ {vehicle.price?.toLocaleString("de-DE")}</p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-2">Beschreibung</p>
                <p className="text-sm text-gray-600 line-clamp-3">{vehicle.description}</p>
              </div>

              {vehicle.sales_type && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium text-gray-900">Verkaufsart:</span>
                    <span className="text-gray-600 ml-2">{vehicle.sales_type}</span>
                  </p>
                </div>
              )}

              {vehicle.commission && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium text-gray-900">🔐 Commission:</span>
                    <span className="text-gray-600 ml-2">{vehicle.commission}%</span>
                  </p>
                </div>
              )}

              {(vehicle.status === "submitted" || vehicle.status === "under_review") && (
                <>
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <span className="font-medium">ℹ️ Bei Genehmigung:</span> Ein neues Fahrzeug vom Typ "Kundenfahrzeug" wird erstellt. Es wird zunächst als Entwurf gespeichert und muss vom Admin veröffentlicht werden.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(vehicle.id)}
                      disabled={actionInProgress === vehicle.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      {actionInProgress === vehicle.id ? "Wird genehmigt..." : "Genehmigen"}
                    </button>
                    <button
                      onClick={() => setRejectingId(rejectingId === vehicle.id ? null : vehicle.id)}
                      disabled={actionInProgress === vehicle.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                      Ablehnen
                    </button>
                  </div>
                </>
              )}

              {rejectingId === vehicle.id && (
                <div className="mt-4 p-4 border border-red-300 rounded-lg bg-red-50">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Ablehnungsgrund</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Geben Sie den Grund für die Ablehnung ein..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleReject(vehicle.id)}
                      disabled={actionInProgress === vehicle.id || !rejectReason.trim()}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionInProgress === vehicle.id ? "Wird abgelehnt..." : "Ablehnen bestätigen"}
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason("");
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
