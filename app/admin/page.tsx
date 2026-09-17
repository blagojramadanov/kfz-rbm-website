"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Car, Users, MessageSquare, Repeat2, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  total_vehicles: number;
  vehicles_draft: number;
  vehicles_available: number;
  vehicles_reserved: number;
  vehicles_sold: number;
  total_submitted_vehicles: number;
  submitted_vehicles_submitted: number;
  submitted_vehicles_under_review: number;
  submitted_vehicles_approved: number;
  submitted_vehicles_rejected: number;
  inquiries_new: number;
  trade_in_requests_new: number;
  total_customers: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { loading, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
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
        const { getDashboardStats } = await import("@/app/actions/admin");
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Error loading stats:", err);
        setError("Fehler beim Laden der Statistiken");
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
          <p className="text-gray-600">Wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Übersicht über Fahrzeuge, Kunden und Anfragen</p>
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
            <Link href="/admin/fahrzeuge">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <Car className="w-10 h-10 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Fahrzeuge</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total_vehicles}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.vehicles_available} verfügbar
                </p>
              </div>
            </Link>

            {/* Submitted Vehicles */}
            <Link href="/admin/fahrzeuge/eingereicht">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-10 h-10 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-600">Eingereicht</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total_submitted_vehicles}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.submitted_vehicles_under_review} zur Überprüfung
                </p>
              </div>
            </Link>

            {/* Inquiries */}
            <Link href="/admin/anfragen">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="w-10 h-10 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Anfragen</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.inquiries_new}</p>
                <p className="text-xs text-gray-500 mt-1">Neue Anfragen</p>
              </div>
            </Link>

            {/* Trade-In Requests */}
            <Link href="/admin/inzahlungnahmen">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <Repeat2 className="w-10 h-10 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Inzahlungnahmen</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.trade_in_requests_new}</p>
                <p className="text-xs text-gray-500 mt-1">Neue Anfragen</p>
              </div>
            </Link>

            {/* Customers */}
            <Link href="/admin/kunden">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-10 h-10 text-red-600" />
                  <span className="text-sm font-medium text-gray-600">Kunden</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.total_customers}</p>
                <p className="text-xs text-gray-500 mt-1">Registriert</p>
              </div>
            </Link>
          </div>

          {/* Vehicle Status Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Inventory Vehicles */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Bestand-Fahrzeuge</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Verfügbar</span>
                  <span className="text-2xl font-bold text-green-600">{stats.vehicles_available}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Reserviert</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.vehicles_reserved}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Entwurf</span>
                  <span className="text-2xl font-bold text-gray-600">{stats.vehicles_draft}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Verkauft</span>
                  <span className="text-2xl font-bold text-red-600">{stats.vehicles_sold}</span>
                </div>
              </div>
              <Link href="/admin/fahrzeuge" className="mt-4 inline-block text-kfz-blue hover:underline text-sm font-medium">
                Fahrzeuge verwalten →
              </Link>
            </div>

            {/* Submitted Vehicles */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Eingereichte Fahrzeuge</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Zur Überprüfung</span>
                  <span className="text-2xl font-bold text-yellow-600">
                    {stats.submitted_vehicles_under_review}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Genehmigt</span>
                  <span className="text-2xl font-bold text-green-600">
                    {stats.submitted_vehicles_approved}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Eingereicht</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {stats.submitted_vehicles_submitted}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Abgelehnt</span>
                  <span className="text-2xl font-bold text-red-600">
                    {stats.submitted_vehicles_rejected}
                  </span>
                </div>
              </div>
              <Link href="/admin/fahrzeuge/eingereicht" className="mt-4 inline-block text-kfz-blue hover:underline text-sm font-medium">
                Eingereichte verwalten →
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Schnellzugriffe</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <Link href="/admin/fahrzeuge/neu">
                <button className="w-full px-4 py-3 bg-kfz-blue text-white rounded-lg hover:bg-kfz-blue-dark transition-colors font-medium">
                  + Fahrzeug erstellen
                </button>
              </Link>
              <Link href="/admin/fahrzeuge/eingereicht">
                <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  Zur Überprüfung ({stats.submitted_vehicles_under_review})
                </button>
              </Link>
              <Link href="/admin/anfragen">
                <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  Anfragen ({stats.inquiries_new})
                </button>
              </Link>
              <Link href="/admin/inzahlungnahmen">
                <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  Inzahlungnahmen ({stats.trade_in_requests_new})
                </button>
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
