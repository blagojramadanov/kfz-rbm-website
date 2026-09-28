"use client";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { AlertCircle, Trash2, ArrowRight } from "lucide-react";
import type { TradeInRequest } from "@/lib/supabase";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { StatusBadge } from "@/components/status-badge";
import { formatPrice } from "@/lib/format-vehicle";
import { PageHeader } from "@/components/page-header";


export default function TradeInRequestsPage() {
  const params = useParams();
  const locale = params.locale as string || 'de';
  const router = useRouter();
  const t = useTranslations("dashboard.tradeInRequests");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");
  const formatter = useLocaleFormatter();
  const tUnits = useTranslations("wizard.units");
  const { loading, isAuthenticated, user } = useAuth();
  const [requests, setRequests] = useState<TradeInRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const errorMessage = useErrorMessage();
  const [error, setError] = useState("");

  // Create STATUS_LABELS dynamically
  const STATUS_LABELS: Record<string, string> = {
    new: t("status.new"),
    reviewing: t("status.reviewing"),
    contact_made: t("status.contact_made"),
    completed: t("status.completed"),
    cancelled: t("status.cancelled"),
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const loadRequests = async () => {
      if (!user) return;

      try {
        const { getTradeInRequests } = await import("@/app/actions/trade-in");
        const result = await getTradeInRequests();
        if (!result.ok) {
          setError(errorMessage(result));
          return;
        }
        setRequests(result.requests);
      } catch (err) {
        console.error("Error loading requests:", err);
        setError(errorMessage(err));
      } finally {
        setRequestsLoading(false);
      }
    };

    if (isAuthenticated && user) {
      loadRequests();
    }
  }, [isAuthenticated, user]);


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
        description={t("description")}
        backHref="/dashboard"
        backLabel={<>← {tNav("dashboard")}</>}
      />

      {/* Content */}
      <main className="page-container">
        {error && (
          <div className="bg-destructive-subtle/50 border border-destructive-border rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive-subtle-foreground">{error}</p>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="section-title">{t("count", { count: requests.length })}</h2>
          <Link href="/dashboard/inzahlungnahme">
            <Button>
              {t("newRequest")}
            </Button>
          </Link>
        </div>

        {requestsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">{t("loading")}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="card p-6 sm:p-8 text-center">
            <p className="text-muted-foreground mb-6">{t("empty")}</p>
            <Link href="/dashboard/inzahlungnahme">
              <Button>
                {t("firstRequest")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="card p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  {/* Left: Request Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="card-title">
                        {request.current_vehicle_year} {request.current_vehicle_brand} {request.current_vehicle_model}
                      </h3>
                      <StatusBadge kind="tradeIn" status={request.status}>{STATUS_LABELS[request.status]}</StatusBadge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Current Vehicle */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>{t("yourVehicle")}</strong>
                        </p>
                        <div className="space-y-1 text-sm">
                          <p className="text-foreground">
                            {tUnits("mileage", { value: formatter.number(request.current_vehicle_mileage || 0) })}
                          </p>
                          <p className="font-semibold text-lg text-primary">
                            {formatPrice(formatter, request.current_vehicle_value_estimate || 0)}
                          </p>
                        </div>
                      </div>

                      {/* Desired Vehicle */}
                      {request.desired_vehicle && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>{t("desiredVehicle")}</strong>
                          </p>
                          <div className="space-y-1 text-sm">
                            <p className="text-foreground">
                              {request.desired_vehicle.year} {request.desired_vehicle.brand}{" "}
                              {request.desired_vehicle.model}
                            </p>
                            <p className="font-semibold text-lg text-primary">
                              {formatPrice(formatter, request.desired_vehicle.price || 0)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Estimated Difference */}
                    {request.desired_vehicle && (
                      <div className="mt-4 p-3 bg-info-subtle/50 border border-info-border rounded">
                        <p className="text-xs text-muted-foreground mb-2">
                          <strong>{t("estimate")}</strong>
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground">{t("difference")}</span>
                          <span
                            className={`font-bold text-lg ${
                              (request.current_vehicle_value_estimate ?? 0) >
                              (request.desired_vehicle.price ?? 0)
                                ? "text-success"
                                : "text-destructive"
                            }`}
                          >
                            {(request.current_vehicle_value_estimate ?? 0) -
                              (request.desired_vehicle.price ?? 0) >
                            0
                              ? "+"
                              : ""}
                            {formatPrice(
                              formatter,
                              Math.abs(
                                (request.current_vehicle_value_estimate ?? 0) -
                                  (request.desired_vehicle.price ?? 0)
                              )
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Die endgültige Fahrzeugbewertung und Zuzahlung wird individuell durch unser Team festgelegt.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2">
                    <Link href={`/dashboard/inzahlungnahme-anfragen/${request.id}`}>
                      <Button className="w-full">
                        Details anzeigen
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>

                    <div className="text-xs text-muted-foreground text-center pt-2">
                      {formatter.dateTime(new Date(request.created_at), { year: "numeric", month: "2-digit", day: "2-digit" })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
