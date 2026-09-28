"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { useRouter, Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Plus, Car, Clock, CheckCircle, AlertCircle } from "lucide-react";
import Image from "next/image";
import type { SubmittedVehicle } from "@/lib/supabase";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { getFuelTypeLabel, getTransmissionLabel } from "@/lib/vehicle-labels";
import { getDeclinedOfferPrice } from "@/lib/submission-workflow";
import { PageHeader } from "@/components/page-header";

type DashboardVehicleStatus = "eingereicht" | "in_bearbeitung" | "angebot_gesendet" | "akzeptiert" | "abgelehnt";

export const dynamic = "force-dynamic";

export default function MyVehiclesPage() {
  const t = useTranslations("dashboard.vehicles");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");
  const tButtons = useTranslations("buttons");
  const formatter = useLocaleFormatter();
  const router = useRouter();
  const { loading, isAuthenticated, user } = useAuth();
  const errorMessage = useErrorMessage();
  const [vehicles, setVehicles] = useState<SubmittedVehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  // Offer answer waiting for confirmation in the dialog.
  const [pendingAnswer, setPendingAnswer] = useState<{ vehicleId: string; decision: "accept" | "reject"; price: number } | null>(null);
  const [answering, setAnswering] = useState(false);

  const formatCurrency = (value: number) => {
    return formatter.number(value, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const getStatusConfig = (status: DashboardVehicleStatus): { label: string; icon: React.ReactNode } => {
    const statusLabel = t(`status.${status}`);
    const icons: Record<DashboardVehicleStatus, React.ReactNode> = {
      eingereicht: <Clock className="w-4 h-4" />,
      in_bearbeitung: <Clock className="w-4 h-4" />,
      angebot_gesendet: <CheckCircle className="w-4 h-4" />,
      akzeptiert: <CheckCircle className="w-4 h-4" />,
      abgelehnt: <AlertCircle className="w-4 h-4" />,
    };
    return {
      label: statusLabel,
      icon: icons[status],
    };
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      fetchVehicles();
    }
  }, [user]);

  const fetchVehicles = async () => {
    if (!user) return;
    try {
      setLoadingVehicles(true);
      const { getSubmittedVehicles } = await import("@/app/actions/vehicles");
      const result = await getSubmittedVehicles();
      if (!result.ok) {
        alert(errorMessage(result));
        return;
      }
      const data = result.vehicles;
      setVehicles(data || []);

      // Signed URLs for the cover photo of each vehicle (the only one this page shows).
      // The action only signs photos of the customer's own submissions.
      if (data && data.length > 0) {
        const allPaths = data.map((v) => v.images?.[0]).filter((path): path is string => Boolean(path));
        if (allPaths.length > 0) {
          const { getSignedImageUrls } = await import("@/app/actions/storage");
          const signed = await getSignedImageUrls(allPaths);
          if (signed.ok) {
            const urlMap = Object.fromEntries(signed.urls.filter(u => u.url).map(u => [u.path, u.url!]));
            setImageUrls(urlMap);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      alert(errorMessage(error));
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleConfirmAnswer = async () => {
    if (!user || !pendingAnswer) return;
    try {
      setAnswering(true);
      const { acceptOffer, rejectOffer } = await import("@/app/actions/vehicles");
      const answer = pendingAnswer.decision === "accept" ? acceptOffer : rejectOffer;
      const result = await answer(pendingAnswer.vehicleId);
      if (!result.ok) {
        alert(errorMessage(result));
        return;
      }
      setPendingAnswer(null);
      await fetchVehicles();
    } catch (error) {
      console.error("Error answering offer:", error);
      alert(errorMessage(error));
    } finally {
      setAnswering(false);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <PageHeader
        title={t("title")}
        description={t("description")}
        backHref="/dashboard"
        backLabel={<>← {tNav("dashboard")}</>}
        actions={
          <Link href="/dashboard/fahrzeug-anbieten">
            <Button variant="inverse">
              <Plus className="mr-2 w-4 h-4" />
              {t("addNew")}
            </Button>
          </Link>
        }
      />

      <main className="page-container">
        {loadingVehicles ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t("loading")}</p>
            </div>
          </div>
        ) : vehicles.length === 0 ? (
          // Empty State
          <div className="card p-8 sm:p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-secondary rounded-lg p-6">
                <Car className="w-12 h-12 text-muted-foreground/70" />
              </div>
            </div>
            <h2 className="section-title mb-2">
              {t("empty")}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {t("emptyDescription")}
            </p>
            <Link href="/dashboard/fahrzeug-anbieten">
              <Button>
                <Plus className="mr-2 w-4 h-4" />
                {t("firstVehicle")}
              </Button>
            </Link>
          </div>
        ) : (
          // Vehicle Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => {
              const status = (vehicle.status as DashboardVehicleStatus) || "eingereicht";
              const config = getStatusConfig(status);

              return (
                <div key={vehicle.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image (private photo behind a short-lived signed URL: unoptimized keeps it out of the shared image cache) */}
                  <div className="relative w-full aspect-video bg-border overflow-hidden">
                    {vehicle.images && vehicle.images.length > 0 && imageUrls[vehicle.images[0]] ? (
                      <Image
                        src={imageUrls[vehicle.images[0]]}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-12 h-12 text-muted-foreground/70" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Status Badge */}
                    <StatusBadge kind="submission" status={status} className="mb-3">
                      {config.icon}
                      {config.label}
                    </StatusBadge>

                    {/* Vehicle Info */}
                    <h3 className="card-title mb-1">
                      {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {vehicle.year} • {formatter.number(vehicle.mileage || 0)} km
                    </p>

                    {/* Price */}
                    <p className="text-2xl font-bold text-primary mb-4">
                      {formatCurrency(vehicle.price || 0)}
                    </p>

                    {/* Quick Specs */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-semibold">{t("fuel")}:</span> {getFuelTypeLabel(tCommon, vehicle.fuel_type)}
                      </div>
                      <div>
                        <span className="font-semibold">{t("transmission")}:</span> {getTransmissionLabel(tCommon, vehicle.transmission)}
                      </div>
                    </div>

                    {/* Offer Section */}
                    {status === "angebot_gesendet" && vehicle.offered_price && (
                      <div className="border-t pt-3 mt-3">
                        <div className="bg-success-subtle/50 p-3 rounded mb-3">
                          <p className="text-sm text-muted-foreground mb-1">{t("offeredPrice")}</p>
                          <p className="text-2xl font-bold text-success">{formatCurrency(vehicle.offered_price)}</p>
                          {vehicle.offer_terms && (
                            <p className="text-xs text-muted-foreground mt-2">{vehicle.offer_terms}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPendingAnswer({ vehicleId: vehicle.id, decision: "accept", price: vehicle.offered_price! })}
                            className="flex-1 px-3 py-2 bg-success text-primary-foreground text-sm rounded hover:bg-success-hover font-medium"
                          >
                            {t("acceptOffer")}
                          </button>
                          <button
                            onClick={() => setPendingAnswer({ vehicleId: vehicle.id, decision: "reject", price: vehicle.offered_price! })}
                            className="flex-1 px-3 py-2 border border-destructive-border text-destructive text-sm rounded hover:bg-destructive-subtle/50 font-medium"
                          >
                            {t("rejectOffer")}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* The customer declined our last offer; the vehicle is back with us for review */}
                    {(() => {
                      const declinedPrice = getDeclinedOfferPrice(vehicle);
                      return declinedPrice != null ? (
                        <div className="border-t pt-3 mt-3">
                          <div className="bg-warning-subtle/50 p-3 rounded">
                            <p className="text-sm font-semibold text-warning-subtle-foreground">
                              {t("youDeclinedOffer", { price: formatCurrency(declinedPrice) })}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{t("youDeclinedOfferNext")}</p>
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* Rejection reason entered by the admin (older rows keep it in status_reason) */}
                    {status === "abgelehnt" && (vehicle.rejection_reason || vehicle.status_reason) && (
                      <div className="border-t pt-3 mt-3">
                        <div className="bg-destructive-subtle/50 p-3 rounded">
                          <p className="text-sm font-semibold text-destructive">{t("rejectionReason")}</p>
                          <p className="text-sm text-foreground mt-1 whitespace-pre-line break-words">
                            {vehicle.rejection_reason || vehicle.status_reason}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Accepted/Rejected Status */}
                    {status === "akzeptiert" && (
                      <div className="border-t pt-3 mt-3 bg-success-subtle/50 p-3 rounded">
                        <p className="text-sm text-success"><span className="font-semibold">{t("offerAccepted")}</span></p>
                        {Number(vehicle.offered_price) > 0 && (
                          <>
                            <p className="text-sm text-muted-foreground mt-2">{t("acceptedPrice")}</p>
                            <p className="text-2xl font-bold text-success">{formatCurrency(Number(vehicle.offered_price))}</p>
                          </>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{t("contactUs")}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={pendingAnswer != null}
        title={pendingAnswer?.decision === "reject" ? t("rejectConfirm") : t("acceptConfirm")}
        description={
          pendingAnswer &&
          t(pendingAnswer.decision === "reject" ? "rejectConfirmText" : "acceptConfirmText", {
            price: formatCurrency(pendingAnswer.price),
          })
        }
        confirmLabel={pendingAnswer?.decision === "reject" ? t("rejectOffer") : t("acceptOffer")}
        cancelLabel={tButtons("cancel")}
        tone={pendingAnswer?.decision === "reject" ? "destructive" : "default"}
        busy={answering}
        onConfirm={handleConfirmAnswer}
        onCancel={() => setPendingAnswer(null)}
      />
    </div>
  );
}
