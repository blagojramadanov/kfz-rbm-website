"use client";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, Edit2, X } from "lucide-react";

export default function AdminTradeInRequestsPage() {
  const params = useParams();
  const locale = params.locale as string || 'de';
  const router = useRouter();
  const { loading, isAdmin } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("new");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setRequestsLoading(true);
        const { getTradeInRequests } = await import("@/app/actions/admin");
        const data = await getTradeInRequests({
          status: statusFilter || undefined,
        });
        setRequests(data);
        setError("");
      } catch (err) {
        console.error("Error loading requests:", err);
        setError("Fehler beim Laden der Anfragen");
      } finally {
        setRequestsLoading(false);
      }
    };

    if (isAdmin) loadRequests();
  }, [statusFilter, isAdmin]);

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      setActionInProgress(requestId);
      const { updateTradeInRequest } = await import("@/app/actions/admin");
      await updateTradeInRequest(requestId, {
        status: newStatus as any,
        admin_notes: editingNotes,
      });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: newStatus, admin_notes: editingNotes } : r
        )
      );
      setEditingId(null);
      setEditingNotes("");
      setError("");
    } catch (err) {
      setError("Fehler beim Aktualisieren: " + (err instanceof Error ? err.message : "Unbekannter Fehler"));
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
    { value: "new", label: "Neu" },
    { value: "reviewing", label: "Wird geprüft" },
    { value: "contact_made", label: "Kontakt aufgenommen" },
    { value: "completed", label: "Abgeschlossen" },
    { value: "cancelled", label: "Storniert" },
  ];

  const STATUS_COLORS: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    reviewing: "bg-yellow-100 text-yellow-800",
    contact_made: "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inzahlungnahmen</h1>
        <p className="text-gray-600 mt-1">Verwaltung von Tausch- und Inzahlungnahmeanfragen</p>
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
        {requestsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Keine Anfragen gefunden.</p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {request.user?.full_name}
                  </h3>
                  <p className="text-sm text-gray-600">{request.user?.email}</p>
                  <p className="text-sm text-gray-500">{request.user?.phone || "Keine Telefon"}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    STATUS_COLORS[request.status] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {statuses.find((s) => s.value === request.status)?.label || request.status}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">Aktuelles Fahrzeug</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {request.current_vehicle_year} {request.current_vehicle_brand}{" "}
                    {request.current_vehicle_model}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {request.current_vehicle_mileage?.toLocaleString("de-DE")} km
                  </p>
                  <p className="text-sm text-gray-600">
                    Geschätzter Wert: € {request.current_vehicle_value_estimate?.toLocaleString("de-DE")}
                  </p>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 mb-2">Gewünschtes Fahrzeug</p>
                  {request.desired_vehicle ? (
                    <>
                      <p className="text-lg font-semibold text-gray-900">
                        {request.desired_vehicle.year} {request.desired_vehicle.brand}{" "}
                        {request.desired_vehicle.model}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        € {request.desired_vehicle.price?.toLocaleString("de-DE")}
                      </p>
                      {request.estimated_price_difference !== undefined && (
                        <p
                          className={`text-sm font-medium mt-2 ${
                            request.estimated_price_difference > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {request.estimated_price_difference > 0 ? "Zuzahlung: " : "Gutschrift: "}€{" "}
                          {Math.abs(
                            request.estimated_price_difference
                          ).toLocaleString("de-DE")}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">Fahrzeug nicht gefunden</p>
                  )}
                </div>
              </div>

              {request.commission && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium text-gray-900">🔐 Commission:</span>
                    <span className="text-gray-600 ml-2">{request.commission}%</span>
                  </p>
                </div>
              )}

              {editingId === request.id ? (
                <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-gray-50">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Admin-Notizen
                  </label>
                  <textarea
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    placeholder="Notizen zur Anfrage..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex gap-2 mt-3">
                    <select
                      value={request.status}
                      onChange={(e) => handleStatusChange(request.id, e.target.value)}
                      disabled={actionInProgress === request.id}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {statuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditingNotes("");
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {request.admin_notes && (
                    <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 mb-2">Admin-Notizen</p>
                      <p className="text-sm text-gray-700">{request.admin_notes}</p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setEditingId(request.id);
                      setEditingNotes(request.admin_notes || "");
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Status und Notizen bearbeiten
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
