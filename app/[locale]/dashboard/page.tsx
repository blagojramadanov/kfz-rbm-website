"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { useFavorites } from "@/lib/favorites-context";
import { Button } from "@/components/ui/button";
import { Car, MessageSquare, Heart, Plus, FileText, LogOut, ArrowRight, Repeat2 } from "lucide-react";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const formatter = useLocaleFormatter();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'de';
  const { profile, loading, isAuthenticated, isAdmin, signOut } = useAuth();
  const favorites = useFavorites();
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
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{tCommon("loading")}</p>
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
    <div className="min-h-screen bg-muted">
      <PageHeader
        title={<>{tCommon("welcome")}, {profile.full_name}!</>}
        description={t("welcome")}
      />

      <main className="page-container">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Link href={`/dashboard/fahrzeuge`}>
            <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("myVehicles")}</p>
                  <p className="text-3xl font-bold text-foreground">{vehicleCount === undefined ? "…" : vehicleCount === null ? "—" : formatter.number(vehicleCount)}</p>
                </div>
                <Car className="w-10 h-10 text-primary" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/anfragen">
            <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("overview.inquiries")}</p>
                  <p className="text-3xl font-bold text-foreground">{inquiryCount === undefined ? "…" : inquiryCount === null ? "—" : formatter.number(inquiryCount)}</p>
                </div>
                <MessageSquare className="w-10 h-10 text-success" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/favoriten">
            <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("overview.favorites")}</p>
                  <p className="text-3xl font-bold text-foreground">{favorites.ready ? formatter.number(favorites.count) : "…"}</p>
                </div>
                <Heart className="w-10 h-10 text-destructive" />
              </div>
            </div>
          </Link>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("memberSince")}</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatter.dateTime(new Date(profile.created_at), { year: "numeric", month: "2-digit", day: "2-digit" })}
                </p>
              </div>
              <FileText className="w-10 h-10 text-warning" />
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Submit Vehicle */}
          <Link href="/dashboard/fahrzeug-anbieten">
            <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-info-subtle rounded-lg p-3">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <h2 className="section-title">
                  {t("overview.submitVehicle")}
                </h2>
              </div>
              <p className="text-muted-foreground mb-6">
                {t("overview.submitDescription")}
              </p>
              <Button className="w-full">
                <Plus className="mr-2 w-4 h-4" />
                {t("overview.addVehicle")}
              </Button>
            </div>
          </Link>

          {/* My Vehicles */}
          <Link href="/dashboard/fahrzeuge">
            <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-info-subtle rounded-lg p-3">
                  <Car className="w-6 h-6 text-primary" />
                </div>
                <h2 className="section-title">
                  {t("overview.manageVehicles")}
                </h2>
              </div>
              <p className="text-muted-foreground mb-6">
                {t("overview.manageVehiclesDescription")}
              </p>
              <Button variant="outline-primary" className="w-full">
                {t("overview.viewVehicles")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>

          {/* Inquiries */}
          <Link href="/dashboard/anfragen">
            <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-success-subtle rounded-lg p-3">
                  <MessageSquare className="w-6 h-6 text-success" />
                </div>
                <h2 className="section-title">
                  {t("overview.inquiries")}
                </h2>
              </div>
              <p className="text-muted-foreground mb-6">
                {t("overview.inquiriesDescription")}
              </p>
              <Button variant="outline-primary" className="w-full">
                {t("overview.viewInquiries")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>

          {/* Favorites */}
          <Link href="/dashboard/favoriten">
            <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-destructive-subtle rounded-lg p-3">
                  <Heart className="w-6 h-6 text-destructive" />
                </div>
                <h2 className="section-title">
                  {t("overview.favorites")}
                </h2>
              </div>
              <p className="text-muted-foreground mb-6">
                {t("overview.favoritesDescription")}
              </p>
              <Button variant="outline-primary" className="w-full">
                {t("overview.viewFavorites")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>

          {/* Trade-In */}
          <Link href="/dashboard/inzahlungnahme">
            <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-highlight-subtle rounded-lg p-3">
                  <Repeat2 className="w-6 h-6 text-highlight" />
                </div>
                <h2 className="section-title">
                  {t("overview.tradeIn")}
                </h2>
              </div>
              <p className="text-muted-foreground mb-6">
                {t("overview.tradeInDescription")}
              </p>
              <Button variant="outline-primary" className="w-full">
                {t("overview.newRequest")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>

          {/* Trade-In Requests */}
          <Link href="/dashboard/inzahlungnahme-anfragen">
            <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-info-subtle rounded-lg p-3">
                  <FileText className="w-6 h-6 text-info" />
                </div>
                <h2 className="section-title">
                  {t("overview.myTradeInRequests")}
                </h2>
              </div>
              <p className="text-muted-foreground mb-6">
                {t("overview.myTradeInRequestsDescription")}
              </p>
              <Button variant="outline-primary" className="w-full">
                {t("overview.viewRequests")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>
        </div>

        {/* Profile & Logout */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/dashboard/profil">
            <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="card-title mb-4">{t("overview.manageProfile")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("overview.manageProfileDescription")}
              </p>
              <Button className="w-full">
                {t("overview.toProfile")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>

          <div className="card p-6">
            <h3 className="card-title mb-4">{t("overview.accountActions")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("overview.accountActionsDescription")}
            </p>
            <Button variant="destructive"
              onClick={handleLogout}
              className="w-full"
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
