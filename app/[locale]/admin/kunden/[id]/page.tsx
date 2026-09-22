"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const locale = params.locale as string || 'de';
  const router = useRouter();
  const customerId = params?.id as string;
  const { loading, isAdmin } = useAuth();
  const [customer, setCustomer] = useState<any>(null);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/admin-access-denied");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    const loadCustomer = async () => {
      if (!customerId) return;
      try {
        setCustomerLoading(true);
        const { getCustomerDetails } = await import("@/app/actions/admin");
        const data = await getCustomerDetails(customerId);
        setCustomer(data);
        setError("");
      } catch (err) {
        console.error("Error loading customer:", err);
        setError("Fehler beim Laden des Kunden");
      } finally {
        setCustomerLoading(false);
      }
    };

    if (isAdmin && customerId) loadCustomer();
  }, [customerId, isAdmin]);

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

  if (customerLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <Link href="/admin/kunden">
          <button className="flex items-center gap-2 text-kfz-blue hover:text-kfz-blue-dark font-medium">
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Kundenliste
          </button>
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">Kunde nicht gefunden.</p>
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

  const STATUS_LABELS: Record<string, string> = {
    submitted: "Eingereicht",
    under_review: "Zur Überprüfung",
    approved: "Genehmigt",
    rejected: "Abgelehnt",
  };

  const STATUS_COLORS: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-800",
    under_review: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <Link href="/admin/kunden">
        <button className="flex items-center gap-2 text-kfz-blue hover:text-kfz-blue-dark font-medium">
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Kundenliste
        </button>
      </Link>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900">{customer.full_name}</h1>
        <p className="text-gray-600 mt-1">Kundenprofil</p>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kontaktinformationen</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600">E-Mail</p>
                <p className="font-medium text-gray-900">{customer.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Telefon</p>
                <p className="font-medium text-gray-900">{customer.phone || "Nicht angegeben"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Adresse</p>
                <p className="font-medium text-gray-900">{customer.address || "Nicht angegeben"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Stadt / Postleitzahl</p>
                <p className="font-medium text-gray-900">
                  {customer.city} {customer.postal_code}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktivität</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600">Beigetreten am</p>
                <p className="font-medium text-gray-900">{formatDate(customer.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Eingereichte Fahrzeuge</p>
                <p className="font-medium text-gray-900">{customer.submitted_vehicles?.length || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Anfragen</p>
                <p className="font-medium text-gray-900">{customer.inquiries?.length || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Inzahlungnahmen</p>
                <p className="font-medium text-gray-900">{customer.trade_in_requests?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {customer.submitted_vehicles && customer.submitted_vehicles.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Eingereichte Fahrzeuge</h3>
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
                  <p className="text-sm text-gray-600">{vehicle.mileage?.toLocaleString("de-DE")} km</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    STATUS_COLORS[vehicle.status] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {STATUS_LABELS[vehicle.status] || vehicle.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {customer.inquiries && customer.inquiries.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Anfragen</h3>
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
                  {inquiry.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {customer.trade_in_requests && customer.trade_in_requests.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inzahlungnahmen</h3>
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
                      🔐 Commission: {request.commission}%
                    </p>
                  )}
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
