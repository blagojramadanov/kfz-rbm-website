"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { getInquiryStatusLabel, getSubmissionStatusLabel, getTradeInStatusLabel } from "@/lib/vehicle-labels";

export const dynamic = "force-dynamic";

// Keyed by submitted_vehicles.status (DB values).
const STATUS_COLORS: Record<string, string> = {
  eingereicht: "bg-blue-100 text-blue-800",
  in_bearbeitung: "bg-yellow-100 text-yellow-800",
  angebot_gesendet: "bg-green-100 text-green-800",
  akzeptiert: "bg-green-100 text-green-800",
  abgelehnt: "bg-red-100 text-red-800",
};

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  const backLink = (
    <Link href="/admin/kunden" className="inline-flex items-center gap-2 text-kfz-blue hover:text-kfz-blue-dark font-medium">
      <ArrowLeft className="w-4 h-4" />
      {t("backToList")}
    </Link>
  );

  if (!customer) {
    return (
      <div className="space-y-6">
        {backLink}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error || t("notFound")}</p>
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900">{customer.full_name}</h1>
        <p className="text-gray-600 mt-1">{t("profile")}</p>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("contactInfo")}</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600">{tAdmin("customers.email")}</p>
                <p className="font-medium text-gray-900">{customer.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{tAdmin("customers.phone")}</p>
                <p className="font-medium text-gray-900">{customer.phone || t("notProvided")}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t("address")}</p>
                <p className="font-medium text-gray-900">{customer.address || t("notProvided")}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t("cityPostal")}</p>
                <p className="font-medium text-gray-900">{cityPostal || t("notProvided")}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("activity")}</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600">{t("joinedOn")}</p>
                <p className="font-medium text-gray-900">{formatDate(customer.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{tAdmin("sidebar.submittedVehicles")}</p>
                <p className="font-medium text-gray-900">{format.number(customer.submitted_vehicles?.length || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{tAdmin("sidebar.inquiries")}</p>
                <p className="font-medium text-gray-900">{format.number(customer.inquiries?.length || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{tAdmin("sidebar.tradeIns")}</p>
                <p className="font-medium text-gray-900">{format.number(customer.trade_in_requests?.length || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {customer.submitted_vehicles && customer.submitted_vehicles.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{tAdmin("sidebar.submittedVehicles")}</h3>
          <div className="space-y-3">
            {customer.submitted_vehicles.map((vehicle: any) => (
              <div
                key={vehicle.id}
                className="p-4 border border-gray-200 rounded-lg flex justify-between items-start"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {vehicle.year} {vehicle.brand} {vehicle.model}
                  </p>
                  {vehicle.mileage != null && (
                    <p className="text-sm text-gray-600">
                      {tAdmin("units.mileage", { value: format.number(vehicle.mileage) })}
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    STATUS_COLORS[vehicle.status] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {getSubmissionStatusLabel(tCommon, vehicle.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {customer.inquiries && customer.inquiries.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{tAdmin("sidebar.inquiries")}</h3>
          <div className="space-y-3">
            {customer.inquiries.map((inquiry: any) => (
              <div
                key={inquiry.id}
                className="p-4 border border-gray-200 rounded-lg flex justify-between items-start"
              >
                <div>
                  <p className="font-medium text-gray-900 line-clamp-2">{inquiry.message}</p>
                  <p className="text-sm text-gray-600 mt-1">{formatDate(inquiry.created_at)}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {getInquiryStatusLabel(tCommon, inquiry.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {customer.trade_in_requests && customer.trade_in_requests.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{tAdmin("sidebar.tradeIns")}</h3>
          <div className="space-y-3">
            {customer.trade_in_requests.map((request: any) => (
              <div
                key={request.id}
                className="p-4 border border-gray-200 rounded-lg flex justify-between items-start"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {request.current_vehicle_year} {request.current_vehicle_brand}{" "}
                    {request.current_vehicle_model}
                    {request.desired_vehicle && (
                      <>
                        <span className="text-gray-600 mx-2">→</span>
                        {request.desired_vehicle.brand} {request.desired_vehicle.model}
                      </>
                    )}
                  </p>
                  {request.commission && (
                    <p className="text-sm text-purple-600 mt-1">
                      🔐 {tAdmin("tradeIns.commission")}:{" "}
                      {format.number(request.commission / 100, { style: "percent", maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {getTradeInStatusLabel(tCommon, request.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
