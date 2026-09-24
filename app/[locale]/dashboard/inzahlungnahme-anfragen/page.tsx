"use client";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { AlertCircle, Trash2, ArrowRight } from "lucide-react";
import type { TradeInRequest } from "@/lib/supabase";

const STATUS_LABELS: Record<string, string> = {
  new: "Neue Anfrage",
  reviewing: "Wird geprüft",
  contact_made: "Kontakt aufgenommen",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  contact_made: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function TradeInRequestsPage() {
  const params = useParams();
  const locale = params.locale as string || 'de';
  const router = useRouter();
  const { loading, isAuthenticated, user } = useAuth();
  const [requests, setRequests] = useState<TradeInRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const loadRequests = async () => {
      if (!user) return;

      try {
        const { getTradeInRequests } = await import("@/app/actions/trade-in");
        const data = await getTradeInRequests();
        setRequests(data);
      } catch (err) {
        console.error("Error loading requests:", err);
        setError("Fehler beim Laden der Anfragen");
      } finally {
        setRequestsLoading(false);
      }
    };

    if (isAuthenticated && user) {
      loadRequests();
    }
  }, [isAuthenticated, user]);


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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/dashboard" className="text-blue-100 hover:text-white mb-2 inline-block text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Meine Inzahlungnahmeanfragen</h1>
          <p className="text-blue-100">Verwalten Sie Ihre Inzahlungnahmeanfragen und den Status</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Anfragen ({requests.length})</h2>
          <Link href="/dashboard/inzahlungnahme">
            <Button className="bg-kfz-blue hover:bg-kfz-blue-dark text-white">
              Neue Anfrage erstellen
            </Button>
          </Link>
        </div>

        {requestsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto"></div>
            <p className="text-gray-600 mt-4">Anfragen werden geladen...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-6">Sie haben noch keine Inzahlungnahmeanfragen erstellt.</p>
            <Link href="/dashboard/inzahlungnahme">
              <Button className="bg-kfz-blue hover:bg-kfz-blue-dark text-white">
                Erste Anfrage erstellen
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  {/* Left: Request Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.current_vehicle_year} {request.current_vehicle_brand} {request.current_vehicle_model}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[request.status]}`}>
                        {STATUS_LABELS[request.status]}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Current Vehicle */}
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Ihr Fahrzeug</strong>
                        </p>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-900">
                            {request.current_vehicle_mileage?.toLocaleString("de-DE")} km
                          </p>
                          <p className="font-semibold text-lg text-kfz-blue">
                            € {request.current_vehicle_value_estimate?.toLocaleString("de-DE")}
                          </p>
                        </div>
                      </div>

                      {/* Desired Vehicle */}
                      {request.desired_vehicle && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Gewünschtes Fahrzeug</strong>
                          </p>
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-900">
                              {request.desired_vehicle.year} {request.desired_vehicle.brand}{" "}
                              {request.desired_vehicle.model}
                            </p>
                            <p className="font-semibold text-lg text-kfz-blue">
                              € {request.desired_vehicle.price?.toLocaleString("de-DE")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Estimated Difference */}
                    {request.desired_vehicle && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs text-gray-600 mb-2">
                          <strong>Unverbindliche Schätzung</strong>
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">Geschätzte Zuzahlung/Gutschrift:</span>
                          <span
                            className={`font-bold text-lg ${
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
                        <p className="text-xs text-gray-500 mt-2 italic">
                          Die endgültige Fahrzeugbewertung und Zuzahlung wird individuell durch unser Team festgelegt.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2">
                    <Link href={`/dashboard/inzahlungnahme-anfragen/${request.id}`}>
                      <Button className="w-full bg-kfz-blue hover:bg-kfz-blue-dark text-white" variant="default">
                        Details anzeigen
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>

                    <div className="text-xs text-gray-500 text-center pt-2">
                      {new Date(request.created_at).toLocaleDateString("de-DE")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
