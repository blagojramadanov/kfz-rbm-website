"use client";
import { useTranslations } from "next-intl";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle } from "lucide-react";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { formatPrice } from "@/lib/format-vehicle";
import {
  getInquiryStatusLabel,
  getSubmissionStatusLabel,
  getTradeInStatusLabel,
  getVehicleStatusLabel,
} from "@/lib/vehicle-labels";

// [DB status, stats field, colour] per breakdown card.
const VEHICLE_ROWS = [
  ["draft", "vehicles_draft", "text-gray-900"],
  ["available", "vehicles_available", "text-green-600"],
  ["reserved", "vehicles_reserved", "text-blue-600"],
  ["sold", "vehicles_sold", "text-red-600"],
] as const;
const SUBMISSION_ROWS = [
  ["eingereicht", "submitted_vehicles_eingereicht", "text-gray-900"],
  ["in_bearbeitung", "submitted_vehicles_in_bearbeitung", "text-yellow-600"],
  ["angebot_gesendet", "submitted_vehicles_angebot_gesendet", "text-green-600"],
  ["akzeptiert", "submitted_vehicles_akzeptiert", "text-emerald-700"],
  ["abgelehnt", "submitted_vehicles_abgelehnt", "text-red-600"],
] as const;
const TRADE_IN_ROWS = [
  ["new", "trade_in_requests_new", "text-blue-600"],
  ["reviewing", "trade_in_requests_reviewing", "text-yellow-600"],
  ["contact_made", "trade_in_requests_contact_made", "text-purple-600"],
  ["completed", "trade_in_requests_completed", "text-green-600"],
  ["cancelled", "trade_in_requests_cancelled", "text-red-600"],
] as const;
const INQUIRY_ROWS = [
  ["new", "inquiries_new", "text-blue-600"],
  ["read", "inquiries_read", "text-yellow-600"],
  ["responded", "inquiries_responded", "text-green-600"],
  ["closed", "inquiries_closed", "text-gray-600"],
] as const;

export default function AdminStatisticsPage() {
  const t = useTranslations("admin.statistics");
  const tAdmin = useTranslations("admin");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { loading, isAdmin } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const errorMessage = useErrorMessage();
  const format = useLocaleFormatter();
  const n = (value: number | undefined) => format.number(value || 0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const { getDashboardStats } = await import("@/app/actions/admin");
        const result = await getDashboardStats();
        if (!result.ok) {
          setError(errorMessage(result));
          return;
        }
        setStats(result.stats);
        setError("");
      } catch (err) {
        console.error("Error loading stats:", err);
        setError(errorMessage(err));
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
          <p className="text-gray-600">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{tAdmin("sidebar.statistics")}</h1>
        <p className="text-gray-600 mt-1">{t("description")}</p>
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
              <p className="text-sm text-gray-600 mb-2">{tAdmin("vehicles")}</p>
              <p className="text-3xl font-bold text-kfz-blue">{n(stats.total_vehicles)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">{t("availableVehicles")}</p>
              <p className="text-3xl font-bold text-green-600">{n(stats.vehicles_available)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">{tAdmin("sidebar.submittedVehicles")}</p>
              <p className="text-3xl font-bold text-yellow-600">{n(stats.total_submitted_vehicles)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">{t("totalCustomers")}</p>
              <p className="text-3xl font-bold text-purple-600">{n(stats.total_customers)}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">{t("newInquiries")}</p>
              <p className="text-3xl font-bold text-blue-600">{n(stats.inquiries_new)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">{t("newTradeIns")}</p>
              <p className="text-3xl font-bold text-purple-600">{n(stats.trade_in_requests_new)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-2">{t("avgPrice")}</p>
              <p className="text-3xl font-bold text-green-600">
                {formatPrice(format, stats.avg_vehicle_price || 0)}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("vehicleStatus")}</h3>
              <div className="space-y-3">
                {VEHICLE_ROWS.map(([status, key, color]) => (
                  <div key={status} className="flex justify-between">
                    <span className="text-sm text-gray-600">{getVehicleStatusLabel(tCommon, status)}</span>
                    <span className={`font-medium ${color}`}>{n(stats[key])}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{tAdmin("sidebar.submittedVehicles")}</h3>
              <div className="space-y-3">
                {SUBMISSION_ROWS.map(([status, key, color]) => (
                  <div key={status} className="flex justify-between">
                    <span className="text-sm text-gray-600">{getSubmissionStatusLabel(tCommon, status)}</span>
                    <span className={`font-medium ${color}`}>{n(stats[key])}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("tradeInStatus")}</h3>
            <div className="grid md:grid-cols-5 gap-4">
              {TRADE_IN_ROWS.map(([status, key, color]) => (
                <div key={status} className="text-center">
                  <p className="text-sm text-gray-600 mb-2">{getTradeInStatusLabel(tCommon, status)}</p>
                  <p className={`text-2xl font-bold ${color}`}>{n(stats[key])}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("inquiryStatus")}</h3>
            <div className="grid md:grid-cols-4 gap-4">
              {INQUIRY_ROWS.map(([status, key, color]) => (
                <div key={status} className="text-center">
                  <p className="text-sm text-gray-600 mb-2">{getInquiryStatusLabel(tCommon, status)}</p>
                  <p className={`text-2xl font-bold ${color}`}>{n(stats[key])}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">{t("noData")}</p>
        </div>
      )}
    </div>
  );
}
