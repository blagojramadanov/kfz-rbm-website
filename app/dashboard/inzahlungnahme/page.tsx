"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, AlertCircle, Check } from "lucide-react";
import Link from "next/link";
import type { Vehicle } from "@/lib/supabase";

type Step = "current_vehicle" | "vehicle_value" | "select_desired" | "review" | "success";

const STEPS: { id: Step; label: string }[] = [
  { id: "current_vehicle", label: "Aktuelles Fahrzeug" },
  { id: "vehicle_value", label: "Fahrzeugwert" },
  { id: "select_desired", label: "Gewünschtes Fahrzeug" },
  { id: "review", label: "Überprüfung" },
  { id: "success", label: "Erfolg" },
];

interface TradeInForm {
  current_vehicle_brand: string;
  current_vehicle_model: string;
  current_vehicle_year: string;
  current_vehicle_mileage: string;
  current_vehicle_value_estimate: string;
  desired_vehicle_id: string;
}

export default function InzahlungnahmePage() {
  const router = useRouter();
  const { loading, isAuthenticated, user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>("current_vehicle");
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
        const vehicles = await getAvailableVehicles();
        setAvailableVehicles(vehicles);
      } catch (err) {
        console.error("Error loading vehicles:", err);
        setError("Fehler beim Laden der verfügbaren Fahrzeuge");
      } finally {
        setVehiclesLoading(false);
      }
    };

    loadVehicles();
  }, []);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Wird geladen...</p>
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
          setError("Bitte füllen Sie Marke, Modell und Jahr aus");
          return false;
        }
        break;
      case "vehicle_value":
        if (!formData.current_vehicle_value_estimate) {
          setError("Bitte geben Sie einen geschätzten Fahrzeugwert ein");
          return false;
        }
        break;
      case "select_desired":
        if (!formData.desired_vehicle_id) {
          setError("Bitte wählen Sie ein gewünschtes Fahrzeug aus");
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

      const result = await createTradeInRequest(user.id, {
        current_vehicle_brand: formData.current_vehicle_brand,
        current_vehicle_model: formData.current_vehicle_model,
        current_vehicle_year: parseInt(formData.current_vehicle_year),
        current_vehicle_mileage: parseInt(formData.current_vehicle_mileage) || 0,
        current_vehicle_value_estimate: parseFloat(formData.current_vehicle_value_estimate),
        desired_vehicle_id: formData.desired_vehicle_id,
      });

      setSuccessId(result.requestId);
      setCurrentStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Absenden der Anfrage");
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-kfz-blue to-kfz-blue-dark text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/dashboard" className="text-blue-100 hover:text-white mb-2 inline-block text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Inzahlungnahme</h1>
          <p className="text-blue-100">Schritt {currentIndex + 1} von {STEPS.length}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-kfz-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${stepProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-4 overflow-x-auto">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  disabled={index > currentIndex}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    index < currentIndex
                      ? "bg-green-500 text-white"
                      : index === currentIndex
                      ? "bg-kfz-blue text-white"
                      : "bg-gray-300 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  {index < currentIndex ? <Check className="w-4 h-4" /> : index + 1}
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-1 transition-colors ${
                      index < currentIndex ? "bg-green-500" : "bg-gray-300"
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Current Vehicle */}
        {currentStep === "current_vehicle" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ihr aktuelles Fahrzeug</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marke *</label>
                <input
                  type="text"
                  name="current_vehicle_brand"
                  value={formData.current_vehicle_brand}
                  onChange={handleInputChange}
                  placeholder="z.B. BMW, Mercedes"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modell *</label>
                <input
                  type="text"
                  name="current_vehicle_model"
                  value={formData.current_vehicle_model}
                  onChange={handleInputChange}
                  placeholder="z.B. 330i, C-Class"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Erstzulassung *</label>
                <input
                  type="number"
                  name="current_vehicle_year"
                  value={formData.current_vehicle_year}
                  onChange={handleInputChange}
                  min="1990"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kilometerstand</label>
                <input
                  type="number"
                  name="current_vehicle_mileage"
                  value={formData.current_vehicle_mileage}
                  onChange={handleInputChange}
                  placeholder="50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Value */}
        {currentStep === "vehicle_value" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Fahrzeugwert</h2>
            <p className="text-gray-600 mb-8">
              Schätzen Sie den aktuellen Wert Ihres Fahrzeugs. Dies ist eine unverbindliche Schätzung.
            </p>
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">Geschätzter Wert (€) *</label>
              <input
                type="number"
                name="current_vehicle_value_estimate"
                value={formData.current_vehicle_value_estimate}
                onChange={handleInputChange}
                placeholder="50000"
                step="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent text-lg"
              />
            </div>
          </div>
        )}

        {/* Select Desired Vehicle */}
        {currentStep === "select_desired" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Gewünschtes Fahrzeug</h2>
            <p className="text-gray-600 mb-6">Wählen Sie das Fahrzeug aus, das Sie kaufen möchten:</p>

            {vehiclesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto"></div>
                <p className="text-gray-600 mt-4">Fahrzeuge werden geladen...</p>
              </div>
            ) : availableVehicles.length === 0 ? (
              <p className="text-gray-600">Keine verfügbaren Fahrzeuge vorhanden.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {availableVehicles.map((vehicle) => (
                  <label
                    key={vehicle.id}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.desired_vehicle_id === vehicle.id
                        ? "border-kfz-blue bg-blue-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="desired_vehicle_id"
                      value={vehicle.id}
                      checked={formData.desired_vehicle_id === vehicle.id}
                      onChange={(e) => handleVehicleSelect(e.target.value)}
                      className="w-4 h-4 text-kfz-blue mt-1 flex-shrink-0"
                    />
                    <div className="ml-4 flex-1">
                      <p className="font-semibold text-gray-900">
                        {vehicle.year} {vehicle.brand} {vehicle.model}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {vehicle.mileage?.toLocaleString("de-DE")} km
                      </p>
                      <p className="text-lg font-bold text-kfz-blue mt-2">
                        € {vehicle.price?.toLocaleString("de-DE")}
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
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Überprüfung</h2>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Ihr Fahrzeug</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-gray-600">Marke:</span>{" "}
                      <span className="font-medium">{formData.current_vehicle_brand}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">Modell:</span>{" "}
                      <span className="font-medium">{formData.current_vehicle_model}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">Jahr:</span>{" "}
                      <span className="font-medium">{formData.current_vehicle_year}</span>
                    </p>
                    {formData.current_vehicle_mileage && (
                      <p>
                        <span className="text-gray-600">Kilometer:</span>{" "}
                        <span className="font-medium">
                          {parseInt(formData.current_vehicle_mileage).toLocaleString("de-DE")} km
                        </span>
                      </p>
                    )}
                    <p className="mt-2">
                      <span className="text-gray-600">Geschätzter Wert:</span>{" "}
                      <span className="font-bold text-lg">
                        € {parseFloat(formData.current_vehicle_value_estimate).toLocaleString("de-DE")}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Gewünschtes Fahrzeug</h3>
                  {desiredVehicle && (
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-gray-600">Fahrzeug:</span>{" "}
                        <span className="font-medium">
                          {desiredVehicle.year} {desiredVehicle.brand} {desiredVehicle.model}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-600">Kilometer:</span>{" "}
                        <span className="font-medium">
                          {desiredVehicle.mileage?.toLocaleString("de-DE")} km
                        </span>
                      </p>
                      <p className="mt-2">
                        <span className="text-gray-600">Preis:</span>{" "}
                        <span className="font-bold text-lg text-kfz-blue">
                          € {desiredVehicle.price?.toLocaleString("de-DE")}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Estimated Price Difference */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Unverbindliche Preisschätzung</h3>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Geschätzter Wert Ihres Fahrzeugs:</span>
                    <span className="font-bold">
                      € {parseFloat(formData.current_vehicle_value_estimate).toLocaleString("de-DE")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600">Preis des gewünschten Fahrzeugs:</span>
                    <span className="font-bold">
                      € {desiredVehicle?.price?.toLocaleString("de-DE")}
                    </span>
                  </div>
                  <div className="border-t border-blue-300 pt-4 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Geschätzte Zuzahlung/Gutschrift:</span>
                    <span
                      className={`text-2xl font-bold ${
                        estimatedDifference !== null && estimatedDifference > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {estimatedDifference !== null
                        ? `${estimatedDifference > 0 ? "+" : ""}€ ${Math.abs(estimatedDifference).toLocaleString("de-DE")}`
                        : "€ 0"}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded p-4 border border-blue-200">
                  <p className="text-xs text-gray-600 italic">
                    ⓘ <strong>Wichtig:</strong> Die endgültige Fahrzeugbewertung und Zuzahlung wird individuell durch
                    KFZ RBM festgelegt.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success */}
        {currentStep === "success" && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Anfrage erfolgreich eingereicht!</h2>
            <p className="text-gray-600 mb-4">
              Ihre Inzahlungnahmeanfrage wurde erfolgreich eingereicht. Unsere Experten werden Ihre Anfrage prüfen und
              sich in Kürze mit Ihnen in Verbindung setzen.
            </p>
            <p className="text-sm text-gray-500 mb-8">Anfrage-ID: {successId}</p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => router.push("/dashboard")}
                className="bg-kfz-blue hover:bg-kfz-blue-dark text-white"
              >
                Zum Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/inzahlungnahme-anfragen")}
                className="border-gray-300"
              >
                Anfragen ansehen
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
              className="border-gray-300"
            >
              <ChevronLeft className="mr-2 w-4 h-4" />
              Zurück
            </Button>

            {currentStep !== "review" ? (
              <Button
                onClick={handleNext}
                className="bg-kfz-blue hover:bg-kfz-blue-dark text-white"
              >
                Weiter
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saving ? "Wird eingereicht..." : "Anfrage einreichen"}
                <Check className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
