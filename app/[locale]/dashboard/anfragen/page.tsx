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
import { StatusBadge } from "@/components/status-badge";
import type { MyInquiry } from "@/app/actions/inquiries";
import { PageHeader } from "@/components/page-header";


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
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  const numericDate = { year: "numeric", month: "2-digit", day: "2-digit" } as const;
  // preferred_date is a calendar date (YYYY-MM-DD); format it in UTC so it never shifts a day.
  const formatDay = (value: string) => format.dateTime(new Date(`${value}T00:00:00Z`), { ...numericDate, timeZone: "UTC" });

  return (
    <div className="min-h-screen bg-muted">
      <PageHeader
        title={t("title")}
        description={t("description")}
        backHref="/dashboard"
        backLabel={tNav("dashboard")}
      />

      <main className="page-container space-y-4">
        {error && (
          <div className="bg-destructive-subtle/50 border border-destructive-border rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive-subtle-foreground">{error}</p>
          </div>
        )}

        {inquiries.length === 0 && !error ? (
          <div className="card p-8 sm:p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-secondary rounded-lg p-6">
                <MessageSquare className="w-12 h-12 text-muted-foreground/70" />
              </div>
            </div>
            <h2 className="section-title mb-2">
              {t("empty")}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t("emptyDescription")}
            </p>
            <Link href="/fahrzeuge">
              <Button>
                {t("browseVehicles")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        ) : (
          inquiries.map((inquiry) => (
            <div key={inquiry.id} className="card p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex gap-2 flex-wrap items-center mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-highlight-subtle text-highlight-subtle-foreground">
                      {getInquiryTypeLabel(tCommon, inquiry.inquiry_type)}
                    </span>
                    {inquiry.vehicle_label &&
                      (inquiry.vehicle_slug ? (
                        <Link
                          href={`/fahrzeuge/${inquiry.vehicle_slug}`}
                          className="font-semibold text-foreground hover:text-primary"
                        >
                          {inquiry.vehicle_label}
                        </Link>
                      ) : (
                        <span className="font-semibold text-foreground">
                          {t("vehicleNotListed", { vehicle: inquiry.vehicle_label })}
                        </span>
                      ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("sentAt", { date: format.dateTime(new Date(inquiry.created_at), numericDate) })}
                  </p>
                  {inquiry.preferred_date && (
                    <p className="text-sm text-foreground flex items-center gap-1 mt-1">
                      <Calendar className="w-4 h-4" />
                      {t("preferredDate", { date: formatDay(inquiry.preferred_date) })}
                    </p>
                  )}
                </div>
                <StatusBadge kind="inquiry" status={inquiry.status} className="self-start">{getInquiryStatusLabel(tCommon, inquiry.status)}</StatusBadge>
              </div>
              {inquiry.message && (
                <p className="text-sm text-foreground whitespace-pre-line break-words bg-muted rounded-lg p-4">
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
