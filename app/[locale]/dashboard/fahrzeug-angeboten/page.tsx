"use client";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function SuccessPage() {
  const params = useParams();
  const locale = params.locale as string || 'de';
  const t = useTranslations("wizard");
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-success-subtle/50 to-info-subtle/50 flex items-center justify-center px-4">
      <div className="max-w-md w-full card p-6 sm:p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-success-subtle rounded-full p-4">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
        </div>

        <h1 className="page-title text-foreground mb-2">
          {t("success.title")}
        </h1>

        <p className="text-lg text-muted-foreground mb-2">
          {t("success.message")}
        </p>

        <p className="text-muted-foreground mb-8">
          {t("success.description")}
        </p>

        <div className="space-y-3">
          <Link href="/dashboard/fahrzeuge" className="block w-full">
            <Button className="w-full">
              {t("success.viewVehicles")}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>

          <Link href="/dashboard" className="block w-full">
            <Button variant="outline-primary" className="w-full">
              {t("success.backToDashboard")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
