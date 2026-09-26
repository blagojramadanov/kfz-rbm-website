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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">{tCommon("loading")}</p>
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
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-600 mt-1">{t("description")}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {customersLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto"></div>
          </div>
        ) : visibleCustomers.length === 0 ? (
          <div className="text-center py-12 text-gray-600">{t("empty")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t("name")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t("email")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t("phone")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t("joined")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t("vehicles")}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    {tAdmin("sidebar.inquiries")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    {tAdmin("sidebar.tradeIns")}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {visibleCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{customer.full_name}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.phone || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {format.number(customer.submitted_vehicles_count || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        {format.number(customer.inquiries_count || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        {format.number(customer.trade_in_requests_count || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/kunden/${customer.id}`} title={t("viewProfile")} aria-label={t("viewProfile")}>
                        <span className="inline-flex p-2 text-gray-600 hover:text-kfz-blue hover:bg-gray-100 rounded transition-colors">
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
