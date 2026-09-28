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
import { StatusBadge } from "@/components/status-badge";
import type { InquiryCategory } from "@/app/actions/admin";

const STATUSES = ["new", "read", "responded", "closed"] as const;
const CATEGORIES: (InquiryCategory | "")[] = ["", "vehicle", "contact"];



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
      // Keep the inquiry only if it still matches the active status filter.
      setInquiries((prev) =>
        statusFilter && newStatus !== statusFilter
          ? prev.filter((i) => i.id !== inquiryId)
          : prev.map((i) => (i.id === inquiryId ? { ...i, status: newStatus } : i))
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{tCommon("loading")}</p>
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
      active ? "bg-primary text-primary-foreground" : "bg-border text-foreground hover:bg-input"
    }`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("description")}</p>
      </div>

      {error && (
        <div className="bg-destructive-subtle/50 border border-destructive-border rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive-subtle-foreground">{error}</p>
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
              className={`min-h-11 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === category ? "bg-inverse text-primary-foreground" : "bg-card border border-input text-foreground hover:bg-secondary"
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="card p-6 sm:p-8 text-center">
            <p className="text-muted-foreground">{t("empty")}</p>
          </div>
        ) : (
          inquiries.map((inquiry) => (
            <div key={inquiry.id} className="card p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                <div className="min-w-0">
                  <h3 className="card-title break-words">{inquiry.customer_name}</h3>
                  <a
                    href={`mailto:${inquiry.customer_email}`}
                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-1 break-all"
                  >
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    {inquiry.customer_email}
                  </a>
                  {inquiry.customer_phone && (
                    <a
                      href={`tel:${inquiry.customer_phone.replace(/\s/g, "")}`}
                      className="text-sm text-muted-foreground hover:underline flex items-center gap-1 mt-1"
                    >
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      {inquiry.customer_phone}
                    </a>
                  )}
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
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
                  <StatusBadge kind="inquiry" status={inquiry.status}>{getInquiryStatusLabel(tCommon, inquiry.status)}</StatusBadge>
                  <p className="text-xs text-muted-foreground">{t("receivedAt", { date: formatReceived(inquiry.created_at) })}</p>
                </div>
              </div>

              <div className="flex gap-2 mb-4 flex-wrap items-center">
                <StatusBadge kind="inquiryType" status={inquiry.inquiry_type}>{getInquiryTypeLabel(tCommon, inquiry.inquiry_type)}</StatusBadge>
                {inquiry.vehicle ? (
                  <Link href={`/admin/fahrzeuge/${inquiry.vehicle_id}`} className="inline-flex min-h-11 items-center">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-info-subtle text-info-subtle-foreground cursor-pointer hover:bg-info-border">
                      {inquiry.vehicle.brand} {inquiry.vehicle.model} ({inquiry.vehicle.year})
                    </span>
                  </Link>
                ) : (
                  inquiry.vehicle_label && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-foreground">
                      {t("vehicleNotListed", { vehicle: inquiry.vehicle_label })}
                    </span>
                  )
                )}
                {inquiry.preferred_date && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-warning-subtle/50 text-warning-subtle-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {t("preferredDate")}: {formatDay(inquiry.preferred_date)}
                  </span>
                )}
              </div>

              <div className="mb-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">{t("message")}</p>
                {inquiry.message ? (
                  <p className="text-sm text-foreground whitespace-pre-line break-words">{inquiry.message}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">{t("noMessage")}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label htmlFor={`status-${inquiry.id}`} className="text-sm font-medium text-foreground">
                  {t("status")}
                </label>
                <select
                  id={`status-${inquiry.id}`}
                  value={inquiry.status}
                  disabled={actionInProgress === inquiry.id}
                  onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                  className="field w-auto text-sm"
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
