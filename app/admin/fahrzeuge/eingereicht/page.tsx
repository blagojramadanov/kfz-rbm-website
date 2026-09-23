"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Check, X, AlertCircle, Car, MapPin, Calendar, Gauge } from "lucide-react";
import Image from "next/image";

export default function AdminSubmittedVehiclesPage() {
  const router = useRouter();
  const { loading, isAdmin } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("eingereicht");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<Record<string, number>>({});
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

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

        // Fetch signed URLs for all images
        if (data && data.length > 0) {
          const allPaths = data.flatMap(v => v.images || []);
          if (allPaths.length > 0) {
            const { getSignedImageUrls } = await import("@/app/actions/storage");
            const urls = await getSignedImageUrls(allPaths);
            const urlMap = Object.fromEntries(urls.filter(u => u.url).map(u => [u.path, u.url!]));
            setImageUrls(urlMap);
          }
        }
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
    { value: "eingereicht", label: "Eingereicht", icon: "📥" },
    { value: "in_bearbeitung", label: "In Bearbeitung", icon: "⏳" },
    { value: "angebot_gesendet", label: "Angebot gesendet", icon: "📤" },
    { value: "abgelehnt", label: "Abgelehnt", icon: "❌" },
  ];

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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Eingereichte Fahrzeuge</h1>
        <p className="text-gray-600">Überprüfung und Genehmigung von Kundenfahrzeugen</p>
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
              {status.label}
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
              <p className="text-gray-600">Fahrzeuge werden geladen...</p>
            </div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-white rounded-lg p-16 text-center">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg text-gray-600">Keine Fahrzeuge gefunden</p>
            <p className="text-sm text-gray-500 mt-1">Es gibt aktuell keine eingereichten Fahrzeuge in diesem Status</p>
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
                    {vehicle.images && vehicle.images.length > 0 && imageUrls[vehicle.images[getSelectedImageIndex(vehicle.id)]] ? (
                      <Image
                        src={imageUrls[vehicle.images[getSelectedImageIndex(vehicle.id)]]}
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
                          {imageUrls[image] ? (
                            <Image
                              src={imageUrls[image]}
                              alt={`${vehicle.brand} ${vehicle.model} ${index + 1}`}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : null}
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
                      {statuses.find((s) => s.value === vehicle.status)?.label}
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
                    <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold mb-1">Angebotener Preis</p>
                    <p className="text-2xl font-bold text-kfz-blue">€ {vehicle.price?.toLocaleString("de-DE")}</p>
                  </div>

                  {/* Quick Specs */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="flex items-center gap-2 text-sm">
                      <Gauge className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Kilometer</p>
                        <p className="font-semibold text-gray-900">{vehicle.mileage?.toLocaleString("de-DE")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Getriebe</p>
                        <p className="font-semibold text-gray-900">{vehicle.transmission}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Kraftstoff</p>
                        <p className="font-semibold text-gray-900">{vehicle.fuel_type}</p>
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
                        <span className="text-gray-600">Verkaufsart:</span>
                        <span className="font-semibold text-gray-900">
                          {vehicle.sales_type === "Direktverkauf" ? "🤝 Direktverkauf" : "🔄 Inzahlungnahme"}
                        </span>
                      </div>
                    )}
                    {vehicle.commission && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Commission:</span>
                        <span className="font-semibold text-purple-600">{vehicle.commission}%</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {(vehicle.status === "eingereicht" || vehicle.status === "in_bearbeitung") && (
                    <div
                      className="space-y-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(vehicle.id)}
                          disabled={actionInProgress === vehicle.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Check className="w-4 h-4" />
                          {actionInProgress === vehicle.id ? "..." : "Genehmigen"}
                        </button>
                        <button
                          onClick={() => setRejectingId(rejectingId === vehicle.id ? null : vehicle.id)}
                          disabled={actionInProgress === vehicle.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="w-4 h-4" />
                          Ablehnen
                        </button>
                      </div>

                      {rejectingId === vehicle.id && (
                        <div className="pt-3 border-t border-gray-100">
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Grund für Ablehnung eingeben..."
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
                              Bestätigen
                            </button>
                            <button
                              onClick={() => {
                                setRejectingId(null);
                                setRejectReason("");
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors"
                            >
                              Abbrechen
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
