"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Plus, Car, Edit2, Trash2, Clock, CheckCircle, AlertCircle, Pencil, Send } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { SubmittedVehicle } from "@/lib/supabase";

type VehicleStatus = "draft" | "submitted" | "under_review" | "approved" | "rejected";

const statusConfig: Record<VehicleStatus, { label: string; color: string; icon: React.ReactNode; bgColor: string }> = {
  draft: {
    label: "Entwurf",
    color: "text-gray-600",
    icon: <Pencil className="w-4 h-4" />,
    bgColor: "bg-gray-100",
  },
  submitted: {
    label: "Eingereicht",
    color: "text-blue-600",
    icon: <Clock className="w-4 h-4" />,
    bgColor: "bg-blue-100",
  },
  under_review: {
    label: "Überprüfung läuft",
    color: "text-yellow-600",
    icon: <Clock className="w-4 h-4" />,
    bgColor: "bg-yellow-100",
  },
  approved: {
    label: "Genehmigt",
    color: "text-green-600",
    icon: <CheckCircle className="w-4 h-4" />,
    bgColor: "bg-green-100",
  },
  rejected: {
    label: "Abgelehnt",
    color: "text-red-600",
    icon: <AlertCircle className="w-4 h-4" />,
    bgColor: "bg-red-100",
  },
};

export default function MyVehiclesPage() {
  const router = useRouter();
  const { loading, isAuthenticated, user } = useAuth();
  const [vehicles, setVehicles] = useState<SubmittedVehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      fetchVehicles();
    }
  }, [user]);

  const fetchVehicles = async () => {
    if (!user) return;
    try {
      setLoadingVehicles(true);
      const { getSubmittedVehicles } = await import("@/app/actions/vehicles");
      const data = await getSubmittedVehicles(user.id);
      setVehicles(data || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      const errorMsg = error instanceof Error ? error.message : "Fehler beim Laden der Fahrzeuge";
      alert(errorMsg);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    if (!user || !confirm("Sind Sie sicher, dass Sie dieses Fahrzeug löschen möchten?")) {
      return;
    }

    try {
      setDeleting(vehicleId);
      const { deleteVehicle } = await import("@/app/actions/vehicles");
      await deleteVehicle(vehicleId, user.id);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      const errorMsg = error instanceof Error ? error.message : "Fehler beim Löschen des Fahrzeugs";
      alert(errorMsg);
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (vehicleId: string) => {
    router.push(`/dashboard/fahrzeug-anbieten?edit=${vehicleId}`);
  };

  const handleSubmit = async (vehicleId: string) => {
    if (!user || !confirm("Sind Sie sicher, dass Sie dieses Fahrzeug einreichen möchten? Nach dem Einreichen können Sie es nicht mehr bearbeiten.")) {
      return;
    }

    try {
      setSubmitting(vehicleId);
      const { updateVehicleStatus } = await import("@/app/actions/vehicles");
      await updateVehicleStatus(vehicleId, user.id, "submitted");
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicleId ? { ...v, status: "submitted" } : v
        )
      );
    } catch (error) {
      console.error("Error submitting vehicle:", error);
      let errorMsg = "Fehler beim Einreichen des Fahrzeugs";
      let debugInfo = null;

      if (error instanceof Error) {
        try {
          const parsed = JSON.parse(error.message);
          errorMsg = parsed.message || errorMsg;
          debugInfo = parsed._debug;
        } catch {
          errorMsg = error.message;
        }
      }

      // Show error with debug info
      if (debugInfo) {
        console.log("[DEBUG_INFO]", JSON.stringify(debugInfo, null, 2));
        alert(`${errorMsg}\n\nDebug Info: ${JSON.stringify(debugInfo, null, 2)}`);
      } else {
        alert(errorMsg);
      }
    } finally {
      setSubmitting(null);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard" className="text-kfz-blue hover:underline mb-2 inline-block">
                Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                Meine Fahrzeuge
              </h1>
              <p className="text-gray-600 mt-1">
                Verwalten und bearbeiten Sie Ihre angebotenen Fahrzeuge
              </p>
            </div>
            <Link href="/dashboard/fahrzeug-anbieten">
              <Button className="bg-kfz-blue hover:bg-kfz-blue-dark text-white font-semibold">
                <Plus className="mr-2 w-4 h-4" />
                Fahrzeug hinzufügen
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loadingVehicles ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
              <p className="text-gray-600">Fahrzeuge werden geladen...</p>
            </div>
          </div>
        ) : vehicles.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gray-100 rounded-lg p-6">
                <Car className="w-12 h-12 text-gray-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Noch keine Fahrzeuge angeboten
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Sie haben noch keine Fahrzeuge zum Verkauf angeboten. Klicken Sie unten, um Ihr erstes Fahrzeug hinzuzufügen.
            </p>
            <Link href="/dashboard/fahrzeug-anbieten">
              <Button className="bg-kfz-blue hover:bg-kfz-blue-dark text-white font-semibold">
                <Plus className="mr-2 w-4 h-4" />
                Erstes Fahrzeug anbieten
              </Button>
            </Link>
          </div>
        ) : (
          // Vehicle Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => {
              const status = (vehicle.status as VehicleStatus) || "draft";
              const config = statusConfig[status];
              const canEdit = status === "draft";

              return (
                <div key={vehicle.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image */}
                  <div className="relative w-full aspect-video bg-gray-200 overflow-hidden">
                    {vehicle.images && vehicle.images.length > 0 ? (
                      <Image
                        src={vehicle.images[0]}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium mb-3 ${config.bgColor} ${config.color}`}>
                      {config.icon}
                      {config.label}
                    </div>

                    {/* Vehicle Info */}
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {vehicle.year} • {vehicle.mileage?.toLocaleString()} km
                    </p>

                    {/* Price */}
                    <p className="text-2xl font-bold text-kfz-blue mb-4">
                      €{vehicle.price?.toLocaleString()}
                    </p>

                    {/* Quick Specs */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-600">
                      <div>
                        <span className="font-semibold">Fuel:</span> {vehicle.fuel_type}
                      </div>
                      <div>
                        <span className="font-semibold">Trans:</span> {vehicle.transmission}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {canEdit && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(vehicle.id)}
                            className="flex-1 border-kfz-blue text-kfz-blue hover:bg-kfz-blue hover:text-white"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Bearbeiten
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(vehicle.id)}
                            disabled={deleting === vehicle.id}
                            className="flex-1 border-red-300 text-red-600 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            {deleting === vehicle.id ? "Löschen..." : "Löschen"}
                          </Button>
                        </div>
                      )}
                      {canEdit && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSubmit(vehicle.id)}
                          disabled={submitting === vehicle.id}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                        >
                          <Send className="w-4 h-4 mr-1" />
                          {submitting === vehicle.id ? "Wird eingereicht..." : "Einreichen"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
