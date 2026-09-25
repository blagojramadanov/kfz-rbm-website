"use client";
import { useTranslations, useFormatter } from "next-intl";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Upload, X, GripVertical, Check } from "lucide-react";
import { useErrorMessage } from "@/lib/use-error-message";
import { getFuelTypeLabel, getTransmissionLabel, getBodyTypeLabel } from "@/lib/vehicle-labels";

type Step = "fahrzeugdaten" | "preis" | "bilder" | "beschreibung" | "verkaufsart" | "kontrolle" | "absenden";

const STEP_IDS: Step[] = ["fahrzeugdaten", "preis", "bilder", "beschreibung", "verkaufsart", "kontrolle", "absenden"];

// Limits for validation
const MAX_IMAGES = 20;
const DESCRIPTION_MIN_CHARS = 20;
const MAX_MILEAGE = 99999999;
const MAX_POWER = 99999;
const MAX_PRICE = 99999999.99;

interface VehicleData {
  // Fahrzeugdaten
  marke: string;
  modell: string;
  variante: string;
  erstzulassung: string;
  kilometerstand: string;
  kraftstoff: string;
  getriebe: string;
  leistung: string;
  karosserie: string;
  farbe: string;
  vorbesitzer: string;
  huAu: string;
  unfallhistorie: string;
  scheckheft: string;
  // Preis
  preisvorstellung: string;
  // Beschreibung
  beschreibung: string;
  // Verkaufsart
  verkaufsart: string;
}

interface UploadedImage {
  id: string;
  data: string; // base64 for new, URL for existing
  isMain: boolean;
  uploaded: boolean;
  dbId?: string; // database ID for existing images
}

