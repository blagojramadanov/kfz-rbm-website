"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Car, MessageSquare, Heart, Plus, FileText, LogOut, ArrowRight, Repeat2 } from "lucide-react";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const formatter = useLocaleFormatter();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'de';
  const { profile, loading, isAuthenticated, isAdmin, signOut } = useAuth();
  // undefined = loading, null = load failed
  const [vehicleCount, setVehicleCount] = useState<number | null | undefined>(undefined);
  const [inquiryCount, setInquiryCount] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    if (!loading) {
      // Redirect to admin panel if user is admin
      if (isAdmin) {
        router.push("/admin");
      }
      // Redirect to login if not authenticated
      if (!isAuthenticated) {
        router.push("/login");
      }
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (loading || !isAuthenticated || isAdmin) return;
    (async () => {
      const [{ countSubmittedVehicles }, { countMyInquiries }] = await Promise.all([
        import("@/app/actions/vehicles"),
        import("@/app/actions/inquiries"),
      ]);
      const [vehicles, inquiries] = await Promise.all([countSubmittedVehicles(), countMyInquiries()]);
      setVehicleCount(vehicles.ok ? vehicles.count : null);
      setInquiryCount(inquiries.ok ? inquiries.count : null);
    })();
  }, [loading, isAuthenticated, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-kfz-blue to-kfz-blue-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-2">
            {tCommon("welcome")}, {profile.full_name}!
          </h1>
          <p className="text-blue-100 text-lg">
            {t("welcome")}
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Link href={`/dashboard/fahrzeuge`}>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t("myVehicles")}</p>
                  <p className="text-3xl font-bold text-gray-900">{vehicleCount === undefined ? "…" : vehicleCount === null ? "—" : formatter.number(vehicleCount)}</p>
                </div>
                <Car className="w-10 h-10 text-kfz-blue" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/anfragen">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t("overview.inquiries")}</p>
                  <p className="text-3xl font-bold text-gray-900">{inquiryCount === undefined ? "…" : inquiryCount === null ? "—" : formatter.number(inquiryCount)}</p>
                </div>
                <MessageSquare className="w-10 h-10 text-green-600" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/favoriten">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t("overview.favorites")}</p>
                  {/* favorites are not stored yet (no table); /dashboard/favoriten lists none */}
                  <p className="text-3xl font-bold text-gray-900">{formatter.number(0)}</p>
                </div>
                <Heart className="w-10 h-10 text-red-600" />
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t("memberSince")}</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatter.dateTime(new Date(profile.created_at), { year: "numeric", month: "2-digit", day: "2-digit" })}
                </p>
              </div>
              <FileText className="w-10 h-10 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Submit Vehicle */}
          <Link href="/dashboard/fahrzeug-anbieten">
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <Plus className="w-6 h-6 text-kfz-blue" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("overview.submitVehicle")}
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                {t("overview.submitDescription")}
              </p>
              <Button className="bg-kfz-blue hover:bg-kfz-blue-dark text-white font-semibold w-full">
                <Plus className="mr-2 w-4 h-4" />
                {t("overview.addVehicle")}
              </Button>
            </div>
          </Link>

          {/* My Vehicles */}
          <Link href="/dashboard/fahrzeuge">
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <Car className="w-6 h-6 text-kfz-blue" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("overview.manageVehicles")}
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                {t("overview.manageVehiclesDescription")}
              </p>
              <Button variant="outline" className="border-kfz-blue text-kfz-blue hover:bg-kfz-blue hover:text-white w-full">
                {t("overview.viewVehicles")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>

          {/* Inquiries */}
          <Link href="/dashboard/anfragen">
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-green-100 rounded-lg p-3">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("overview.inquiries")}
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                {t("overview.inquiriesDescription")}
              </p>
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white w-full">
                {t("overview.viewInquiries")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>

          {/* Favorites */}
          <Link href="/dashboard/favoriten">
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-red-100 rounded-lg p-3">
                  <Heart className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("overview.favorites")}
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                {t("overview.favoritesDescription")}
              </p>
              <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white w-full">
                {t("overview.viewFavorites")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>

          {/* Trade-In */}
          <Link href="/dashboard/inzahlungnahme">
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-purple-100 rounded-lg p-3">
                  <Repeat2 className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("overview.tradeIn")}
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                {t("overview.tradeInDescription")}
              </p>
              <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white w-full">
                {t("overview.newRequest")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>

          {/* Trade-In Requests */}
          <Link href="/dashboard/inzahlungnahme-anfragen">
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-indigo-100 rounded-lg p-3">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("overview.myTradeInRequests")}
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                {t("overview.myTradeInRequestsDescription")}
              </p>
              <Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white w-full">
                {t("overview.viewRequests")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>
        </div>

        {/* Profile & Logout */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/dashboard/profil">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t("overview.manageProfile")}</h3>
              <p className="text-gray-600 mb-4">
                {t("overview.manageProfileDescription")}
              </p>
              <Button className="w-full bg-kfz-blue hover:bg-kfz-blue-dark text-white">
                {t("overview.toProfile")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t("overview.accountActions")}</h3>
            <p className="text-gray-600 mb-4">
              {t("overview.accountActionsDescription")}
            </p>
            <Button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              <LogOut className="mr-2 w-4 h-4" />
              {t("overview.logout")}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
