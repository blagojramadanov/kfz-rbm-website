"use client";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Upload, X, GripVertical, Check } from "lucide-react";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { getFuelTypeLabel, getTransmissionLabel, getBodyTypeLabel } from "@/lib/vehicle-labels";
import { SubmissionWorkflowInfo } from "@/components/submission-workflow-info";
import { getSubmissionDetails } from "@/lib/submission-details";
import { PageHeader } from "@/components/page-header";
import { SITE_IMAGES } from "@/lib/site-images";
import { SalesTypeLabel } from "@/components/sales-type-label";
import { CONCEPT_ICONS } from "@/lib/concept-icons";

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
  /** Resized photo as a data URL; photos are only uploaded on submit. */
  data: string;
  isMain: boolean;
}

export default function SubmitVehicleWizardPage() {
  const params = useParams();
  const locale = params.locale as string || 'de';
  const t = useTranslations("wizard");
  const tCommon = useTranslations("common");
  const tImg = useTranslations("siteImages");
  const format = useLocaleFormatter();
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
  // Set when the vehicle was submitted but some photos could not be stored.
  const [partialUpload, setPartialUpload] = useState<{ vehicleId: string; failedIndexes: number[] } | null>(null);
  const [retryingPhotos, setRetryingPhotos] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("loading")}</p>
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

  // Photos only live in the browser until the vehicle is submitted, so removing one
  // before submit leaves nothing behind in storage.
  const removeImage = (id: string) => {
    setImages((prev) => {
      const remaining = prev.filter((img) => img.id !== id);
      // Keep a main photo when the main one is removed.
      if (remaining.length > 0 && !remaining.some((img) => img.isMain)) {
        remaining[0] = { ...remaining[0], isMain: true };
      }
      return remaining;
    });
    setError("");
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

  /**
   * Uploads the given wizard photos one per request (all photos in one request exceed
   * the server action body limit) and returns the indexes that could not be stored.
   */
  const uploadPhotos = async (vehicleId: string, indexes: number[]): Promise<number[]> => {
    const { uploadSubmissionImages } = await import("@/app/actions/vehicles");
    const failed: number[] = [];
    for (const index of indexes) {
      try {
        const result = await uploadSubmissionImages(vehicleId, [{ data: images[index].data }]);
        if (!result.ok || result.failedIndexes.length > 0) failed.push(index);
      } catch (err) {
        console.error("Error uploading photo:", err);
        failed.push(index);
      }
    }
    return failed;
  };

  const handleSubmit = async () => {
    if (!validateStep() || !user) return;

    try {
      setSaving(true);

      const { createSubmittedVehicle } = await import("@/app/actions/vehicles");

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
          variant: formData.variante.trim() || undefined,
          previous_owners: formData.vorbesitzer,
          hu_au: formData.huAu,
          accident_history: formData.unfallhistorie,
          service_book: formData.scheckheft,
        }
      );
      if (!result.ok) {
        setError(errorMessage(result));
        return;
      }
      const failedIndexes = await uploadPhotos(result.vehicleId, images.map((_, index) => index));
      if (failedIndexes.length > 0) {
        // The vehicle exists; offer to retry only the photos that were not stored.
        setPartialUpload({ vehicleId: result.vehicleId, failedIndexes });
        return;
      }

      // Redirect to success page
      router.push("/dashboard/fahrzeug-angeboten");
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleRetryPhotos = async () => {
    if (!partialUpload) return;
    try {
      setRetryingPhotos(true);
      setError("");
      const stillFailed = await uploadPhotos(partialUpload.vehicleId, partialUpload.failedIndexes);
      if (stillFailed.length === 0) {
        router.push("/dashboard/fahrzeug-angeboten");
      } else {
        setPartialUpload({ ...partialUpload, failedIndexes: stillFailed });
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setRetryingPhotos(false);
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
    <div className="min-h-screen bg-muted">
      <PageHeader
        title={t("title")}
        description={t("stepIndicator", { current: currentIndex + 1, total: STEP_IDS.length })}
        backHref="/dashboard"
        backLabel={t("dashboardLink")}
        width="narrow"
        image={SITE_IMAGES.sellCar}
        imageAlt={tImg("sellCar")}
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
            {STEP_IDS.map((stepId, index) => (
              <li key={stepId} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => setCurrentStep(stepId)}
                  className={`relative w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm transition-colors after:absolute after:-inset-1.5 after:content-[""] ${
                    index < currentIndex
                      ? "bg-success text-primary-foreground"
                      : index === currentIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-input text-muted-foreground"
                  }`}
                >
                  {index < currentIndex ? <Check className="w-4 h-4" /> : index + 1}
                </button>
                {index < STEP_IDS.length - 1 && (
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
            <X className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive-subtle-foreground">{error}</p>
          </div>
        )}

        {/* Fahrzeugdaten */}
        {currentStep === "fahrzeugdaten" && (
          <div className="card p-6 sm:p-8">
            <h2 className="section-title mb-6">{t("sections.vehicleInfo")}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("fields.brandRequired")}</label>
                <input
                  type="text"
                  name="marke"
                  value={formData.marke}
                  onChange={handleInputChange}
                  placeholder={t("placeholders.brand")}
                  className="field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("fields.modelRequired")}</label>
                <input
                  type="text"
                  name="modell"
                  value={formData.modell}
                  onChange={handleInputChange}
                  placeholder={t("placeholders.model")}
                  className="field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("fields.variant")}</label>
                <input
                  type="text"
                  name="variante"
                  value={formData.variante}
                  onChange={handleInputChange}
                  placeholder={t("placeholders.variant")}
                  className="field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("fields.firstRegistrationRequired")}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  name="erstzulassung"
                  value={formData.erstzulassung}
                  onChange={handleInputChange}
                  placeholder={t("placeholders.year")}
                  min="1990"
                  max={new Date().getFullYear()}
                  className="field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("fields.mileage")}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  name="kilometerstand"
                  value={formData.kilometerstand}
                  onChange={handleInputChange}
                  placeholder={t("placeholders.mileage")}
                  className="field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("fields.powerHp")}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  name="leistung"
                  value={formData.leistung}
                  onChange={handleInputChange}
                  placeholder={t("placeholders.power")}
                  className="field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("fields.fuel")}</label>
                <select
                  name="kraftstoff"
                  value={formData.kraftstoff}
                  onChange={handleInputChange}
                  className="field"
                >
                  <option value="gasoline">{getFuelTypeLabel(tCommon, "gasoline")}</option>
                  <option value="diesel">{getFuelTypeLabel(tCommon, "diesel")}</option>
                  <option value="hybrid">{getFuelTypeLabel(tCommon, "hybrid")}</option>
                  <option value="electric">{getFuelTypeLabel(tCommon, "electric")}</option>
                  <option value="lpg">{getFuelTypeLabel(tCommon, "lpg")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("fields.transmission")}</label>
                <select
                  name="getriebe"
                  value={formData.getriebe}
                  onChange={handleInputChange}
                  className="field"
                >
                  <option value="manual">{getTransmissionLabel(tCommon, "manual")}</option>
                  <option value="automatic">{getTransmissionLabel(tCommon, "automatic")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("fields.bodyType")}</label>
                <select
                  name="karosserie"
                  value={formData.karosserie}
                  onChange={handleInputChange}
                  className="field"
                >
                  <option value="sedan">{getBodyTypeLabel(tCommon, "sedan")}</option>
                  <option value="suv">{getBodyTypeLabel(tCommon, "suv")}</option>
                  <option value="wagon">{getBodyTypeLabel(tCommon, "wagon")}</option>
                  <option value="coupe">{getBodyTypeLabel(tCommon, "coupe")}</option>
                  <option value="cabriolet">{getBodyTypeLabel(tCommon, "cabriolet")}</option>
                  <option value="smallCar">{getBodyTypeLabel(tCommon, "smallCar")}</option>
                  <option value="van">{getBodyTypeLabel(tCommon, "van")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("fields.color")}</label>
                <input
                  type="text"
                  name="farbe"
                  value={formData.farbe}
                  onChange={handleInputChange}
                  placeholder={t("placeholders.color")}
                  className="field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("fields.previousOwners")}</label>
                <select
                  name="vorbesitzer"
                  value={formData.vorbesitzer}
                  onChange={handleInputChange}
                  className="field"
                >
                  <option value="1">{t("options.previousOwners.one")}</option>
                  <option value="2">{t("options.previousOwners.two")}</option>
                  <option value="3">{t("options.previousOwners.three")}</option>
                  <option value="4+">{t("options.previousOwners.moreThanThree")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("fields.huAu")}</label>
                <select
                  name="huAu"
                  value={formData.huAu}
                  onChange={handleInputChange}
                  className="field"
                >
                  <option value="yes">{t("options.huAu.yes")}</option>
                  <option value="no">{t("options.huAu.no")}</option>
                  <option value="expired">{t("options.huAu.expired")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("fields.accidentHistory")}</label>
                <select
                  name="unfallhistorie"
                  value={formData.unfallhistorie}
                  onChange={handleInputChange}
                  className="field"
                >
                  <option value="no">{t("options.accidentHistory.no")}</option>
                  <option value="yes">{t("options.accidentHistory.yes")}</option>
                  <option value="unknown">{t("options.accidentHistory.unknown")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("fields.serviceBook")}</label>
                <select
                  name="scheckheft"
                  value={formData.scheckheft}
                  onChange={handleInputChange}
                  className="field"
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
          <div className="card p-6 sm:p-8">
            <h2 className="section-title mb-6">{t("sections.priceExpectation")}</h2>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t("fields.priceLabel")}</label>
              <input
                type="number"
                inputMode="numeric"
                name="preisvorstellung"
                value={formData.preisvorstellung}
                onChange={handleInputChange}
                placeholder={t("placeholders.price")}
                step="100"
                className="field text-lg"
              />
            </div>
          </div>
        )}

        {/* Bilder */}
        {currentStep === "bilder" && (
          <div className="card p-6 sm:p-8">
            <h2 className="section-title mb-6">{t("images.uploadCount", { current: images.length, max: MAX_IMAGES })}</h2>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-input rounded-lg p-8 text-center mb-8 hover:border-primary transition-colors">
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
                <Upload className="w-12 h-12 text-muted-foreground/70 mx-auto mb-2" />
                <p className="text-lg font-semibold text-foreground">{t("images.uploadTitle")}</p>
                <p className="text-sm text-muted-foreground">{t("images.uploadSubtitle")}</p>
                {images.length >= MAX_IMAGES && <p className="text-sm text-destructive mt-2">{t("images.uploadMaxReached")}</p>}
              </label>
            </div>

            {/* Images Grid */}
            {images.length > 0 && (
              <div>
                <h3 className="card-title mb-4">{t("images.gridTitle")}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, image.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, image.id)}
                      className="relative group bg-secondary rounded-lg overflow-hidden cursor-move"
                    >
                      <div className="aspect-square relative">
                        <img
                          src={image.data}
                          alt={`Vehicle ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {image.isMain && (
                          <div className="absolute top-2 left-2 bg-success text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
                            {t("images.mainBadge")}
                          </div>
                        )}
                      </div>

                      {/* Hover Actions (mouse); touch screens get the button below instead */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity hidden [@media(hover:hover)]:flex flex-col items-center justify-center gap-2">
                        {!image.isMain && (
                          <button
                            onClick={() => setMainImage(image.id)}
                            className="min-h-11 bg-card text-foreground px-3 py-1 rounded text-sm font-medium hover:bg-secondary"
                          >
                            {t("images.setMain")}
                          </button>
                        )}
                      </div>

                      {/* Set as main image on touch screens (no hover) */}
                      {!image.isMain && (
                        <button
                          type="button"
                          onClick={() => setMainImage(image.id)}
                          className="[@media(hover:hover)]:hidden absolute inset-x-1 bottom-1 min-h-11 rounded bg-card/95 px-2 text-xs font-semibold text-foreground shadow"
                        >
                          {t("images.setMain")}
                        </button>
                      )}

                      {/* Remove (always visible: hover does not exist on touch screens) */}
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        aria-label={t("images.remove", { index: index + 1 })}
                        title={t("images.remove", { index: index + 1 })}
                        className="absolute top-1 right-1 z-10 inline-flex h-11 w-11 items-center justify-center bg-white/90 hover:bg-destructive hover:text-primary-foreground text-destructive rounded-full shadow"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Drag Handle */}
                      <div className="absolute bottom-2 right-2 bg-foreground/60 text-primary-foreground p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hidden [@media(hover:hover)]:block">
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
          <div className="card p-6 sm:p-8">
            <h2 className="section-title mb-6">{t("sections.vehicleDescription")}</h2>
            <textarea
              name="beschreibung"
              value={formData.beschreibung}
              onChange={handleInputChange}
              placeholder={t("description.placeholder")}
              rows={10}
              className="field"
            />
            <p className="text-sm text-muted-foreground mt-2">{t("description.minCharsNote", { min: DESCRIPTION_MIN_CHARS })}</p>
          </div>
        )}

        {/* Verkaufsart */}
        {currentStep === "verkaufsart" && (
          <div className="card p-6 sm:p-8">
            <h2 className="section-title mb-2">{t("sections.salesTypeSelection")}</h2>
            <p className="text-muted-foreground mb-8">{t("salesType.subtitle")}</p>

            <div className="space-y-4">
              {/* Direktverkauf */}
              <label className={`flex items-start p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.verkaufsart === "direct"
                  ? "border-primary bg-info-subtle/50"
                  : "border-input hover:bg-muted"
              }`}>
                <input
                  type="radio"
                  name="verkaufsart"
                  value="direct"
                  checked={formData.verkaufsart === "direct"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary mt-1 flex-shrink-0"
                />
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <CONCEPT_ICONS.directSale className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                    {t("salesType.direct")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("salesType.directDesc")}
                  </p>
                </div>
              </label>

              {/* Inzahlungnahme */}
              <label className={`flex items-start p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.verkaufsart === "tradeIn"
                  ? "border-primary bg-info-subtle/50"
                  : "border-input hover:bg-muted"
              }`}>
                <input
                  type="radio"
                  name="verkaufsart"
                  value="tradeIn"
                  checked={formData.verkaufsart === "tradeIn"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary mt-1 flex-shrink-0"
                />
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <CONCEPT_ICONS.tradeIn className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                    {t("salesType.tradeIn")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("salesType.tradeInDesc")}
                  </p>
                </div>
              </label>

              {/* Verkauf im Kundenauftrag */}
              <label className={`flex items-start p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.verkaufsart === "consignment"
                  ? "border-primary bg-info-subtle/50"
                  : "border-input hover:bg-muted"
              }`}>
                <input
                  type="radio"
                  name="verkaufsart"
                  value="consignment"
                  checked={formData.verkaufsart === "consignment"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary mt-1 flex-shrink-0"
                />
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <CONCEPT_ICONS.consignment className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
                    {t("salesType.consignment")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("salesType.consignmentDesc")}
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Kontrolle */}
        {currentStep === "kontrolle" && (
          <div className="card p-6 sm:p-8">
            <h2 className="section-title mb-6">{t("review.title")}</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2">{t("review.vehicleInfo")}</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <p><span className="font-medium">{t("fields.brand")}:</span> {formData.marke}</p>
                  <p><span className="font-medium">{t("fields.model")}:</span> {formData.modell}</p>
                  <p><span className="font-medium">{t("fields.firstRegistration")}:</span> {formData.erstzulassung}</p>
                  <p><span className="font-medium">{t("fields.mileage")}:</span> {t("units.mileage", { value: format.number(parseInt(formData.kilometerstand) || 0) })}</p>
                  <p><span className="font-medium">{t("fields.powerHp")}:</span> {t("units.power", { value: format.number(parseInt(formData.leistung) || 0) })}</p>
                  <p><span className="font-medium">{t("fields.fuel")}:</span> {getFuelTypeLabel(tCommon, formData.kraftstoff)}</p>
                  <p><span className="font-medium">{t("fields.transmission")}:</span> {getTransmissionLabel(tCommon, formData.getriebe)}</p>
                  <p><span className="font-medium">{t("fields.bodyType")}:</span> {getBodyTypeLabel(tCommon, formData.karosserie)}</p>
                  {getSubmissionDetails(t, {
                    variant: formData.variante.trim(),
                    previous_owners: formData.vorbesitzer,
                    hu_au: formData.huAu,
                    accident_history: formData.unfallhistorie,
                    service_book: formData.scheckheft,
                  }).map((detail) => (
                    <p key={detail.key}><span className="font-medium">{detail.label}:</span> {detail.value}</p>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">{t("review.priceSection")}</h3>
                <p className="text-2xl font-bold text-primary">{format.number(parseFloat(formData.preisvorstellung) || 0, { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">{t("review.imagesSection")}</h3>
                <p className="text-muted-foreground">{t("review.imagesCount", { count: images.length })}</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">{t("review.descriptionSection")}</h3>
                <p className="text-muted-foreground line-clamp-3">{formData.beschreibung}</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">{t("review.salesTypeSection")}</h3>
                <SalesTypeLabel salesType={formData.verkaufsart} className="text-muted-foreground">{getSalesTypeLabel(formData.verkaufsart)}</SalesTypeLabel>
              </div>
            </div>
          </div>
        )}

        {/* Absenden */}
        {currentStep === "absenden" && (
          <div className="space-y-6">
            <div className="card p-6 sm:p-8 text-center">
              <Check className="w-16 h-16 text-success mx-auto mb-4" />
              <h2 className="section-title mb-4">{t("final.title")}</h2>
              <p className="text-muted-foreground mb-8">
                {t("final.message")}
              </p>
            </div>

            {/* Workflow Info */}
            <SubmissionWorkflowInfo />
          </div>
        )}

        {/* Submitted, but some photos could not be stored: retry them or continue.
            The normal navigation is hidden so the vehicle cannot be submitted twice. */}
        {partialUpload ? (
          <div className="bg-warning-subtle/50 border border-warning-border rounded-lg p-6 mt-8">
            <h3 className="font-semibold text-warning-subtle-foreground mb-1">{t("photoUpload.title")}</h3>
            <p className="text-sm text-warning-subtle-foreground mb-4">
              {t("photoUpload.message", { failed: partialUpload.failedIndexes.length, total: images.length })}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleRetryPhotos}
                disabled={retryingPhotos}

              >
                <Upload className="mr-2 w-4 h-4" />
                {retryingPhotos ? t("photoUpload.retrying") : t("photoUpload.retry")}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/fahrzeug-angeboten")}
                disabled={retryingPhotos}

              >
                {t("photoUpload.continue")}
              </Button>
            </div>
          </div>
        ) : (
        <div className="flex gap-4 justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}

          >
            <ChevronLeft className="mr-2 w-4 h-4" />
            {t("buttons.back")}
          </Button>

          {currentStep !== "absenden" ? (
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
