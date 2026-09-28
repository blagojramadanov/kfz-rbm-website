"use client";

import { useEffect, useState } from "react";
import { getStatusTone, TONE_TEXT } from "@/lib/status-styles";
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
  submitted_vehicles_akzeptiert: number;
  submitted_vehicles_abgelehnt: number;
  inquiries_new: number;
  trade_in_requests_new: number;
  total_customers: number;
}

// [DB status, stats field] for the two breakdown cards; colors come from lib/status-styles.
const INVENTORY_ROWS: [string, keyof DashboardStats][] = [
  ["available", "vehicles_available"],
  ["reserved", "vehicles_reserved"],
  ["draft", "vehicles_draft"],
  ["sold", "vehicles_sold"],
];
const SUBMISSION_ROWS: [string, keyof DashboardStats][] = [
  ["eingereicht", "submitted_vehicles_eingereicht"],
  ["in_bearbeitung", "submitted_vehicles_in_bearbeitung"],
  ["angebot_gesendet", "submitted_vehicles_angebot_gesendet"],
  ["akzeptiert", "submitted_vehicles_akzeptiert"],
  ["abgelehnt", "submitted_vehicles_abgelehnt"],
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title text-foreground mb-2">{t("admin.title")}</h1>
        <p className="text-muted-foreground">{t("admin.overview")}</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive-subtle/50 border border-destructive-border rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive-subtle-foreground">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : stats ? (
        <>
          {/* Quick Stats */}
          <div className="grid md:grid-cols-5 gap-4">
            {/* Total Vehicles */}
            <Link href={`/admin/fahrzeuge`}>
              <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <Car className="w-10 h-10 text-info" />
                  <span className="text-sm font-medium text-muted-foreground">{t("admin.vehicles")}</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{n(stats.total_vehicles)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("admin.dashboard.availableCount", { count: n(stats.vehicles_available) })}
                </p>
              </div>
            </Link>

            {/* Submitted Vehicles */}
            <Link href="/admin/fahrzeuge/eingereicht">
              <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-10 h-10 text-warning" />
                  <span className="text-sm font-medium text-muted-foreground">{t("admin.sidebar.submittedVehicles")}</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{n(stats.total_submitted_vehicles)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("admin.dashboard.submittedCount", { count: n(stats.submitted_vehicles_eingereicht) })}
                </p>
              </div>
            </Link>

            {/* Inquiries */}
            <Link href="/admin/anfragen">
              <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="w-10 h-10 text-success" />
                  <span className="text-sm font-medium text-muted-foreground">{t("admin.sidebar.inquiries")}</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{n(stats.inquiries_new)}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("admin.dashboard.newRequests")}</p>
              </div>
            </Link>

            {/* Trade-In Requests */}
            <Link href="/admin/inzahlungnahmen">
              <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <Repeat2 className="w-10 h-10 text-highlight" />
                  <span className="text-sm font-medium text-muted-foreground">{t("admin.sidebar.tradeIns")}</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{n(stats.trade_in_requests_new)}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("admin.dashboard.newRequests")}</p>
              </div>
            </Link>

            {/* Customers */}
            <Link href="/admin/kunden">
              <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-10 h-10 text-destructive" />
                  <span className="text-sm font-medium text-muted-foreground">{t("admin.sidebar.customers")}</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{n(stats.total_customers)}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("admin.dashboard.registered")}</p>
              </div>
            </Link>
          </div>

          {/* Vehicle Status Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Inventory Vehicles */}
            <div className="card p-6">
              <h3 className="card-title mb-4">{t("admin.dashboard.inventoryTitle")}</h3>
              <div className="space-y-3">
                {INVENTORY_ROWS.map(([status, key]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-foreground">{getVehicleStatusLabel(tCommon, status)}</span>
                    <span className={`text-2xl font-bold ${TONE_TEXT[getStatusTone("vehicle", status)]}`}>{n(stats[key])}</span>
                  </div>
                ))}
              </div>
              <Link href="/admin/fahrzeuge" className="mt-4 inline-block text-primary hover:underline text-sm font-medium">
                {t("adminDashboard.manageVehicles")} →
              </Link>
            </div>

            {/* Submitted Vehicles */}
            <div className="card p-6">
              <h3 className="card-title mb-4">{t("admin.sidebar.submittedVehicles")}</h3>
              <div className="space-y-3">
                {SUBMISSION_ROWS.map(([status, key]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-foreground">{getSubmissionStatusLabel(tCommon, status)}</span>
                    <span className={`text-2xl font-bold ${TONE_TEXT[getStatusTone("submission", status)]}`}>{n(stats[key])}</span>
                  </div>
                ))}
              </div>
              <Link href="/admin/fahrzeuge/eingereicht" className="mt-4 inline-block text-primary hover:underline text-sm font-medium">
                {t("admin.dashboard.manageSubmissions")} →
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="card-title mb-4">{t("admin.dashboard.quickActions")}</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <Link href="/admin/fahrzeuge/neu">
                <button className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors font-medium">
                  + {t("admin.dashboard.createVehicle")}
                </button>
              </Link>
              <Link href="/admin/fahrzeuge/eingereicht">
                <button className="w-full px-4 py-3 border border-input text-foreground rounded-lg hover:bg-muted transition-colors font-medium">
                  {t("admin.dashboard.withCount", {
                    label: t("admin.sidebar.submittedVehicles"),
                    count: n(stats.submitted_vehicles_eingereicht),
                  })}
                </button>
              </Link>
              <Link href="/admin/anfragen">
                <button className="w-full px-4 py-3 border border-input text-foreground rounded-lg hover:bg-muted transition-colors font-medium">
                  {t("admin.dashboard.withCount", { label: t("admin.sidebar.inquiries"), count: n(stats.inquiries_new) })}
                </button>
              </Link>
              <Link href="/admin/inzahlungnahmen">
                <button className="w-full px-4 py-3 border border-input text-foreground rounded-lg hover:bg-muted transition-colors font-medium">
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