export default function SubmitVehicleWizardPage() {
  const params = useParams();
  const locale = params.locale as string || 'de';
  const t = useTranslations("wizard");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const router = useRouter();
  const { loading, isAuthenticated, user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>("fahrzeugdaten");
  const [formData, setFormData] = useState<VehicleData>({
    marke: "",
    modell: "",
    variante: "",
    erstzulassung: "",
    kilometerstand: "",
    kraftstoff: "gasoline",
    getriebe: "manual",
    leistung: "",
    karosserie: "sedan",
    farbe: "",
    vorbesitzer: "1",
    huAu: "yes",
    unfallhistorie: "no",
    scheckheft: "yes",
    preisvorstellung: "",
    beschreibung: "",
    verkaufsart: "direct",
  });
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [saving, setSaving] = useState(false);
  const errorMessage = useErrorMessage();
  const [error, setError] = useState("");
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const loadDraftData = async () => {
      if (typeof window === "undefined" || !user) return;

      const params = new URLSearchParams(window.location.search);
      const vehicleId = params.get("edit");

      if (vehicleId) {
        try {
          const { getSubmittedVehicleById } = await import("@/app/actions/vehicles");
          const result = await getSubmittedVehicleById(vehicleId);
          if (!result.ok) {
            setError(errorMessage(result));
            return;
          }

          setEditingVehicleId(vehicleId);
          setFormData({
            marke: result.vehicle.brand || "",
            modell: result.vehicle.model || "",
            variante: "",
            erstzulassung: result.vehicle.year?.toString() || "",
            kilometerstand: result.vehicle.mileage?.toString() || "",
            kraftstoff: result.vehicle.fuel_type || "gasoline",
            getriebe: result.vehicle.transmission || "manual",
            leistung: result.vehicle.power_hp?.toString() || "",
            karosserie: result.vehicle.body_type || "sedan",
            farbe: result.vehicle.color || "",
            vorbesitzer: "",
            huAu: "yes",
            unfallhistorie: "no",
            scheckheft: "yes",
            preisvorstellung: result.vehicle.price?.toString() || "",
            beschreibung: result.vehicle.description || "",
            verkaufsart: result.vehicle.sales_type || "direct",
          });

          if (result.images && result.images.length > 0) {
            setImages(
              result.images.map((img: any) => ({
                id: img.id,
                data: img.image_url,
                isMain: img.is_main || false,
                uploaded: true,
                dbId: img.id,
              }))
            );
          }
        } catch (err) {
          setError(errorMessage(err));
          console.error(err);
        }
      }
    };

    loadDraftData();
  }, [user]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if image is larger than 1920px (for high-quality admin view)
          const maxDim = 1920;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress to JPEG with 0.85 quality for better image clarity
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > MAX_IMAGES) {
      setError(t("validation.imageLimitExceeded", { maxCount: MAX_IMAGES.toString() }));
      return;
    }

    for (const file of Array.from(files)) {
      try {
        const compressedBase64 = await compressImage(file);
        setImages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            data: compressedBase64,
            isMain: prev.length === 0,
            uploaded: false,
          },
        ]);
      } catch (error) {
        console.error("Error compressing image:", error);
        setError(t("validation.imageErrorCompressing"));
      }
    }
    e.target.value = "";
  };

  const setMainImage = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isMain: img.id === id,
      }))
    );
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setImages(newImages);
  };

  const handleDragStart = (_e: React.DragEvent, id: string) => {
    setDraggedImageId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedIndex = images.findIndex((img) => img.id === draggedImageId);
    const targetIndex = images.findIndex((img) => img.id === targetId);
    if (draggedIndex !== -1 && targetIndex !== -1) {
      moveImage(draggedIndex, targetIndex);
    }
    setDraggedImageId(null);
  };

  const validateStep = (): boolean => {
    setError("");
    switch (currentStep) {
      case "fahrzeugdaten":
        if (!formData.marke || !formData.modell || !formData.erstzulassung) {
          setError(t("validation.requiredFields"));
          return false;
        }

        // Validate year
        const year = parseInt(formData.erstzulassung);
        const currentYear = new Date().getFullYear();
        if (year < 1886 || year > currentYear + 1) {
          setError(t("validation.yearRange", { max: currentYear + 1 }));
          return false;
        }

        // Validate mileage
        const mileage = parseInt(formData.kilometerstand) || 0;
        if (mileage < 0 || mileage > MAX_MILEAGE) {
          setError(t("validation.mileageRange", { max: format.number(MAX_MILEAGE) }));
          return false;
        }

        // Validate power HP
        const power = parseInt(formData.leistung) || 0;
        if (power < 0 || power > MAX_POWER) {
          setError(t("validation.powerRange", { max: format.number(MAX_POWER) }));
          return false;
        }

        break;
      case "preis":
        if (!formData.preisvorstellung) {
          setError(t("validation.priceRequired"));
          return false;
        }

        // Validate price
        const price = parseFloat(formData.preisvorstellung);
        if (price <= 0) {
          setError(t("validation.pricePositive"));
          return false;
        }
        if (price > MAX_PRICE) {
          setError(t("validation.priceMax", { max: format.number(MAX_PRICE, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) }));
          return false;
        }

        break;
      case "bilder":
        if (images.length === 0) {
          setError(t("validation.imagesRequired"));
          return false;
        }
        break;
      case "beschreibung":
        if (!formData.beschreibung || formData.beschreibung.length < DESCRIPTION_MIN_CHARS) {
          setError(t("validation.descriptionMinLength", { min: DESCRIPTION_MIN_CHARS }));
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    const currentIndex = STEP_IDS.findIndex((s) => s === currentStep);
    if (currentIndex < STEP_IDS.length - 1) {
      setCurrentStep(STEP_IDS[currentIndex + 1]);
      setError("");
    }
  };

  const handlePrev = () => {
    const currentIndex = STEP_IDS.findIndex((s) => s === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEP_IDS[currentIndex - 1]);
      setError("");
    }
  };

  const handleSubmit = async () => {
    if (!validateStep() || !user) return;

    try {
      setSaving(true);
      console.log("\n========== FORM SUBMISSION INITIATED ==========");
      console.log(`[FORM] Total images in state: ${images.length}`);
      console.log(`[FORM] Images details:`, images.map((img) => ({
        id: img.id,
        dataLength: img.data.length,
        isBase64: img.data.startsWith("data:"),
        isMain: img.isMain,
        uploaded: img.uploaded,
      })));
      console.log(`[FORM] Editing vehicle ID: ${editingVehicleId || 'NEW'}`);

      const { createSubmittedVehicle } = await import("@/app/actions/vehicles");

      if (editingVehicleId) {
        // Direct submission only - no editing after submit
        setError(errorMessage("INVALID_STATE"));
        return;
      } else {
        // Create new vehicle as draft first (so images can be uploaded due to RLS policy)
        const imagesToPass = images.map((img) => img.data);
        console.log(`[FORM] About to call createSubmittedVehicle with ${imagesToPass.length} images`);
        console.log(`[FORM] Image data samples:`, imagesToPass.map((img, idx) => ({
          index: idx,
          length: img.length,
          prefix: img.substring(0, 50),
        })));

        const result = await createSubmittedVehicle(
          {
            brand: formData.marke,
            model: formData.modell,
            year: parseInt(formData.erstzulassung),
            mileage: parseInt(formData.kilometerstand) || 0,
            price: formData.preisvorstellung ? parseFloat(formData.preisvorstellung) : undefined,
            transmission: formData.getriebe,
            fuel_type: formData.kraftstoff,
            body_type: formData.karosserie,
            color: formData.farbe,
            power_hp: formData.leistung ? parseInt(formData.leistung) : undefined,
            description: formData.beschreibung,
            sales_type: formData.verkaufsart,
          },
          imagesToPass
        );
        if (!result.ok) {
          setError(errorMessage(result));
          return;
        }
      }

      // Redirect to success page
      router.push("/dashboard/fahrzeug-angeboten");
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const currentIndex = STEP_IDS.findIndex((s) => s === currentStep);
  const stepProgress = ((currentIndex + 1) / STEP_IDS.length) * 100;

  const stepLabels: Record<Step, string> = {
    fahrzeugdaten: t("steps.vehicleData"),
    preis: t("steps.price"),
    bilder: t("steps.images"),
    beschreibung: t("steps.description"),
    verkaufsart: t("steps.salesType"),
    kontrolle: t("steps.review"),
    absenden: t("steps.submit"),
  };

  const getSalesTypeLabel = (value: string) => {
    switch (value) {
      case "direct":
        return t("salesType.direct");
      case "tradeIn":
        return t("salesType.tradeIn");
      case "consignment":
        return t("salesType.consignment");
      default:
        return value;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-kfz-blue to-kfz-blue-dark text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/dashboard" className="text-blue-100 hover:text-white mb-2 inline-block text-sm">
            {t("dashboardLink")}
          </Link>
          <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
          <p className="text-blue-100">{t("stepIndicator", { current: currentIndex + 1, total: STEP_IDS.length })}</p>
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
            {STEP_IDS.map((stepId, index) => (
              <div key={stepId} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => setCurrentStep(stepId)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    index < currentIndex
                      ? "bg-green-500 text-white"
                      : index === currentIndex
                      ? "bg-kfz-blue text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {index < currentIndex ? <Check className="w-4 h-4" /> : index + 1}
                </button>
                {index < STEP_IDS.length - 1 && (
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
            <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Fahrzeugdaten */}
        {currentStep === "fahrzeugdaten" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("sections.vehicleInfo")}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.brandRequired")}</label>
                <input
                  type="text"
                  name="marke"
                  value={formData.marke}
                  onChange={handleInputChange}
                  placeholder={t("placeholders.brand")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.modelRequired")}</label>
                <input
                  type="text"
                  name="modell"
                  value={formData.modell}
                  onChange={handleInputChange}
                  placeholder={t("placeholders.model")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.variant")}</label>
                <input
                  type="text"
                  name="variante"
                  value={formData.variante}
                  onChange={handleInputChange}
                  placeholder={t("placeholders.variant")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.firstRegistrationRequired")}</label>
                <input
                  type="number"
                  name="erstzulassung"
                  value={formData.erstzulassung}
                  onChange={handleInputChange}
                  placeholder={t("placeholders.year")}
                  min="1990"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.mileage")}</label>
                <input
                  type="number"
                  name="kilometerstand"
                  value={formData.kilometerstand}
                  onChange={handleInputChange}
                  placeholder={t("placeholders.mileage")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.powerHp")}</label>
                <input
                  type="number"
                  name="leistung"
                  value={formData.leistung}
                  onChange={handleInputChange}
                  placeholder={t("placeholders.power")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.fuel")}</label>
                <select
                  name="kraftstoff"
                  value={formData.kraftstoff}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                >
                  <option value="gasoline">{t("options.fuel.gasoline")}</option>
                  <option value="diesel">{t("options.fuel.diesel")}</option>
                  <option value="hybrid">{t("options.fuel.hybrid")}</option>
                  <option value="electric">{t("options.fuel.electric")}</option>
                  <option value="lpg">{t("options.fuel.lpg")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.transmission")}</label>
                <select
                  name="getriebe"
                  value={formData.getriebe}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                >
                  <option value="manual">{t("options.transmission.manual")}</option>
                  <option value="automatic">{t("options.transmission.automatic")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.bodyType")}</label>
                <select
                  name="karosserie"
                  value={formData.karosserie}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                >
                  <option value="sedan">{t("options.bodyType.sedan")}</option>
                  <option value="suv">{t("options.bodyType.suv")}</option>
                  <option value="wagon">{t("options.bodyType.wagon")}</option>
                  <option value="coupe">{t("options.bodyType.coupe")}</option>
                  <option value="cabriolet">{t("options.bodyType.cabriolet")}</option>
                  <option value="smallCar">{t("options.bodyType.smallCar")}</option>
                  <option value="van">{t("options.bodyType.van")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.color")}</label>
                <input
                  type="text"
                  name="farbe"
                  value={formData.farbe}
                  onChange={handleInputChange}
                  placeholder={t("placeholders.color")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.previousOwners")}</label>
                <select
                  name="vorbesitzer"
                  value={formData.vorbesitzer}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                >
                  <option value="1">{t("options.previousOwners.one")}</option>
                  <option value="2">{t("options.previousOwners.two")}</option>
                  <option value="3">{t("options.previousOwners.three")}</option>
                  <option value="4+">{t("options.previousOwners.moreThanThree")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.huAu")}</label>
                <select
                  name="huAu"
                  value={formData.huAu}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                >
                  <option value="yes">{t("options.huAu.yes")}</option>
                  <option value="no">{t("options.huAu.no")}</option>
                  <option value="expired">{t("options.huAu.expired")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.accidentHistory")}</label>
                <select
                  name="unfallhistorie"
                  value={formData.unfallhistorie}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                >
                  <option value="no">{t("options.accidentHistory.no")}</option>
                  <option value="yes">{t("options.accidentHistory.yes")}</option>
                  <option value="unknown">{t("options.accidentHistory.unknown")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.serviceBook")}</label>
                <select
                  name="scheckheft"
                  value={formData.scheckheft}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                >
                  <option value="yes">{t("options.serviceBook.yes")}</option>
                  <option value="no">{t("options.serviceBook.no")}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Preis */}
        {currentStep === "preis" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("sections.priceExpectation")}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.priceLabel")}</label>
              <input
                type="number"
                name="preisvorstellung"
                value={formData.preisvorstellung}
                onChange={handleInputChange}
                placeholder={t("placeholders.price")}
                step="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent text-lg"
              />
            </div>
          </div>
        )}

        {/* Bilder */}
        {currentStep === "bilder" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("images.uploadCount", { current: images.length, max: MAX_IMAGES })}</h2>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-8 hover:border-kfz-blue transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={images.length >= MAX_IMAGES}
              />
              <label htmlFor="image-upload" className="cursor-pointer block">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-lg font-semibold text-gray-900">{t("images.uploadTitle")}</p>
                <p className="text-sm text-gray-600">{t("images.uploadSubtitle")}</p>
                {images.length >= MAX_IMAGES && <p className="text-sm text-red-600 mt-2">{t("images.uploadMaxReached")}</p>}
              </label>
            </div>

            {/* Images Grid */}
            {images.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("images.gridTitle")}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, image.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, image.id)}
                      className="relative group bg-gray-100 rounded-lg overflow-hidden cursor-move"
                    >
                      <div className="aspect-square relative">
                        <img
                          src={image.data}
                          alt={`Vehicle ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {image.isMain && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                            {t("images.mainBadge")}
                          </div>
                        )}
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        {!image.isMain && (
                          <button
                            onClick={() => setMainImage(image.id)}
                            className="bg-white text-gray-900 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
                          >
                            {t("images.setMain")}
                          </button>
                        )}
                      </div>

                      {/* Drag Handle */}
                      <div className="absolute bottom-2 right-2 bg-gray-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Beschreibung */}
        {currentStep === "beschreibung" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("sections.vehicleDescription")}</h2>
            <textarea
              name="beschreibung"
              value={formData.beschreibung}
              onChange={handleInputChange}
              placeholder={t("description.placeholder")}
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
            />
            <p className="text-sm text-gray-600 mt-2">{t("description.minCharsNote", { min: DESCRIPTION_MIN_CHARS })}</p>
          </div>
        )}

        {/* Verkaufsart */}
        {currentStep === "verkaufsart" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("sections.salesTypeSelection")}</h2>
            <p className="text-gray-600 mb-8">{t("salesType.subtitle")}</p>

            <div className="space-y-4">
              {/* Direktverkauf */}
              <label className={`flex items-start p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.verkaufsart === "direct"
                  ? "border-kfz-blue bg-blue-50"
                  : "border-gray-300 hover:bg-gray-50"
              }`}>
                <input
                  type="radio"
                  name="verkaufsart"
                  value="direct"
                  checked={formData.verkaufsart === "direct"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-kfz-blue mt-1 flex-shrink-0"
                />
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-gray-900">{t("salesType.direct")}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {t("salesType.directDesc")}
                  </p>
                </div>
              </label>

              {/* Inzahlungnahme */}
              <label className={`flex items-start p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.verkaufsart === "tradeIn"
                  ? "border-kfz-blue bg-blue-50"
                  : "border-gray-300 hover:bg-gray-50"
              }`}>
                <input
                  type="radio"
                  name="verkaufsart"
                  value="tradeIn"
                  checked={formData.verkaufsart === "tradeIn"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-kfz-blue mt-1 flex-shrink-0"
                />
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-gray-900">{t("salesType.tradeIn")}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {t("salesType.tradeInDesc")}
                  </p>
                </div>
              </label>

              {/* Verkauf im Kundenauftrag */}
              <label className={`flex items-start p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.verkaufsart === "consignment"
                  ? "border-kfz-blue bg-blue-50"
                  : "border-gray-300 hover:bg-gray-50"
              }`}>
                <input
                  type="radio"
                  name="verkaufsart"
                  value="consignment"
                  checked={formData.verkaufsart === "consignment"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-kfz-blue mt-1 flex-shrink-0"
                />
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-gray-900">{t("salesType.consignment")}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {t("salesType.consignmentDesc")}
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Kontrolle */}
        {currentStep === "kontrolle" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("review.title")}</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{t("review.vehicleInfo")}</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <p><span className="font-medium">{t("fields.brand")}:</span> {formData.marke}</p>
                  <p><span className="font-medium">{t("fields.model")}:</span> {formData.modell}</p>
                  <p><span className="font-medium">{t("fields.firstRegistration")}:</span> {formData.erstzulassung}</p>
                  <p><span className="font-medium">{t("fields.mileage")}:</span> {t("units.mileage", { value: format.number(parseInt(formData.kilometerstand) || 0) })}</p>
                  <p><span className="font-medium">{t("fields.powerHp")}:</span> {t("units.power", { value: format.number(parseInt(formData.leistung) || 0) })}</p>
                  <p><span className="font-medium">{t("fields.fuel")}:</span> {getFuelTypeLabel(tCommon, formData.kraftstoff)}</p>
                  <p><span className="font-medium">{t("fields.transmission")}:</span> {getTransmissionLabel(tCommon, formData.getriebe)}</p>
                  <p><span className="font-medium">{t("fields.bodyType")}:</span> {getBodyTypeLabel(tCommon, formData.karosserie)}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{t("review.priceSection")}</h3>
                <p className="text-2xl font-bold text-kfz-blue">{format.number(parseFloat(formData.preisvorstellung) || 0, { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{t("review.imagesSection")}</h3>
                <p className="text-gray-600">{t("review.imagesCount", { count: images.length })}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{t("review.descriptionSection")}</h3>
                <p className="text-gray-600 line-clamp-3">{formData.beschreibung}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{t("review.salesTypeSection")}</h3>
                <p className="text-gray-600">{getSalesTypeLabel(formData.verkaufsart)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Absenden */}
        {currentStep === "absenden" && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("final.title")}</h2>
            <p className="text-gray-600 mb-8">
              {t("final.message")}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-4 justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="border-gray-300"
          >
            <ChevronLeft className="mr-2 w-4 h-4" />
            {t("buttons.back")}
          </Button>

          {currentStep !== "absenden" ? (
            <Button
              onClick={handleNext}
              className="bg-kfz-blue hover:bg-kfz-blue-dark text-white"
            >
              {t("buttons.next")}
              <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? t("buttons.submitting") : t("buttons.submit")}
              <Check className="ml-2 w-4 h-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
