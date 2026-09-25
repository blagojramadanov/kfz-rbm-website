"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, ArrowLeft } from "lucide-react";
import type { TradeInRequest } from "@/lib/supabase";
import { useErrorMessage } from "@/lib/use-error-message";

const STATUS_LABELS: Record<string, string> = {
  new: "Neue Anfrage",
  reviewing: "Wird geprüft",
  contact_made: "Kontakt aufgenommen",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  new: "Ihre Anfrage wurde eingereicht und wird in Kürze von unserem Team überprüft.",
  reviewing: "Unsere Experten überprüfen derzeit Ihre Anfrage und Ihre Fahrzeugwertschätzung.",
  contact_made: "Wir haben Ihre Anfrage geprüft und werden uns in Kürze mit Ihnen in Verbindung setzen.",
  completed: "Diese Anfrage wurde abgeschlossen.",
  cancelled: "Diese Anfrage wurde storniert.",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 border-blue-300",
  reviewing: "bg-yellow-100 text-yellow-800 border-yellow-300",
  contact_made: "bg-purple-100 text-purple-800 border-purple-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

export default function TradeInRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { loading, isAuthenticated, user } = useAuth();
  const [request, setRequest] = useState<TradeInRequest | null>(null);
  const [requestLoading, setRequestLoading] = useState(true);
  const errorMessage = useErrorMessage();
  const [error, setError] = useState("");

  const requestId = params?.id as string;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const loadRequest = async () => {
      if (!user || !requestId) return;

      try {
        const { getTradeInRequestById } = await import("@/app/actions/trade-in");
        const result = await getTradeInRequestById(requestId);
        if (!result.ok) {
          setError(errorMessage(result));
          return;
        }
        setRequest(result.request);
      } catch (err) {
        console.error("Error loading request:", err);
        setError(errorMessage(err));
      } finally {
        setRequestLoading(false);
      }
    };

    if (isAuthenticated && user && requestId) {
      loadRequest();
    }
  }, [isAuthenticated, user, requestId]);

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
      <div className="bg-gradient-to-r from-kfz-blue to-kfz-blue-dark text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/dashboard/inzahlungnahme-anfragen"
            className="text-blue-100 hover:text-white mb-2 inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zu Anfragen
          </Link>
          <h1 className="text-3xl font-bold mb-2">Inzahlungnahme-Details</h1>
          <p className="text-blue-100">Anfrage-ID: {requestId}</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {requestLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto"></div>
            <p className="text-gray-600 mt-4">Anfrage wird geladen...</p>
          </div>
        ) : !request ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-6">Anfrage nicht gefunden.</p>
            <Link href="/dashboard/inzahlungnahme-anfragen" className="text-kfz-blue hover:underline">
              Zurück zur Übersicht
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Card */}
            <div className={`border-l-4 rounded-lg p-6 ${STATUS_COLORS[request.status]}`}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold">Status: {STATUS_LABELS[request.status]}</h2>
                <span className="text-sm font-medium">
                  {new Date(request.created_at).toLocaleDateString("de-DE")}
                </span>
              </div>
              <p className="text-sm">{STATUS_DESCRIPTIONS[request.status]}</p>
            </div>

            {/* Request Details */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Vehicle */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Ihr Fahrzeug</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Marke & Modell</p>
                    <p className="font-semibold text-gray-900">
                      {request.current_vehicle_brand} {request.current_vehicle_model}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Erstzulassung</p>
                    <p className="font-semibold text-gray-900">{request.current_vehicle_year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Kilometerstand</p>
                    <p className="font-semibold text-gray-900">
                      {request.current_vehicle_mileage?.toLocaleString("de-DE")} km
                    </p>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-600">Geschätzter Wert</p>
                    <p className="text-2xl font-bold text-kfz-blue">
                      € {request.current_vehicle_value_estimate?.toLocaleString("de-DE")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Desired Vehicle */}
              {request.desired_vehicle && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Gewünschtes Fahrzeug</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Marke & Modell</p>
                      <p className="font-semibold text-gray-900">
                        {request.desired_vehicle.brand} {request.desired_vehicle.model}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Jahr</p>
                      <p className="font-semibold text-gray-900">{request.desired_vehicle.year}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Kilometerstand</p>
                      <p className="font-semibold text-gray-900">
                        {request.desired_vehicle.mileage?.toLocaleString("de-DE")} km
                      </p>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-600">Preis</p>
                      <p className="text-2xl font-bold text-kfz-blue">
                        € {request.desired_vehicle.price?.toLocaleString("de-DE")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Breakdown */}
            {request.desired_vehicle && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Unverbindliche Preisschätzung</h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-700">Geschätzter Wert Ihres Fahrzeugs:</span>
                    <span className="font-semibold">
                      € {request.current_vehicle_value_estimate?.toLocaleString("de-DE")}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-700">Preis des gewünschten Fahrzeugs:</span>
                    <span className="font-semibold">
                      € {request.desired_vehicle.price?.toLocaleString("de-DE")}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-4 bg-white rounded p-3">
                    <span className="font-bold text-gray-900">Geschätzte Zuzahlung/Gutschrift:</span>
                    <span
                      className={`text-2xl font-bold ${
                        (request.current_vehicle_value_estimate ?? 0) >
                        (request.desired_vehicle.price ?? 0)
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {(request.current_vehicle_value_estimate ?? 0) -
                        (request.desired_vehicle.price ?? 0) >
                      0
                        ? "+"
                        : ""}
                      €{" "}
                      {Math.abs(
                        (request.current_vehicle_value_estimate ?? 0) -
                          (request.desired_vehicle.price ?? 0)
                      ).toLocaleString("de-DE")}
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-white border border-blue-300 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>ⓘ Wichtig:</strong> Die endgültige Fahrzeugbewertung und Zuzahlung wird individuell durch
                    unser Team festgelegt. Der oben angezeigte Betrag ist unverbindlich und dient nur zur Schätzung.
                  </p>
                </div>
              </div>
            )}

            {/* Admin Notes */}
            {request.admin_notes && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Admin Notes</h3>
                <p className="text-gray-700">{request.admin_notes}</p>
              </div>
            )}

            {/* Important Notice */}
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-6">
              <h3 className="font-bold text-amber-900 mb-2">Wichtige Hinweise</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-amber-900">
                <li>
                  Diese Schätzung ist <strong>unverbindlich</strong> und basiert auf Ihren Angaben.
                </li>
                <li>
                  Die tatsächliche Fahrzeugbewertung wird nach einer Inspektion durch unser Team festgelegt.
                </li>
                <li>Der endgültige Kaufpreis kann von der Schätzung abweichen.</li>
                <li>
                  Wir werden sich mit Ihnen in Verbindung setzen, um die genauen Bedingungen zu besprechen.
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between gap-4">
              <Link href="/dashboard/inzahlungnahme-anfragen">
                <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                  ← Zurück
                </button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
