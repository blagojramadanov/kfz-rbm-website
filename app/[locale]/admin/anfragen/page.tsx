"use client";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, CheckCircle, Mail } from "lucide-react";
import { useErrorMessage } from "@/lib/use-error-message";

export default function AdminInquiriesPage() {
  const params = useParams();
  const locale = params.locale as string || 'de';
  const router = useRouter();
  const { loading, isAdmin } = useAuth();
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const errorMessage = useErrorMessage();
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("new");
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
  }, [statusFilter, isAdmin]);

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
          <p className="text-gray-600">Wird geladen...</p>
        </div>
      </div>
    );
  }

  const statuses = [
    { value: "new", label: "Neu" },
    { value: "read", label: "Gelesen" },
    { value: "responded", label: "Beantwortet" },
    { value: "closed", label: "Geschlossen" },
  ];

  const STATUS_COLORS: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    read: "bg-yellow-100 text-yellow-800",
    responded: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
  };

  const INQUIRY_TYPE_LABELS: Record<string, string> = {
    general: "Allgemeine Anfrage",
    test_drive: "Probefahrt",
    part_exchange: "Teiltausch",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kundenanfragen</h1>
        <p className="text-gray-600 mt-1">Verwaltung aller Kundenanfragen und Anfragen</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((status) => (
          <button
            key={status.value}
            onClick={() => setStatusFilter(status.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === status.value
                ? "bg-kfz-blue text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {inquiriesLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto"></div>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">Keine Anfragen gefunden.</p>
          </div>
        ) : (
          inquiries.map((inquiry) => (
            <div key={inquiry.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {inquiry.user?.full_name}
                  </h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Mail className="w-4 h-4" />
                    {inquiry.user?.email}
                  </p>
                  <p className="text-sm text-gray-500">{inquiry.user?.phone}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    STATUS_COLORS[inquiry.status] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {statuses.find((s) => s.value === inquiry.status)?.label || inquiry.status}
                </span>
              </div>

              <div className="flex gap-2 mb-4 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {INQUIRY_TYPE_LABELS[inquiry.inquiry_type] || inquiry.inquiry_type}
                </span>
                {inquiry.vehicle && (
                  <Link href={`/admin/fahrzeuge/${inquiry.vehicle_id}`}>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200">
                      {inquiry.vehicle.brand} {inquiry.vehicle.model}
                    </span>
                  </Link>
                )}
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900 mb-2">Nachricht</p>
                <p className="text-sm text-gray-700 line-clamp-3">{inquiry.message}</p>
              </div>

              <div className="flex gap-2">
                {statusFilter === "new" && (
                  <button
                    onClick={() => handleStatusChange(inquiry.id, "read")}
                    disabled={actionInProgress === inquiry.id}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Als gelesen markieren
                  </button>
                )}
                {statusFilter === "read" && (
                  <button
                    onClick={() => handleStatusChange(inquiry.id, "responded")}
                    disabled={actionInProgress === inquiry.id}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Als beantwortet markieren
                  </button>
                )}
                {statusFilter !== "closed" && (
                  <button
                    onClick={() => handleStatusChange(inquiry.id, "closed")}
                    disabled={actionInProgress === inquiry.id}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Schließen
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
