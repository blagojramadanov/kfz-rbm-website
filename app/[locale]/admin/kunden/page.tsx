"use client";
import { useTranslations } from "next-intl";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, Search, Eye } from "lucide-react";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";

export default function AdminCustomersPage() {
  const t = useTranslations("admin.customers");
  const tAdmin = useTranslations("admin");
  const tCommon = useTranslations("common");
  const format = useLocaleFormatter();
  const router = useRouter();
  const { loading, isAdmin } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const errorMessage = useErrorMessage();
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setCustomersLoading(true);
        const { getCustomers } = await import("@/app/actions/admin");
        const result = await getCustomers();
        if (!result.ok) {
          setError(errorMessage(result));
          return;
        }
        setCustomers(result.customers);
        setError("");
      } catch (err) {
        console.error("Error loading customers:", err);
        setError(errorMessage(err));
      } finally {
        setCustomersLoading(false);
      }
    };

    if (isAdmin) loadCustomers();
  }, [isAdmin]);

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

  const formatDate = (date: string) =>
    format.dateTime(new Date(date), { year: "numeric", month: "2-digit", day: "2-digit" });

  const query = search.trim().toLowerCase();
  const visibleCustomers = query
    ? customers.filter(
        (customer) =>
          customer.full_name?.toLowerCase().includes(query) || customer.email?.toLowerCase().includes(query)
      )
    : customers;

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

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground/70" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field pl-10 pr-4"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {customersLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : visibleCustomers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{t("empty")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t("name")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t("email")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t("phone")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t("joined")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t("vehicles")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    {tAdmin("sidebar.inquiries")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                    {tAdmin("sidebar.tradeIns")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{customer.full_name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{customer.email}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{customer.phone || "—"}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-info-subtle text-info-subtle-foreground">
                        {format.number(customer.submitted_vehicles_count || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-warning-subtle text-warning-subtle-foreground">
                        {format.number(customer.inquiries_count || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-highlight-subtle text-highlight-subtle-foreground">
                        {format.number(customer.trade_in_requests_count || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/kunden/${customer.id}`} title={t("viewProfile")} aria-label={t("viewProfile")}>
                        <span className="inline-flex p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded transition-colors">
                          <Eye className="w-4 h-4" />
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
