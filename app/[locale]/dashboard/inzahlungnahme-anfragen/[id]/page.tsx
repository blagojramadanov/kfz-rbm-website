"use client";

import { useEffect, useState } from "react";
import { getStatusTone, TONE_PANEL } from "@/lib/status-styles";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTranslations } from "next-intl";
import { AlertCircle, ArrowLeft } from "lucide-react";
import type { TradeInRequest } from "@/lib/supabase";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { PageHeader } from "@/components/page-header";


export default function TradeInRequestDetailPage() {
  const t = useTranslations("dashboard.tradeInRequestDetail");
  const tCommon = useTranslations("common");
  const formatter = useLocaleFormatter();
  const tUnits = useTranslations("wizard.units");
  const router = useRouter();
  const params = useParams();
  const { loading, isAuthenticated, user } = useAuth();
  const [request, setRequest] = useState<TradeInRequest | null>(null);
  const [requestLoading, setRequestLoading] = useState(true);
  const errorMessage = useErrorMessage();
  const [error, setError] = useState("");

  const formatCurrency = (value: number) => {
    return formatter.number(value, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const requestId = params?.id as string;

  const getStatusLabel = (status: string) => t(`status.${status}`) || status;
  const getStatusDescription = (status: string) => t(`statusDescriptions.${status}`) || "";

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const loadRequest = async () => {
      if (!user || !requestId) return;

      try {
        const { getTradeInRequestById } = await import("@/app/actions/trade-in");
        const result = await getTradeInRequestById(requestId);
        if (!result.ok) {
          setError(errorMessage(result));
          return;
        }
        setRequest(result.request);
      } catch (err) {
        console.error("Error loading request:", err);
        setError(errorMessage(err));
      } finally {
        setRequestLoading(false);
      }
    };

    if (isAuthenticated && user && requestId) {
      loadRequest();
    }
  }, [isAuthenticated, user, requestId]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <PageHeader
        title={t("title")}
        description={<>{t("requestId")} {requestId}</>}
        backHref="/dashboard/inzahlungnahme-anfragen"
        backLabel={t("backToList")}
        width="narrow"
      />

      {/* Content */}
      <main className="page-container-narrow">
        {error && (
          <div className="bg-destructive-subtle/50 border border-destructive-border rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive-subtle-foreground">{error}</p>
          </div>
        )}

        {requestLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">{t("loading")}</p>
          </div>
        ) : !request ? (
          <div className="card p-6 sm:p-8 text-center">
            <p className="text-muted-foreground mb-6">{t("notFound")}</p>
            <Link href="/dashboard/inzahlungnahme-anfragen" className="text-primary hover:underline">
              {t("backToOverview")}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Card */}
            <div className={`border border-l-4 rounded-lg p-6 ${TONE_PANEL[getStatusTone("tradeIn", request.status)]}`}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold">{getStatusLabel(request.status)}</h2>
                <span className="text-sm font-medium">
                  {formatter.dateTime(new Date(request.created_at), { year: "numeric", month: "2-digit", day: "2-digit" })}
                </span>
              </div>
              <p className="text-sm">{getStatusDescription(request.status)}</p>
            </div>

            {/* Request Details */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Vehicle */}
              <div className="card p-6">
                <h3 className="card-title mb-4">{t("currentVehicle")}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("brandModel")}</p>
                    <p className="font-semibold text-foreground">
                      {request.current_vehicle_brand} {request.current_vehicle_model}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("firstRegistration")}</p>
                    <p className="font-semibold text-foreground">{request.current_vehicle_year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("mileage")}</p>
                    <p className="font-semibold text-foreground">
                      {tUnits("mileage", { value: formatter.number(request.current_vehicle_mileage || 0) })}
                    </p>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground">{t("estimatedValue")}</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(request.current_vehicle_value_estimate || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Desired Vehicle */}
              {request.desired_vehicle && (
                <div className="card p-6">
                  <h3 className="card-title mb-4">{t("desiredVehicle")}</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("brandModel")}</p>
                      <p className="font-semibold text-foreground">
                        {request.desired_vehicle.brand} {request.desired_vehicle.model}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("year")}</p>
                      <p className="font-semibold text-foreground">{request.desired_vehicle.year}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("mileage")}</p>
                      <p className="font-semibold text-foreground">
                        {tUnits("mileage", { value: formatter.number(request.desired_vehicle.mileage || 0) })}
                      </p>
                    </div>
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground">{t("price")}</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(request.desired_vehicle.price || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Breakdown */}
            {request.desired_vehicle && (
              <div className="bg-info-subtle/50 border-2 border-info-border rounded-lg p-6">
                <h3 className="card-title mb-6">{t("pricingBreakdown")}</h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-foreground">{t("yourVehicleEstimate")}</span>
                    <span className="font-semibold">
                      {formatCurrency(request.current_vehicle_value_estimate || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-foreground">{t("desiredVehiclePrice")}</span>
                    <span className="font-semibold">
                      {formatCurrency(request.desired_vehicle.price || 0)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-4 bg-card rounded p-3">
                    <span className="font-bold text-foreground">{t("difference")}</span>
                    <span
                      className={`text-2xl font-bold ${
                        (request.current_vehicle_value_estimate ?? 0) >
                        (request.desired_vehicle.price ?? 0)
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {((request.current_vehicle_value_estimate ?? 0) -
                        (request.desired_vehicle.price ?? 0) >
                      0
                        ? "+"
                        : "")}
                      {formatCurrency(
                        Math.abs(
                          (request.current_vehicle_value_estimate ?? 0) -
                            (request.desired_vehicle.price ?? 0)
                        )
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-card border border-info-border rounded">
                  <p className="text-sm text-foreground">
                    <strong>{t("importantNote")}</strong> {t("importantNoteText")}
                  </p>
                </div>
              </div>
            )}

            {/* Admin Notes */}
            {request.admin_notes && (
              <div className="bg-highlight-subtle/50 border-2 border-highlight-border rounded-lg p-6">
                <h3 className="card-title mb-2">{t("adminNotes")}</h3>
                <p className="text-foreground">{request.admin_notes}</p>
              </div>
            )}

            {/* Important Notice */}
            <div className="bg-warning-subtle/50 border-l-4 border-warning rounded-lg p-6">
              <h3 className="font-bold text-warning-subtle-foreground mb-2">{t("importantNote")}</h3>
              <p className="text-sm text-warning-subtle-foreground mb-3">{t("importantNoteText")}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between gap-4">
              <Link href="/dashboard/inzahlungnahme-anfragen">
                <button className="min-h-11 inline-flex items-center gap-2 px-6 py-2 border border-input rounded-lg text-foreground hover:bg-muted transition-colors">
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  {t("backToList")}
                </button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
