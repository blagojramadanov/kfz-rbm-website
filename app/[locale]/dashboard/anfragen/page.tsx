"use client";
import { useTranslations } from "next-intl";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Calendar, MessageSquare } from "lucide-react";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { getInquiryStatusLabel, getInquiryTypeLabel } from "@/lib/vehicle-labels";
import type { MyInquiry } from "@/app/actions/inquiries";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  read: "bg-yellow-100 text-yellow-800",
  responded: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

export default function InquiriesPage() {
  const t = useTranslations("dashboard.inquiries");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");
  const format = useLocaleFormatter();
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();
  const [inquiries, setInquiries] = useState<MyInquiry[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    (async () => {
      try {
        const { getMyInquiries } = await import("@/app/actions/inquiries");
        const result = await getMyInquiries();
        if (!result.ok) {
          setError(errorMessage(result));
          setInquiries([]);
          return;
        }
        setInquiries(result.inquiries);
      } catch (err) {
        setError(errorMessage(err));
        setInquiries([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuthenticated]);

  if (loading || !isAuthenticated || inquiries === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  const numericDate = { year: "numeric", month: "2-digit", day: "2-digit" } as const;
  // preferred_date is a calendar date (YYYY-MM-DD); format it in UTC so it never shifts a day.
  const formatDay = (value: string) => format.dateTime(new Date(`${value}T00:00:00Z`), { ...numericDate, timeZone: "UTC" });

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {inquiries.length === 0 && !error ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gray-100 rounded-lg p-6">
                <MessageSquare className="w-12 h-12 text-gray-400" />
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
                {t("browseVehicles")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        ) : (
          inquiries.map((inquiry) => (
            <div key={inquiry.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex gap-2 flex-wrap items-center mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {getInquiryTypeLabel(tCommon, inquiry.inquiry_type)}
                    </span>
                    {inquiry.vehicle_label &&
                      (inquiry.vehicle_slug ? (
                        <Link
                          href={`/fahrzeuge/${inquiry.vehicle_slug}`}
                          className="font-semibold text-gray-900 hover:text-kfz-blue"
                        >
                          {inquiry.vehicle_label}
                        </Link>
                      ) : (
                        <span className="font-semibold text-gray-700">
                          {t("vehicleNotListed", { vehicle: inquiry.vehicle_label })}
                        </span>
                      ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    {t("sentAt", { date: format.dateTime(new Date(inquiry.created_at), numericDate) })}
                  </p>
                  {inquiry.preferred_date && (
                    <p className="text-sm text-gray-700 flex items-center gap-1 mt-1">
                      <Calendar className="w-4 h-4" />
                      {t("preferredDate", { date: formatDay(inquiry.preferred_date) })}
                    </p>
                  )}
                </div>
                <span
                  className={`self-start px-3 py-1 rounded-full text-sm font-medium flex-shrink-0 ${
                    STATUS_COLORS[inquiry.status] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {getInquiryStatusLabel(tCommon, inquiry.status)}
                </span>
              </div>
              {inquiry.message && (
                <p className="text-sm text-gray-700 whitespace-pre-line break-words bg-gray-50 rounded-lg p-4">
                  {inquiry.message}
                </p>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
