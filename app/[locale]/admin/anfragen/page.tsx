"use client";
import { useTranslations } from "next-intl";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, Calendar, Mail, Phone, User } from "lucide-react";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { getInquiryStatusLabel, getInquiryTypeLabel } from "@/lib/vehicle-labels";
import type { InquiryCategory } from "@/app/actions/admin";

const STATUSES = ["new", "read", "responded", "closed"] as const;
const CATEGORIES: (InquiryCategory | "")[] = ["", "vehicle", "contact"];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  read: "bg-yellow-100 text-yellow-800",
  responded: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

const TYPE_COLORS: Record<string, string> = {
  test_drive: "bg-orange-100 text-orange-800",
  contact: "bg-teal-100 text-teal-800",
};

export default function AdminInquiriesPage() {
  const router = useRouter();
  const { loading, isAdmin } = useAuth();
  const t = useTranslations("admin.inquiries");
  const tCommon = useTranslations("common");
  const format = useLocaleFormatter();
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const errorMessage = useErrorMessage();
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("new");
  const [categoryFilter, setCategoryFilter] = useState<InquiryCategory | "">("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    const loadInquiries = async () => {
      try {
        setInquiriesLoading(true);
        const { getInquiries } = await import("@/app/actions/admin");
        const result = await getInquiries({
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
        });
        if (!result.ok) {
          setError(errorMessage(result));
          return;
        }
        setInquiries(result.inquiries);
        setError("");
      } catch (err) {
        console.error("Error loading inquiries:", err);
        setError(errorMessage(err));
      } finally {
        setInquiriesLoading(false);
      }
    };

    if (isAdmin) loadInquiries();
  }, [statusFilter, categoryFilter, isAdmin]);

  const handleStatusChange = async (inquiryId: string, newStatus: string) => {
    try {
      setActionInProgress(inquiryId);
      const { updateInquiryStatus } = await import("@/app/actions/admin");
      const result = await updateInquiryStatus(inquiryId, newStatus);
      if (!result.ok) {
        setError(errorMessage(result));
        return;
      }
      setInquiries((prev) =>
        prev.map((i) => (i.id === inquiryId ? { ...i, status: newStatus } : i))
      );
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  const numericDate = { year: "numeric", month: "2-digit", day: "2-digit" } as const;
  const formatReceived = (value: string) =>
    format.dateTime(new Date(value), { ...numericDate, hour: "2-digit", minute: "2-digit" });
  // preferred_date is a calendar date (YYYY-MM-DD); format it in UTC so it never shifts a day.
  const formatDay = (value: string) => format.dateTime(new Date(`${value}T00:00:00Z`), { ...numericDate, timeZone: "UTC" });

  const categoryLabel = (category: InquiryCategory | "") =>
    category === "vehicle" ? t("categoryVehicle") : category === "contact" ? t("categoryContact") : t("categoryAll");

  const filterButton = (active: boolean) =>
    `px-4 py-2 rounded-lg font-medium transition-colors ${
      active ? "bg-kfz-blue text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
    }`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-600 mt-1">{t("description")}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={filterButton(statusFilter === status)}>
              {getInquiryStatusLabel(tCommon, status)}
            </button>
          ))}
          <button onClick={() => setStatusFilter("")} className={filterButton(statusFilter === "")}>
            {t("allStatuses")}
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((category) => (
            <button
              key={category || "all"}
              onClick={() => setCategoryFilter(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === category ? "bg-gray-900 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {categoryLabel(category)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {inquiriesLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto"></div>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">{t("empty")}</p>
          </div>
        ) : (
          inquiries.map((inquiry) => (
            <div key={inquiry.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 break-words">{inquiry.customer_name}</h3>
                  <a
                    href={`mailto:${inquiry.customer_email}`}
                    className="text-sm text-kfz-blue hover:underline flex items-center gap-1 mt-1 break-all"
                  >
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    {inquiry.customer_email}
                  </a>
                  {inquiry.customer_phone && (
                    <a
                      href={`tel:${inquiry.customer_phone.replace(/\s/g, "")}`}
                      className="text-sm text-gray-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      {inquiry.customer_phone}
                    </a>
                  )}
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <User className="w-4 h-4 flex-shrink-0" />
                    {inquiry.user_id ? (
                      <Link href={`/admin/kunden/${inquiry.user_id}`} className="hover:underline">
                        {t("customerAccount")}
                      </Link>
                    ) : (
                      t("guest")
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      STATUS_COLORS[inquiry.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {getInquiryStatusLabel(tCommon, inquiry.status)}
                  </span>
                  <p className="text-xs text-gray-500">{t("receivedAt", { date: formatReceived(inquiry.created_at) })}</p>
                </div>
              </div>

              <div className="flex gap-2 mb-4 flex-wrap items-center">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    TYPE_COLORS[inquiry.inquiry_type] || "bg-purple-100 text-purple-800"
                  }`}
                >
                  {getInquiryTypeLabel(tCommon, inquiry.inquiry_type)}
                </span>
                {inquiry.vehicle ? (
                  <Link href={`/admin/fahrzeuge/${inquiry.vehicle_id}`}>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200">
                      {inquiry.vehicle.brand} {inquiry.vehicle.model} ({inquiry.vehicle.year})
                    </span>
                  </Link>
                ) : (
                  inquiry.vehicle_label && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {t("vehicleNotListed", { vehicle: inquiry.vehicle_label })}
                    </span>
                  )
                )}
                {inquiry.preferred_date && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-800 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {t("preferredDate")}: {formatDay(inquiry.preferred_date)}
                  </span>
                )}
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-2">{t("message")}</p>
                {inquiry.message ? (
                  <p className="text-sm text-gray-700 whitespace-pre-line break-words">{inquiry.message}</p>
                ) : (
                  <p className="text-sm text-gray-500 italic">{t("noMessage")}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label htmlFor={`status-${inquiry.id}`} className="text-sm font-medium text-gray-700">
                  {t("status")}
                </label>
                <select
                  id={`status-${inquiry.id}`}
                  value={inquiry.status}
                  disabled={actionInProgress === inquiry.id}
                  onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-kfz-accent outline-none disabled:opacity-50"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getInquiryStatusLabel(tCommon, status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
