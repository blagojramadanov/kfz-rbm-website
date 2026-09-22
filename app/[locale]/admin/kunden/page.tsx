"use client";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, Search, Eye } from "lucide-react";
import Link from "next/link";

export default function AdminCustomersPage() {
  const params = useParams();
  const locale = params.locale as string || 'de';
  const router = useRouter();
  const { loading, isAdmin } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/admin-access-denied");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setCustomersLoading(true);
        const { getCustomers } = await import("@/app/actions/admin");
        const data = await getCustomers();
        setCustomers(data);
        setError("");
      } catch (err) {
        console.error("Error loading customers:", err);
        setError("Fehler beim Laden der Kunden");
      } finally {
        setCustomersLoading(false);
      }
    };

    setCustomersLoading(true);
    const timeout = setTimeout(loadCustomers, 300);
    return () => clearTimeout(timeout);
  }, [search, isAdmin]);

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Wird geladen...</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kundenverwaltung</h1>
        <p className="text-gray-600 mt-1">Übersicht aller Kunden und ihrer Aktivitäten</p>
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
            placeholder="Nach Name oder E-Mail suchen..."
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
        ) : customers.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            Keine Kunden gefunden.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">E-Mail</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Telefon</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Beigetreten
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Fahrzeuge
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Anfragen
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Inzahlungnahmen
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.map((customer) => (
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
                        {customer.submitted_vehicles_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        {customer.inquiries_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        {customer.trade_in_requests_count || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/kunden/${customer.id}`}>
                        <button className="p-2 text-gray-600 hover:text-kfz-blue hover:bg-gray-100 rounded transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
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
