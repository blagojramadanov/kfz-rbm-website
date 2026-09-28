"use client";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, Edit2, X, Lock } from "lucide-react";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { formatPrice } from "@/lib/format-vehicle";
import { StatusBadge } from "@/components/status-badge";
import { getTradeInStatusLabel } from "@/lib/vehicle-labels";

export default function AdminTradeInRequestsPage() {
  const params = useParams();
  const locale = params.locale as string || 'de';
  const router = useRouter();
  const { loading, isAdmin } = useAuth();
  const t = useTranslations("admin.tradeIns");
  const tAdmin = useTranslations("admin");
  const tCommon = useTranslations("common");
  const tButtons = useTranslations("buttons");
  const format = useLocaleFormatter();
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const errorMessage = useErrorMessage();
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("new");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setRequestsLoading(true);
        const { getTradeInRequests } = await import("@/app/actions/admin");
        const result = await getTradeInRequests({
          status: statusFilter || undefined,
        });
        if (!result.ok) {
          setError(errorMessage(result));
          return;
        }
        setRequests(result.requests);
        setError("");
      } catch (err) {
        console.error("Error loading requests:", err);
        setError(errorMessage(err));
      } finally {
        setRequestsLoading(false);
      }
    };

    if (isAdmin) loadRequests();
  }, [statusFilter, isAdmin]);

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      setActionInProgress(requestId);
      const { updateTradeInRequest } = await import("@/app/actions/admin");
      const result = await updateTradeInRequest(requestId, {
        status: newStatus as any,
        admin_notes: editingNotes,
      });
      if (!result.ok) {
        setError(errorMessage(result));
        return;
      }
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: newStatus, admin_notes: editingNotes } : r
        )
      );
      setEditingId(null);
      setEditingNotes("");
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

  const statuses = ["new", "reviewing", "contact_made", "completed", "cancelled"];


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

      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === status
                ? "bg-primary text-primary-foreground"
                : "bg-border text-foreground hover:bg-input"
            }`}
          >
            {getTradeInStatusLabel(tCommon, status)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {requestsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="card p-6 sm:p-8 text-center">
            <p className="text-muted-foreground">{t("empty")}</p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="card-title">
                    {request.user?.full_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{request.user?.email}</p>
                  <p className="text-sm text-muted-foreground">{request.user?.phone || t("noPhone")}</p>
                </div>
                <StatusBadge kind="tradeIn" status={request.status}>{getTradeInStatusLabel(tCommon, request.status)}</StatusBadge>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-info-subtle/50 border border-info-border rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-2">{t("currentVehicle")}</p>
                  <p className="text-lg font-semibold text-foreground">
                    {request.current_vehicle_year} {request.current_vehicle_brand}{" "}
                    {request.current_vehicle_model}
                  </p>
                  {request.current_vehicle_mileage != null && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {tAdmin("units.mileage", { value: format.number(request.current_vehicle_mileage) })}
                    </p>
                  )}
                  {request.current_vehicle_value_estimate != null && (
                    <p className="text-sm text-muted-foreground">
                      {t("estimatedValue", { value: formatPrice(format, request.current_vehicle_value_estimate) })}
                    </p>
                  )}
                </div>

                <div className="p-4 bg-success-subtle/50 border border-success-border rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-2">{t("desiredVehicle")}</p>
                  {request.desired_vehicle ? (
                    <>
                      <p className="text-lg font-semibold text-foreground">
                        {request.desired_vehicle.year} {request.desired_vehicle.brand}{" "}
                        {request.desired_vehicle.model}
                      </p>
                      {request.desired_vehicle.price != null && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {formatPrice(format, request.desired_vehicle.price)}
                        </p>
                      )}
                      {request.estimated_price_difference != null && (
                        <p
                          className={`text-sm font-medium mt-2 ${
                            request.estimated_price_difference > 0
                              ? "text-destructive"
                              : "text-success"
                          }`}
                        >
                          {t(request.estimated_price_difference > 0 ? "additionalPayment" : "credit", {
                            amount: formatPrice(format, Math.abs(request.estimated_price_difference)),
                          })}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("vehicleNotFound")}</p>
                  )}
                </div>
              </div>

              {request.commission && (
                <div className="mb-4 p-3 bg-highlight-subtle/50 border border-highlight-border rounded-lg">
                  <p className="text-sm flex items-center flex-wrap">
                    <Lock className="w-4 h-4 mr-1.5 text-highlight" aria-hidden="true" />
                    <span className="font-medium text-foreground">{t("commission")}:</span>
                    <span className="text-muted-foreground ml-2">
                      {format.number(request.commission / 100, { style: "percent", maximumFractionDigits: 2 })}
                    </span>
                  </p>
                </div>
              )}

              {editingId === request.id ? (
                <div className="mb-6 p-4 border border-input rounded-lg bg-muted">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("adminNotes")}
                  </label>
                  <textarea
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    placeholder={t("notesPlaceholder")}
                    rows={3}
                    className="field"
                  />
                  <div className="flex gap-2 mt-3">
                    <select
                      aria-label={t("status")}
                      value={request.status}
                      onChange={(e) => handleStatusChange(request.id, e.target.value)}
                      disabled={actionInProgress === request.id}
                      className="field flex-1"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {getTradeInStatusLabel(tCommon, status)}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditingNotes("");
                      }}
                      aria-label={tButtons("cancel")}
                      className="px-4 py-2 border border-input rounded-lg hover:bg-secondary font-medium transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {request.admin_notes && (
                    <div className="mb-4 p-4 bg-muted border border-border rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-2">{t("adminNotes")}</p>
                      <p className="text-sm text-foreground">{request.admin_notes}</p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setEditingId(request.id);
                      setEditingNotes(request.admin_notes || "");
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover font-medium transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    {t("editStatusNotes")}
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
