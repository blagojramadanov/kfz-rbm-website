"use client";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle } from "lucide-react";

export default function AdminStatisticsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string || 'de';
  const router = useRouter();
  const { loading, isAdmin } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/admin-access-denied");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const { getDashboardStats } = await import("@/app/actions/admin");
        const data = await getDashboardStats();
        setStats(data);
        setError("");
      } catch (err) {
        console.error("Error loading stats:", err);
        setError("Fehler beim Laden der Statistiken");
      } finally {
        setStatsLoading(false);
      }
    };

    if (isAdmin) loadStats();
  }, [isAdmin]);

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Statistiken</h1>
        <p className="text-gray-600 mt-1">Systemübersicht und Kennzahlen</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {statsLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto"></div>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">Gesamtfahrzeuge</p>
              <p className="text-3xl font-bold text-kfz-blue">{stats.total_vehicles || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">Verfügbare Fahrzeuge</p>
              <p className="text-3xl font-bold text-green-600">{stats.vehicles_available || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">Eingereichte Fahrzeuge</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.total_submitted_vehicles || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">Gesamtkunden</p>
              <p className="text-3xl font-bold text-purple-600">{stats.total_customers || 0}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">Anfragen (Neu)</p>
              <p className="text-3xl font-bold text-blue-600">{stats.inquiries_new || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">Inzahlungnahmen (Neu)</p>
              <p className="text-3xl font-bold text-purple-600">{stats.trade_in_requests_new || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">Durchschn. Fahrzeugpreis</p>
              <p className="text-3xl font-bold text-green-600">
                € {stats.avg_vehicle_price ? Math.round(stats.avg_vehicle_price).toLocaleString("de-DE") : "0"}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fahrzeugstatus</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Entwurf</span>
                  <span className="font-medium text-gray-900">{stats.vehicles_draft || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Verfügbar</span>
                  <span className="font-medium text-green-600">{stats.vehicles_available || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Reserviert</span>
                  <span className="font-medium text-blue-600">{stats.vehicles_reserved || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Verkauft</span>
                  <span className="font-medium text-red-600">{stats.vehicles_sold || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Eingereichte Fahrzeuge</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Eingereicht</span>
                  <span className="font-medium text-gray-900">{stats.submitted_vehicles_eingereicht || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">In Bearbeitung</span>
                  <span className="font-medium text-yellow-600">{stats.submitted_vehicles_in_bearbeitung || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Angebot gesendet</span>
                  <span className="font-medium text-green-600">{stats.submitted_vehicles_angebot_gesendet || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Abgelehnt</span>
                  <span className="font-medium text-red-600">{stats.submitted_vehicles_abgelehnt || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inzahlungnahmen Status</h3>
            <div className="grid md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Neu</p>
                <p className="text-2xl font-bold text-blue-600">{stats.trade_in_requests_new || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Wird geprüft</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.trade_in_requests_reviewing || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Kontakt aufgen.</p>
                <p className="text-2xl font-bold text-purple-600">{stats.trade_in_requests_contact_made || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Abgeschlossen</p>
                <p className="text-2xl font-bold text-green-600">{stats.trade_in_requests_completed || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Storniert</p>
                <p className="text-2xl font-bold text-red-600">{stats.trade_in_requests_cancelled || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Anfragen Status</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Neu</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inquiries_new || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Gelesen</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inquiries_read || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Beantwortet</p>
                <p className="text-2xl font-bold text-green-600">{stats.inquiries_responded || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Geschlossen</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inquiries_closed || 0}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Keine Daten verfügbar.</p>
        </div>
      )}
    </div>
  );
}
