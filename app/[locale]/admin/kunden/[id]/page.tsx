"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { StatusBadge } from "@/components/status-badge";
import { getInquiryStatusLabel, getInquiryTypeLabel, getSubmissionStatusLabel, getTradeInStatusLabel } from "@/lib/vehicle-labels";

export const dynamic = "force-dynamic";

// Keyed by submitted_vehicles.status (DB values).

export default function AdminCustomerDetailPage() {
  const t = useTranslations("admin.customerDetail");
  const tAdmin = useTranslations("admin");
  const tCommon = useTranslations("common");
  const format = useLocaleFormatter();
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;
  const { loading, isAdmin } = useAuth();
  const [customer, setCustomer] = useState<any>(null);
  const [customerLoading, setCustomerLoading] = useState(true);
  const errorMessage = useErrorMessage();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    const loadCustomer = async () => {
      if (!customerId) return;
      try {
        setCustomerLoading(true);
        const { getCustomerDetails } = await import("@/app/actions/admin");
        const result = await getCustomerDetails(customerId);
        if (!result.ok) {
          setError(errorMessage(result));
          return;
        }
        setCustomer({
          ...result.customer,
          submitted_vehicles: result.vehicles,
          inquiries: result.inquiries,
          trade_in_requests: result.tradeIns,
        });
        setError("");
      } catch (err) {
        console.error("Error loading customer:", err);
        setError(errorMessage(err));
      } finally {
        setCustomerLoading(false);
      }
    };

    if (isAdmin && customerId) loadCustomer();
  }, [customerId, isAdmin]);

  if (loading || !isAdmin || customerLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  const backLink = (
    <Link href="/admin/kunden" className="inline-flex items-center gap-2 text-primary hover:text-primary-hover font-medium">
      <ArrowLeft className="w-4 h-4" />
      {t("backToList")}
    </Link>
  );

  if (!customer) {
    return (
      <div className="space-y-6">
        {backLink}
        <div className="bg-destructive-subtle/50 border border-destructive-border rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive-subtle-foreground">{error || t("notFound")}</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) =>
    format.dateTime(new Date(date), { year: "numeric", month: "2-digit", day: "2-digit" });
  const cityPostal = [customer.postal_code, customer.city].filter(Boolean).join(" ");

  return (
    <div className="space-y-6">
      {backLink}

      {error && (
        <div className="bg-destructive-subtle/50 border border-destructive-border rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive-subtle-foreground">{error}</p>
        </div>
      )}

      <div className="card p-6">
        <h1 className="page-title text-foreground">{customer.full_name}</h1>
        <p className="text-muted-foreground mt-1">{t("profile")}</p>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="card-title mb-4">{t("contactInfo")}</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">{tAdmin("customers.email")}</p>
                <p className="font-medium text-foreground">{customer.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tAdmin("customers.phone")}</p>
                <p className="font-medium text-foreground">{customer.phone || t("notProvided")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("address")}</p>
                <p className="font-medium text-foreground">{customer.address || t("notProvided")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("cityPostal")}</p>
                <p className="font-medium text-foreground">{cityPostal || t("notProvided")}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="card-title mb-4">{t("activity")}</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">{t("joinedOn")}</p>
                <p className="font-medium text-foreground">{formatDate(customer.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tAdmin("sidebar.submittedVehicles")}</p>
                <p className="font-medium text-foreground">{format.number(customer.submitted_vehicles?.length || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tAdmin("sidebar.inquiries")}</p>
                <p className="font-medium text-foreground">{format.number(customer.inquiries?.length || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tAdmin("sidebar.tradeIns")}</p>
                <p className="font-medium text-foreground">{format.number(customer.trade_in_requests?.length || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {customer.submitted_vehicles && customer.submitted_vehicles.length > 0 && (
        <div className="card p-6">
          <h3 className="card-title mb-4">{tAdmin("sidebar.submittedVehicles")}</h3>
          <div className="space-y-3">
            {customer.submitted_vehicles.map((vehicle: any) => (
              <div
                key={vehicle.id}
                className="p-4 border border-border rounded-lg flex justify-between items-start"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {vehicle.year} {vehicle.brand} {vehicle.model}
                  </p>
                  {vehicle.mileage != null && (
                    <p className="text-sm text-muted-foreground">
                      {tAdmin("units.mileage", { value: format.number(vehicle.mileage) })}
                    </p>
                  )}
                </div>
                <StatusBadge kind="submission" status={vehicle.status} withIcon>{getSubmissionStatusLabel(tCommon, vehicle.status)}</StatusBadge>
              </div>
            ))}
          </div>
        </div>
      )}

      {customer.inquiries && customer.inquiries.length > 0 && (
        <div className="card p-6">
          <h3 className="card-title mb-4">{tAdmin("sidebar.inquiries")}</h3>
          <div className="space-y-3">
            {customer.inquiries.map((inquiry: any) => (
              <div
                key={inquiry.id}
                className="p-4 border border-border rounded-lg flex justify-between items-start"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {getInquiryTypeLabel(tCommon, inquiry.inquiry_type)}
                    {inquiry.vehicle_label ? ` · ${inquiry.vehicle_label}` : ""}
                  </p>
                  {inquiry.message && <p className="font-medium text-foreground line-clamp-2 break-words">{inquiry.message}</p>}
                  <p className="text-sm text-muted-foreground mt-1">{formatDate(inquiry.created_at)}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-info-subtle text-info-subtle-foreground">
                  {getInquiryStatusLabel(tCommon, inquiry.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {customer.trade_in_requests && customer.trade_in_requests.length > 0 && (
        <div className="card p-6">
          <h3 className="card-title mb-4">{tAdmin("sidebar.tradeIns")}</h3>
          <div className="space-y-3">
            {customer.trade_in_requests.map((request: any) => (
              <div
                key={request.id}
                className="p-4 border border-border rounded-lg flex justify-between items-start"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {request.current_vehicle_year} {request.current_vehicle_brand}{" "}
                    {request.current_vehicle_model}
                    {request.desired_vehicle && (
                      <>
                        <ArrowRight className="inline w-4 h-4 mx-2 text-muted-foreground align-[-2px]" role="img" aria-label={tAdmin("tradeIns.desiredVehicle")} />
                        {request.desired_vehicle.brand} {request.desired_vehicle.model}
                      </>
                    )}
                  </p>
                  {request.commission && (
                    <p className="text-sm text-highlight mt-1 flex items-center gap-1.5">
                      <Lock className="w-4 h-4" aria-hidden="true" />
                      {tAdmin("tradeIns.commission")}:{" "}
                      {format.number(request.commission / 100, { style: "percent", maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
                <StatusBadge kind="tradeIn" status={request.status}>{getTradeInStatusLabel(tCommon, request.status)}</StatusBadge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
