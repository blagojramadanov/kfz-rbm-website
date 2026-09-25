"use client";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Heart, Search } from "lucide-react";

export default function FavoritesPage() {
  const t = useTranslations("dashboard.favorites");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");
  const params = useParams();
  const locale = params.locale as string || 'de';
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div>
            <Link href="/dashboard" className="text-kfz-blue hover:underline mb-2 inline-block">
              {tNav("dashboard")}
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("title")}
            </h1>
            <p className="text-gray-600 mt-1">
              {t("description")}
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Empty State */}
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 rounded-lg p-6">
              <Heart className="w-12 h-12 text-gray-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t("empty")}
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {t("emptyDescription")}
          </p>
          <Link href="/fahrzeuge">
            <Button className="bg-kfz-blue hover:bg-kfz-blue-dark text-white font-semibold">
              {t("browse")}
              <Search className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Future: Favorites Grid */}
        {/* This will display favorite vehicles in a grid format with:
          - Vehicle image
          - Brand, model, year, price
          - Quick specs (mileage, fuel, transmission)
          - Remove from favorites button
          - View details link
        */}
      </main>
    </div>
  );
}
