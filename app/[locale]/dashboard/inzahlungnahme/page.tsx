"use client";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, AlertCircle, Check } from "lucide-react";
import type { Vehicle } from "@/lib/supabase";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { PageHeader } from "@/components/page-header";

type Step = "current_vehicle" | "vehicle_value" | "select_desired" | "review" | "success";

// STEPS labels will be dynamically generated with useTranslations

interface TradeInForm {
  current_vehicle_brand: string;
  current_vehicle_model: string;
  current_vehicle_year: string;
  current_vehicle_mileage: string;
  current_vehicle_value_estimate: string;
  desired_vehicle_id: string;
}

export default function InzahlungnahmePage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("dashboard.tradeIn");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");
  const formatter = useLocaleFormatter();
  const { loading, isAuthenticated, user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>("current_vehicle");

  const formatCurrency = (value: number) => {
    return formatter.number(value, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Create STEPS array dynamically with translations
  const STEPS: { id: Step; label: string }[] = [
    { id: "current_vehicle", label: t("steps.current_vehicle") },
    { id: "vehicle_value", label: t("steps.vehicle_value") },
    { id: "select_desired", label: t("steps.select_desired") },
    { id: "review", label: t("steps.review") },
    { id: "success", label: t("steps.success") },
  ];

  const [formData, setFormData] = useState<TradeInForm>({
    current_vehicle_brand: "",
    current_vehicle_model: "",
    current_vehicle_year: new Date().getFullYear().toString(),
    current_vehicle_mileage: "",
    current_vehicle_value_estimate: "",
    desired_vehicle_id: "",
  });

  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [desiredVehicle, setDesiredVehicle] = useState<Vehicle | null>(null);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const errorMessage = useErrorMessage();
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState<string>("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const { getAvailableVehicles } = await import("@/app/actions/trade-in");
        const result = await getAvailableVehicles();
        if (!result.ok) {
          setError(errorMessage(result));
          return;
        }
        setAvailableVehicles(result.vehicles);
      } catch (err) {
        console.error("Error loading vehicles:", err);
        setError(errorMessage(err));
      } finally {
        setVehiclesLoading(false);
      }
    };

    loadVehicles();
  }, []);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVehicleSelect = (vehicleId: string) => {
    setFormData((prev) => ({
      ...prev,
      desired_vehicle_id: vehicleId,
    }));
    const selected = availableVehicles.find((v) => v.id === vehicleId);
    setDesiredVehicle(selected || null);
  };

  const validateStep = (): boolean => {
    setError("");
    switch (currentStep) {
      case "current_vehicle":
        if (!formData.current_vehicle_brand || !formData.current_vehicle_model || !formData.current_vehicle_year) {
          setError(t("validation.brandRequired"));
          return false;
        }
        break;
      case "vehicle_value":
        if (!formData.current_vehicle_value_estimate) {
          setError(t("validation.valueRequired"));
          return false;
        }
        break;
      case "select_desired":
        if (!formData.desired_vehicle_id) {
          setError(t("validation.vehicleRequired"));
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
      setError("");
    }
  };

  const handlePrev = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
      setError("");
    }
  };

  const handleSubmit = async () => {
    if (!validateStep() || !user) return;

    try {
      setSaving(true);
      const { createTradeInRequest } = await import("@/app/actions/trade-in");

      const result = await createTradeInRequest({
        current_vehicle_brand: formData.current_vehicle_brand,
        current_vehicle_model: formData.current_vehicle_model,
        current_vehicle_year: parseInt(formData.current_vehicle_year),
        current_vehicle_mileage: parseInt(formData.current_vehicle_mileage) || 0,
        current_vehicle_value_estimate: parseFloat(formData.current_vehicle_value_estimate),
        desired_vehicle_id: formData.desired_vehicle_id,
      });

      if (!result.ok) {
        setError(errorMessage(result));
        return;
      }

      setSuccessId(result.requestId);
      setCurrentStep("success");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
  const stepProgress = ((currentIndex + 1) / STEPS.length) * 100;

  const estimatedDifference = desiredVehicle && formData.current_vehicle_value_estimate
    ? parseFloat(formData.current_vehicle_value_estimate) - (desiredVehicle.price || 0)
    : null;

  return (
    <div className="min-h-screen bg-muted">
      <PageHeader
        title={t("title")}
        description={t("stepProgress", { current: currentIndex + 1, total: STEPS.length })}
        backHref="/dashboard"
        backLabel={tNav("dashboard")}
        width="narrow"
      />

      {/* Progress Bar */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${stepProgress}%` }}
            ></div>
          </div>
          {/* Steps share the width (flexible connectors), so all fit at 360px */}
          <ol className="flex items-center mt-4">
            {STEPS.map((step, index) => (
              <li key={step.id} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  disabled={index > currentIndex}
                  className={`relative w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-colors after:absolute after:-inset-1.5 after:content-[""] ${
                    index < currentIndex
                      ? "bg-success text-primary-foreground"
                      : index === currentIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-input text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  {index < currentIndex ? <Check className="w-4 h-4" /> : index + 1}
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 min-w-2 h-0.5 mx-1 transition-colors ${
                      index < currentIndex ? "bg-success" : "bg-input"
                    }`}
                  ></div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Content */}
      <main className="page-container-narrow">
        {error && (
          <div className="bg-destructive-subtle/50 border border-destructive-border rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive-subtle-foreground">{error}</p>
          </div>
        )}

        {/* Current Vehicle */}
        {currentStep === "current_vehicle" && (
          <div className="card p-6 sm:p-8">
            <h2 className="section-title mb-6">{t("currentVehicle.title")}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("currentVehicle.brand")} *</label>
                <input
                  type="text"
                  name="current_vehicle_brand"
                  value={formData.current_vehicle_brand}
                  onChange={handleInputChange}
                  placeholder={t("currentVehicle.brandPlaceholder")}
                  className="field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("currentVehicle.model")} *</label>
                <input
                  type="text"
                  name="current_vehicle_model"
                  value={formData.current_vehicle_model}
                  onChange={handleInputChange}
                  placeholder={t("currentVehicle.modelPlaceholder")}
                  className="field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("currentVehicle.year")} *</label>
                <input
                  type="number"
                  inputMode="numeric"
                  name="current_vehicle_year"
                  value={formData.current_vehicle_year}
                  onChange={handleInputChange}
                  min="1990"
                  max={new Date().getFullYear()}
                  className="field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("currentVehicle.mileage")}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  name="current_vehicle_mileage"
                  value={formData.current_vehicle_mileage}
                  onChange={handleInputChange}
                  placeholder={formatter.number(50000)}
                  className="field"
                />
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Value */}
        {currentStep === "vehicle_value" && (
          <div className="card p-6 sm:p-8">
            <h2 className="section-title mb-2">{t("vehicleValue.title")}</h2>
            <p className="text-muted-foreground mb-8">
              {t("vehicleValue.description")}
            </p>
            <div className="max-w-md">
              <label className="block text-sm font-medium text-foreground mb-2">{t("vehicleValue.label")} *</label>
              <input
                type="number"
                inputMode="numeric"
                name="current_vehicle_value_estimate"
                value={formData.current_vehicle_value_estimate}
                onChange={handleInputChange}
                placeholder={formatter.number(50000)}
                step="100"
                className="field text-lg"
              />
            </div>
          </div>
        )}

        {/* Select Desired Vehicle */}
        {currentStep === "select_desired" && (
          <div className="card p-6 sm:p-8">
            <h2 className="section-title mb-6">{t("selectDesired.title")}</h2>
            <p className="text-muted-foreground mb-6">{t("selectDesired.description")}</p>

            {vehiclesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">{t("selectDesired.loading")}</p>
              </div>
            ) : availableVehicles.length === 0 ? (
              <p className="text-muted-foreground">{t("selectDesired.empty")}</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {availableVehicles.map((vehicle) => (
                  <label
                    key={vehicle.id}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.desired_vehicle_id === vehicle.id
                        ? "border-primary bg-info-subtle/50"
                        : "border-input hover:bg-muted"
                    }`}
                  >
                    <input
                      type="radio"
                      name="desired_vehicle_id"
                      value={vehicle.id}
                      checked={formData.desired_vehicle_id === vehicle.id}
                      onChange={(e) => handleVehicleSelect(e.target.value)}
                      className="w-4 h-4 text-primary mt-1 flex-shrink-0"
                    />
                    <div className="ml-4 flex-1">
                      <p className="font-semibold text-foreground">
                        {vehicle.year} {vehicle.brand} {vehicle.model}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatter.number(vehicle.mileage || 0)} km
                      </p>
                      <p className="text-lg font-bold text-primary mt-2">
                        {formatCurrency(vehicle.price || 0)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Review */}
        {currentStep === "review" && (
          <div className="card p-6 sm:p-8">
            <h2 className="section-title mb-6">{t("review.title")}</h2>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-3">{t("review.yourVehicle")}</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">{t("review.brand")}</span>{" "}
                      <span className="font-medium">{formData.current_vehicle_brand}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">{t("review.model")}</span>{" "}
                      <span className="font-medium">{formData.current_vehicle_model}</span>
                    </p>
                    <p>
                      <span className="text-muted-foreground">{t("review.year")}</span>{" "}
                      <span className="font-medium">{formData.current_vehicle_year}</span>
                    </p>
                    {formData.current_vehicle_mileage && (
                      <p>
                        <span className="text-muted-foreground">{t("review.mileage")}</span>{" "}
                        <span className="font-medium">
                          {formatter.number(parseInt(formData.current_vehicle_mileage))} km
                        </span>
                      </p>
                    )}
                    <p className="mt-2">
                      <span className="text-muted-foreground">{t("review.estimatedValue")}</span>{" "}
                      <span className="font-bold text-lg">
                        {formatCurrency(parseFloat(formData.current_vehicle_value_estimate))}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3">{t("review.desiredVehicle")}</h3>
                  {desiredVehicle && (
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">{t("review.vehicle")}</span>{" "}
                        <span className="font-medium">
                          {desiredVehicle.year} {desiredVehicle.brand} {desiredVehicle.model}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">{t("review.mileage")}</span>{" "}
                        <span className="font-medium">
                          {formatter.number(desiredVehicle.mileage || 0)} km
                        </span>
                      </p>
                      <p className="mt-2">
                        <span className="text-muted-foreground">{t("review.price")}</span>{" "}
                        <span className="font-bold text-lg text-primary">
                          {formatCurrency(desiredVehicle.price || 0)}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Estimated Price Difference */}
              <div className="bg-info-subtle/50 border border-info-border rounded-lg p-6">
                <h3 className="font-semibold text-foreground mb-4">{t("review.priceEstimate")}</h3>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">{t("review.yourEstimate")}</span>
                    <span className="font-bold">
                      {formatCurrency(parseFloat(formData.current_vehicle_value_estimate))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-muted-foreground">{t("review.desiredPrice")}</span>
                    <span className="font-bold">
                      {formatCurrency(desiredVehicle?.price || 0)}
                    </span>
                  </div>
                  <div className="border-t border-info-border pt-4 flex justify-between items-center">
                    <span className="font-semibold text-foreground">{t("review.difference")}</span>
                    <span
                      className={`text-2xl font-bold ${
                        estimatedDifference !== null && estimatedDifference > 0
                          ? "text-destructive"
                          : "text-success"
                      }`}
                    >
                      {estimatedDifference !== null
                        ? `${estimatedDifference > 0 ? "+" : ""}${formatCurrency(Math.abs(estimatedDifference))}`
                        : formatCurrency(0)}
                    </span>
                  </div>
                </div>

                <div className="bg-card rounded p-4 border border-info-border">
                  <p className="text-xs text-muted-foreground italic">
                    {t("review.importantNote")} <strong>{t("review.importantNoteText")}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success */}
        {currentStep === "success" && (
          <div className="card p-6 sm:p-8 text-center">
            <Check className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="section-title mb-4">{t("success.title")}</h2>
            <p className="text-muted-foreground mb-4">
              {t("success.description")}
            </p>
            <p className="text-sm text-muted-foreground mb-8">{t("success.requestId")} {successId}</p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => router.push("/dashboard")}

              >
                {t("success.toDashboard")}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/inzahlungnahme-anfragen")}

              >
                {t("success.viewRequests")}
              </Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {currentStep !== "success" && (
          <div className="flex gap-4 justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentIndex === 0}

            >
              <ChevronLeft className="mr-2 w-4 h-4" />
              {t("buttons.back")}
            </Button>

            {currentStep !== "review" ? (
              <Button
                onClick={handleNext}

              >
                {t("buttons.next")}
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button variant="success"
                onClick={handleSubmit}
                disabled={saving}

              >
                {saving ? t("buttons.submitting") : t("buttons.submit")}
                <Check className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
