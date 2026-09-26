"use client";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { Car, Users, MessageSquare, Repeat2, TrendingUp, AlertCircle } from "lucide-react";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { getSubmissionStatusLabel, getVehicleStatusLabel } from "@/lib/vehicle-labels";

interface DashboardStats {
  total_vehicles: number;
  vehicles_draft: number;
  vehicles_available: number;
  vehicles_reserved: number;
  vehicles_sold: number;
  total_submitted_vehicles: number;
  submitted_vehicles_eingereicht: number;
  submitted_vehicles_in_bearbeitung: number;
  submitted_vehicles_angebot_gesendet: number;
  submitted_vehicles_abgelehnt: number;
  inquiries_new: number;
  trade_in_requests_new: number;
  total_customers: number;
}

// [DB status, stats field, colour] for the two breakdown cards.
const INVENTORY_ROWS: [string, keyof DashboardStats, string][] = [
  ["available", "vehicles_available", "text-green-600"],
  ["reserved", "vehicles_reserved", "text-blue-600"],
  ["draft", "vehicles_draft", "text-gray-600"],
  ["sold", "vehicles_sold", "text-red-600"],
];
const SUBMISSION_ROWS: [string, keyof DashboardStats, string][] = [
  ["eingereicht", "submitted_vehicles_eingereicht", "text-blue-600"],
  ["in_bearbeitung", "submitted_vehicles_in_bearbeitung", "text-yellow-600"],
  ["angebot_gesendet", "submitted_vehicles_angebot_gesendet", "text-green-600"],
  ["abgelehnt", "submitted_vehicles_abgelehnt", "text-red-600"],
];

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  const t = useTranslations();
  const tCommon = useTranslations("common");
  const format = useLocaleFormatter();
  const n = (value: number | undefined) => format.number(value || 0);
  const router = useRouter();
  const { loading, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const errorMessage = useErrorMessage();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { getDashboardStats } = await import("@/app/actions/admin");
        const result = await getDashboardStats();
        if (!result.ok) {
          setError(errorMessage(result));
          return;
        }
        setStats(result.stats);
      } catch (err) {
        console.error("Error loading stats:", err);
        setError(errorMessage(err));
      } finally {
        setStatsLoading(false);
      }
    };

    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{t("admin.title")}</h1>
        <p className="text-gray-600">{t("admin.overview")}</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto"></div>
        </div>
      ) : stats ? (
        <>
          {/* Quick Stats */}
          <div className="grid md:grid-cols-5 gap-4">
            {/* Total Vehicles */}
            <Link href={`/admin/fahrzeuge`}>
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <Car className="w-10 h-10 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">{t("admin.vehicles")}</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{n(stats.total_vehicles)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("admin.dashboard.availableCount", { count: n(stats.vehicles_available) })}
                </p>
              </div>
            </Link>

            {/* Submitted Vehicles */}
            <Link href="/admin/fahrzeuge/eingereicht">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-10 h-10 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-600">{t("admin.sidebar.submittedVehicles")}</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{n(stats.total_submitted_vehicles)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("admin.dashboard.submittedCount", { count: n(stats.submitted_vehicles_eingereicht) })}
                </p>
              </div>
            </Link>

            {/* Inquiries */}
            <Link href="/admin/anfragen">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="w-10 h-10 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">{t("admin.sidebar.inquiries")}</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{n(stats.inquiries_new)}</p>
                <p className="text-xs text-gray-500 mt-1">{t("admin.dashboard.newRequests")}</p>
              </div>
            </Link>

            {/* Trade-In Requests */}
            <Link href="/admin/inzahlungnahmen">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <Repeat2 className="w-10 h-10 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">{t("admin.sidebar.tradeIns")}</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{n(stats.trade_in_requests_new)}</p>
                <p className="text-xs text-gray-500 mt-1">{t("admin.dashboard.newRequests")}</p>
              </div>
            </Link>

            {/* Customers */}
            <Link href="/admin/kunden">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-10 h-10 text-red-600" />
                  <span className="text-sm font-medium text-gray-600">{t("admin.sidebar.customers")}</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{n(stats.total_customers)}</p>
                <p className="text-xs text-gray-500 mt-1">{t("admin.dashboard.registered")}</p>
              </div>
            </Link>
          </div>

          {/* Vehicle Status Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Inventory Vehicles */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t("admin.dashboard.inventoryTitle")}</h3>
              <div className="space-y-3">
                {INVENTORY_ROWS.map(([status, key, color]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-gray-700">{getVehicleStatusLabel(tCommon, status)}</span>
                    <span className={`text-2xl font-bold ${color}`}>{n(stats[key])}</span>
                  </div>
                ))}
              </div>
              <Link href="/admin/fahrzeuge" className="mt-4 inline-block text-kfz-blue hover:underline text-sm font-medium">
                {t("adminDashboard.manageVehicles")} →
              </Link>
            </div>

            {/* Submitted Vehicles */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t("admin.sidebar.submittedVehicles")}</h3>
              <div className="space-y-3">
                {SUBMISSION_ROWS.map(([status, key, color]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-gray-700">{getSubmissionStatusLabel(tCommon, status)}</span>
                    <span className={`text-2xl font-bold ${color}`}>{n(stats[key])}</span>
                  </div>
                ))}
              </div>
              <Link href="/admin/fahrzeuge/eingereicht" className="mt-4 inline-block text-kfz-blue hover:underline text-sm font-medium">
                {t("admin.dashboard.manageSubmissions")} →
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t("admin.dashboard.quickActions")}</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <Link href="/admin/fahrzeuge/neu">
                <button className="w-full px-4 py-3 bg-kfz-blue text-white rounded-lg hover:bg-kfz-blue-dark transition-colors font-medium">
                  + {t("admin.dashboard.createVehicle")}
                </button>
              </Link>
              <Link href="/admin/fahrzeuge/eingereicht">
                <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  {t("admin.dashboard.withCount", {
                    label: t("admin.sidebar.submittedVehicles"),
                    count: n(stats.submitted_vehicles_eingereicht),
                  })}
                </button>
              </Link>
              <Link href="/admin/anfragen">
                <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  {t("admin.dashboard.withCount", { label: t("admin.sidebar.inquiries"), count: n(stats.inquiries_new) })}
                </button>
              </Link>
              <Link href="/admin/inzahlungnahmen">
                <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  {t("admin.dashboard.withCount", {
                    label: t("admin.sidebar.tradeIns"),
                    count: n(stats.trade_in_requests_new),
                  })}
                </button>
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
