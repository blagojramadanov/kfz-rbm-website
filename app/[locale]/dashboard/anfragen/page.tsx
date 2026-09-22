"use client";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function InquiriesPage() {
  const t = useTranslations();
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div>
            <Link href="/dashboard" className="text-kfz-blue hover:underline mb-2 inline-block">
              Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Anfragen
            </h1>
            <p className="text-gray-600 mt-1">
              Anfragen von Interessenten zu Ihren Fahrzeugen
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Empty State */}
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 rounded-lg p-6">
              <MessageSquare className="w-12 h-12 text-gray-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Noch keine Anfragen
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Sie haben noch keine Anfragen erhalten. Sobald Interessenten Ihre Fahrzeuge entdecken, werden ihre Anfragen hier angezeigt.
          </p>
          <Link href="/dashboard/fahrzeug-anbieten">
            <Button className="bg-kfz-blue hover:bg-kfz-blue-dark text-white font-semibold">
              Fahrzeug anbieten
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Future: Inquiries List */}
        {/* This will display inquiries with:
          - Customer name, email, phone
          - Message preview
          - Inquiry type (test_drive, general, part_exchange)
          - Status (new, read, responded, closed)
          - Reply button
        */}
      </main>
    </div>
  );
}
