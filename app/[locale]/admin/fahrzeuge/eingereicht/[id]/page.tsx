"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, AlertCircle, CheckCircle, Upload } from "lucide-react";
import Image from "next/image";

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
  power: number;
  status: string;
  user_id: string;
  images: string[];
  created_at: string;
  sales_type?: string;
  commission?: number;
}

export default function SubmittedVehicleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { loading, isAdmin } = useAuth();
  const [vehicle, setVehicle] = useState<SubmittedVehicle | null>(null);
  const [vehicleLoading, setVehicleLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [publishPrice, setPublishPrice] = useState<number | null>(null);
  const [publishDescription, setPublishDescription] = useState("");
  const [publishFeatured, setPublishFeatured] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const vehicleId = params?.id as string;

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
        const { getSubmittedVehicleById } = await import("@/app/actions/admin");
        const data = await getSubmittedVehicleById(vehicleId);
        setVehicle(data);
        setPublishPrice(data.price);
        setPublishDescription(data.description || "");
        setError("");
      } catch (err) {
        console.error("Error loading vehicle:", err);
        setError(err instanceof Error ? err.message : "Fehler beim Laden des Fahrzeugs");
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

    if (publishPrice === null || publishPrice < 0) {
      setError("Bitte geben Sie einen gültigen Preis ein");
      return;
    }

    try {
      setPublishing(true);
      const { publishSubmittedVehicle } = await import("@/app/actions/admin");
      const result = await publishSubmittedVehicle(vehicle.id, {
        price: publishPrice,
        description: publishDescription,
        featured: publishFeatured,
      });

      router.push(`/admin/fahrzeuge/${result.vehicleId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Veröffentlichen");
      setPublishing(false);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (vehicleLoading) {
    return (
      <div className="space-y-6">
        <Link href="/admin/fahrzeuge/eingereicht">
          <button className="flex items-center gap-2 text-kfz-blue hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </button>
        </Link>
        <div className="flex justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Fahrzeug wird geladen...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <Link href="/admin/fahrzeuge/eingereicht">
          <button className="flex items-center gap-2 text-kfz-blue hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </button>
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-800">Fahrzeug nicht gefunden</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Link href="/admin/fahrzeuge/eingereicht">
        <button className="flex items-center gap-2 text-kfz-blue hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Zurück zu eingereichten Fahrzeugen
        </button>
      </Link>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative w-full aspect-video bg-gray-200">
              {vehicle.images && vehicle.images.length > 0 ? (
                <Image
                  src={vehicle.images[currentImageIndex]}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Upload className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>

            {vehicle.images && vehicle.images.length > 1 && (
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Bild {currentImageIndex + 1} von {vehicle.images.length}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setCurrentImageIndex(
                          currentImageIndex > 0 ? currentImageIndex - 1 : vehicle.images.length - 1
                        )
                      }
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                    >
                      ←
                    </button>
                    <button
                      onClick={() =>
                        setCurrentImageIndex(
                          currentImageIndex < vehicle.images.length - 1 ? currentImageIndex + 1 : 0
                        )
                      }
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vehicle Info */}
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {vehicle.brand} {vehicle.model}
              </h1>
              <p className="text-gray-600 mt-1">{vehicle.year} • {vehicle.mileage?.toLocaleString("de-DE")} km</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Kraftstoff</p>
                <p className="font-semibold text-gray-900">{vehicle.fuel_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Getriebe</p>
                <p className="font-semibold text-gray-900">{vehicle.transmission}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Farbe</p>
                <p className="font-semibold text-gray-900">{vehicle.color}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Leistung</p>
                <p className="font-semibold text-gray-900">{vehicle.power} PS</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Karosserie</p>
                <p className="font-semibold text-gray-900">{vehicle.body_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold text-gray-900 capitalize">{vehicle.status}</p>
              </div>
            </div>

            {vehicle.sales_type && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-1">Verkaufsart</p>
                <p className="font-semibold text-gray-900">
                  {vehicle.sales_type === "Direktverkauf"
                    ? "🤝 Direktverkauf an RBM"
                    : vehicle.sales_type === "Inzahlungnahme"
                    ? "🔄 Inzahlungnahme (Trade-In)"
                    : vehicle.sales_type}
                </p>
              </div>
            )}

            {vehicle.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Beschreibung</p>
                <p className="text-gray-900">{vehicle.description}</p>
              </div>
            )}

            {vehicle.features && vehicle.features.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-3">Ausstattung</p>
                <div className="grid grid-cols-2 gap-2">
                  {vehicle.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Price Card */}
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Eingereicht von Kunde</p>
              <p className="text-2xl font-bold text-kfz-blue">
                € {vehicle.price.toLocaleString("de-DE")}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(vehicle.created_at).toLocaleDateString("de-DE")}
              </p>
            </div>
          </div>

          {/* Publish Form */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
            <h3 className="font-bold text-gray-900">In Fahrzeuge veröffentlichen</h3>

            {!showPublishForm ? (
              <button
                onClick={() => setShowPublishForm(true)}
                className="w-full px-4 py-2 bg-kfz-blue text-white rounded-lg hover:bg-kfz-blue-dark font-medium transition-colors"
              >
                Veröffentlichen
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Verkaufspreis (€)
                  </label>
                  <input
                    type="number"
                    value={publishPrice || ""}
                    onChange={(e) => setPublishPrice(e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Beschreibung (optional)
                  </label>
                  <textarea
                    value={publishDescription}
                    onChange={(e) => setPublishDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                  />
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={publishFeatured}
                    onChange={(e) => setPublishFeatured(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-700">Als Highlight markieren</span>
                </label>

                <div className="space-y-2 pt-2 border-t">
                  <button
                    onClick={handlePublish}
                    disabled={publishing}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium transition-colors"
                  >
                    {publishing ? "Wird veröffentlicht..." : "✓ Bestätigen & Veröffentlichen"}
                  </button>
                  <button
                    onClick={() => setShowPublishForm(false)}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Abbrechen
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
