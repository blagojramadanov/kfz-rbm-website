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
          <p className="text-gray-600">Wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Vielen Dank!
        </h1>

        <p className="text-lg text-gray-600 mb-2">
          Ihr Fahrzeug wurde erfolgreich gesendet.
        </p>

        <p className="text-gray-600 mb-8">
          Wir melden uns in Kürze bei Ihnen mit weiteren Informationen.
        </p>

        <div className="space-y-3">
          <Link href="/dashboard/fahrzeuge" className="block w-full">
            <Button className="w-full bg-kfz-blue hover:bg-kfz-blue-dark text-white font-semibold">
              Meine Fahrzeuge anschauen
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>

          <Link href="/dashboard" className="block w-full">
            <Button variant="outline" className="w-full border-kfz-blue text-kfz-blue hover:bg-kfz-blue hover:text-white">
              Zum Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
