"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Upload, X, GripVertical, Check } from "lucide-react";
import Link from "next/link";

type Step = "fahrzeugdaten" | "preis" | "bilder" | "beschreibung" | "verkaufsart" | "kontrolle" | "absenden";

const STEPS: { id: Step; label: string }[] = [
  { id: "fahrzeugdaten", label: "Fahrzeugdaten" },
  { id: "preis", label: "Preis" },
  { id: "bilder", label: "Bilder" },
  { id: "beschreibung", label: "Beschreibung" },
  { id: "verkaufsart", label: "Verkaufsart" },
  { id: "kontrolle", label: "Kontrolle" },
  { id: "absenden", label: "Absenden" },
];

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
  const router = useRouter();
  const { loading, isAuthenticated, user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>("fahrzeugdaten");
  const [formData, setFormData] = useState<VehicleData>({
    marke: "",
    modell: "",
    variante: "",
    erstzulassung: "",
    kilometerstand: "",
    kraftstoff: "Benzin",
    getriebe: "Manuell",
    leistung: "",
    karosserie: "Sedan",
    farbe: "",
    vorbesitzer: "1",
    huAu: "Ja",
    unfallhistorie: "Nein",
    scheckheft: "Ja",
    preisvorstellung: "",
    beschreibung: "",
    verkaufsart: "Direktverkauf an KFZ RBM",
  });
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);

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
          const result = await getSubmittedVehicleById(vehicleId, user.id);

          setEditingVehicleId(vehicleId);
          setFormData({
            marke: result.vehicle.brand || "",
            modell: result.vehicle.model || "",
            variante: "",
            erstzulassung: result.vehicle.year?.toString() || "",
            kilometerstand: result.vehicle.mileage?.toString() || "",
            kraftstoff: result.vehicle.fuel_type || "Benzin",
            getriebe: result.vehicle.transmission || "Manuell",
            leistung: result.vehicle.power_hp?.toString() || "",
            karosserie: result.vehicle.body_type || "Sedan",
            farbe: result.vehicle.color || "",
            vorbesitzer: "",
            huAu: "Ja",
            unfallhistorie: "Nein",
            scheckheft: "Ja",
            preisvorstellung: result.vehicle.price?.toString() || "",
            beschreibung: result.vehicle.description || "",
            verkaufsart: result.vehicle.sales_type || "Direktverkauf an KFZ RBM",
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
          setError("Fehler beim Laden des Fahrzeugs");
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
          <p className="text-gray-600">Wird geladen...</p>
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

    if (images.length + files.length > 20) {
      setError("Maximum 20 Bilder erlaubt");
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
        setError("Fehler beim Verarbeiten des Bildes");
      }
    }
    e.target.value = "";
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === id);
      if (imageToRemove?.dbId) {
        setRemovedImageIds((prev) => [...prev, imageToRemove.dbId!]);
      }
      const filtered = prev.filter((img) => img.id !== id);
      // If removed image was main, make first image main
      if (filtered.length > 0 && !filtered.some((img) => img.isMain)) {
        filtered[0].isMain = true;
      }
      return filtered;
    });
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
          setError("Bitte füllen Sie Marke, Modell und Erstzulassung aus");
          return false;
        }

        // Validate year
        const year = parseInt(formData.erstzulassung);
        const currentYear = new Date().getFullYear();
        if (year < 1886 || year > currentYear + 1) {
          setError(`Erstzulassung muss zwischen 1886 und ${currentYear + 1} liegen`);
          return false;
        }

        // Validate mileage (max 99,999,999 km)
        const mileage = parseInt(formData.kilometerstand) || 0;
        if (mileage < 0 || mileage > 99999999) {
          setError("Kilometerstand muss zwischen 0 und 99.999.999 km liegen");
          return false;
        }

        // Validate power HP (max 99,999 PS)
        const power = parseInt(formData.leistung) || 0;
        if (power < 0 || power > 99999) {
          setError("Leistung muss zwischen 0 und 99.999 PS liegen");
          return false;
        }

        break;
      case "preis":
        if (!formData.preisvorstellung) {
          setError("Bitte geben Sie eine Preisvorstellung ein");
          return false;
        }

        // Validate price (NUMERIC(10,2) max = 99,999,999.99)
        const price = parseFloat(formData.preisvorstellung);
        if (price <= 0) {
          setError("Preis muss größer als 0 sein");
          return false;
        }
        if (price > 99999999.99) {
          setError("Preis darf 99.999.999,99 € nicht übersteigen");
          return false;
        }

        break;
      case "bilder":
        if (images.length === 0) {
          setError("Bitte laden Sie mindestens ein Bild hoch");
          return false;
        }
        break;
      case "beschreibung":
        if (!formData.beschreibung || formData.beschreibung.length < 20) {
          setError("Bitte geben Sie eine Beschreibung mit mindestens 20 Zeichen ein");
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

      const { createSubmittedVehicle, updateVehicleDraft, updateVehicleImages } = await import("@/app/actions/vehicles");

      if (editingVehicleId) {
        // Update existing draft
        const newImages = images.filter((img) => !img.dbId);
        const newImageData = newImages.map((img) => img.data);

        // Update vehicle data
        await updateVehicleDraft(
          editingVehicleId,
          user.id,
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
          }
        );

        // Update images if there are changes
        if (newImageData.length > 0 || removedImageIds.length > 0 || images.length > 0) {
          // Separate existing and new images
          const existingImages = images.filter((img) => img.dbId && !removedImageIds.includes(img.dbId));
          const newImages = images.filter((img) => !img.dbId);

          // Determine main image - prefer existing DB image
          const mainImage = images.find((img) => img.isMain);
          const mainImageId = mainImage?.dbId;
          const mainIsNewImage = mainImage && !mainImage.dbId;
          const mainNewImageIndex = mainIsNewImage ? newImages.indexOf(mainImage) : -1;

          // Only include existing (DB) images in order
          const imageOrder = existingImages.length > 0 ? existingImages.map((img) => img.dbId!) : undefined;

          await updateVehicleImages(editingVehicleId, user.id, {
            newImages: newImageData.length > 0 ? newImageData : undefined,
            imagesToRemove: removedImageIds.length > 0 ? removedImageIds : undefined,
            imageOrder: imageOrder,
            mainImageId: mainImageId,
            mainNewImageIndex: mainNewImageIndex >= 0 ? mainNewImageIndex : undefined,
          });
        }
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
          user.id,
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
          imagesToPass,
          true  // Create as draft first (RLS requires draft for image upload)
        );

        console.log(`[FORM] createSubmittedVehicle returned:`, result);

        // Update status to eingereicht after images are uploaded (server-side action)
        if (result.vehicleId) {
          const { finalizeSubmission } = await import("@/app/actions/vehicles");
          await finalizeSubmission(result.vehicleId, user.id);
        }
      }

      // Redirect to success page
      router.push("/dashboard/fahrzeug-angeboten");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Fehler beim Absenden des Fahrzeugs");
    } finally {
      setSaving(false);
    }
  };

  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
  const stepProgress = ((currentIndex + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-kfz-blue to-kfz-blue-dark text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/dashboard" className="text-blue-100 hover:text-white mb-2 inline-block text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Mein Auto anbieten</h1>
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
            <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Fahrzeugdaten */}
        {currentStep === "fahrzeugdaten" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Fahrzeuginformationen</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marke *</label>
                <input
                  type="text"
                  name="marke"
                  value={formData.marke}
                  onChange={handleInputChange}
                  placeholder="z.B. BMW, Mercedes"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modell *</label>
                <input
                  type="text"
                  name="modell"
                  value={formData.modell}
                  onChange={handleInputChange}
                  placeholder="z.B. 330i, C-Class"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Variante</label>
                <input
                  type="text"
                  name="variante"
                  value={formData.variante}
                  onChange={handleInputChange}
                  placeholder="z.B. Sport, Comfort"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Erstzulassung *</label>
                <input
                  type="number"
                  name="erstzulassung"
                  value={formData.erstzulassung}
                  onChange={handleInputChange}
                  placeholder="2020"
                  min="1990"
                  max={new Date().getFullYear()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kilometerstand</label>
                <input
                  type="number"
                  name="kilometerstand"
                  value={formData.kilometerstand}
                  onChange={handleInputChange}
                  placeholder="50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Leistung (PS)</label>
                <input
                  type="number"
                  name="leistung"
                  value={formData.leistung}
                  onChange={handleInputChange}
                  placeholder="200"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kraftstoff</label>
                <select
                  name="kraftstoff"
                  value={formData.kraftstoff}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                >
                  <option>Benzin</option>
                  <option>Diesel</option>
                  <option>Hybrid</option>
                  <option>Elektro</option>
                  <option>LPG</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Getriebe</label>
                <select
                  name="getriebe"
                  value={formData.getriebe}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                >
                  <option>Manuell</option>
                  <option>Automatik</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Karosserie</label>
                <select
                  name="karosserie"
                  value={formData.karosserie}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                >
                  <option>Sedan</option>
                  <option>SUV</option>
                  <option>Kombi</option>
                  <option>Coupe</option>
                  <option>Cabriolet</option>
                  <option>Kleinwagen</option>
                  <option>Van</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Farbe</label>
                <input
                  type="text"
                  name="farbe"
                  value={formData.farbe}
                  onChange={handleInputChange}
                  placeholder="z.B. Schwarz, Weiß"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vorbesitzer</label>
                <select
                  name="vorbesitzer"
                  value={formData.vorbesitzer}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                >
                  <option value="1">1. Besitzer</option>
                  <option value="2">2. Besitzer</option>
                  <option value="3">3. Besitzer</option>
                  <option value="4+">4+ Besitzer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">HU/AU</label>
                <select
                  name="huAu"
                  value={formData.huAu}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                >
                  <option>Ja</option>
                  <option>Nein</option>
                  <option>Abgelaufen</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unfallhistorie</label>
                <select
                  name="unfallhistorie"
                  value={formData.unfallhistorie}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                >
                  <option>Nein</option>
                  <option>Ja</option>
                  <option>Unbekannt</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheckheft</label>
                <select
                  name="scheckheft"
                  value={formData.scheckheft}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                >
                  <option>Ja</option>
                  <option>Nein</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Preis */}
        {currentStep === "preis" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Preisvorstellung</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preis (€) *</label>
              <input
                type="number"
                name="preisvorstellung"
                value={formData.preisvorstellung}
                onChange={handleInputChange}
                placeholder="50000"
                step="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent text-lg"
              />
            </div>
          </div>
        )}

        {/* Bilder */}
        {currentStep === "bilder" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Fotos hochladen ({images.length}/20)</h2>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-8 hover:border-kfz-blue transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={images.length >= 20}
              />
              <label htmlFor="image-upload" className="cursor-pointer block">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-lg font-semibold text-gray-900">Bilder hochladen</p>
                <p className="text-sm text-gray-600">Ziehen Sie Bilder hierher oder klicken Sie zum Auswählen</p>
                {images.length >= 20 && <p className="text-sm text-red-600 mt-2">Maximum erreicht</p>}
              </label>
            </div>

            {/* Images Grid */}
            {images.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hochgeladene Bilder</h3>
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
                          alt={`Fahrzeug ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {image.isMain && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                            Hauptbild
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
                            Als Hauptbild
                          </button>
                        )}
                        <button
                          onClick={() => removeImage(image.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-700"
                        >
                          Löschen
                        </button>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Fahrzeugbeschreibung</h2>
            <textarea
              name="beschreibung"
              value={formData.beschreibung}
              onChange={handleInputChange}
              placeholder="Beschreiben Sie den Zustand, Ausstattung, Wartungshistorie und besondere Merkmale..."
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
            />
            <p className="text-sm text-gray-600 mt-2">Minimum 20 Zeichen erforderlich</p>
          </div>
        )}

        {/* Verkaufsart */}
        {currentStep === "verkaufsart" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verkaufsart</h2>
            <p className="text-gray-600 mb-8">Wählen Sie, wie Sie Ihr Fahrzeug verkaufen möchten:</p>

            <div className="space-y-4">
              {/* Direktverkauf an KFZ RBM */}
              <label className={`flex items-start p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.verkaufsart === "Direktverkauf an KFZ RBM"
                  ? "border-kfz-blue bg-blue-50"
                  : "border-gray-300 hover:bg-gray-50"
              }`}>
                <input
                  type="radio"
                  name="verkaufsart"
                  value="Direktverkauf an KFZ RBM"
                  checked={formData.verkaufsart === "Direktverkauf an KFZ RBM"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-kfz-blue mt-1 flex-shrink-0"
                />
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-gray-900">Direktverkauf an KFZ RBM</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Sie verkaufen Ihr Fahrzeug direkt an KFZ RBM. Wir übernehmen den Kauf und Sie erhalten den vereinbarten Preis.
                  </p>
                </div>
              </label>

              {/* Inzahlungnahme */}
              <label className={`flex items-start p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.verkaufsart === "Inzahlungnahme"
                  ? "border-kfz-blue bg-blue-50"
                  : "border-gray-300 hover:bg-gray-50"
              }`}>
                <input
                  type="radio"
                  name="verkaufsart"
                  value="Inzahlungnahme"
                  checked={formData.verkaufsart === "Inzahlungnahme"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-kfz-blue mt-1 flex-shrink-0"
                />
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-gray-900">Inzahlungnahme</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Sie tauschen Ihr Fahrzeug gegen ein anderes Fahrzeug von uns ein. Der Wert Ihres Fahrzeugs wird als Anzahlung verrechnet.
                  </p>
                </div>
              </label>

              {/* Verkauf im Kundenauftrag */}
              <label className={`flex items-start p-6 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.verkaufsart === "Verkauf im Kundenauftrag"
                  ? "border-kfz-blue bg-blue-50"
                  : "border-gray-300 hover:bg-gray-50"
              }`}>
                <input
                  type="radio"
                  name="verkaufsart"
                  value="Verkauf im Kundenauftrag"
                  checked={formData.verkaufsart === "Verkauf im Kundenauftrag"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-kfz-blue mt-1 flex-shrink-0"
                />
                <div className="ml-4 flex-1">
                  <p className="font-semibold text-gray-900">Verkauf im Kundenauftrag</p>
                  <p className="text-sm text-gray-600 mt-1">
                    KFZ RBM verkauft Ihr Fahrzeug in Ihrem Namen. Sie erhalten den Verkaufspreis abzüglich einer Kommission, die wir mit Ihnen abstimmen. Dies ist ideal, wenn Sie maximale Kontrolle über den Verkauf behalten möchten.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Kontrolle */}
        {currentStep === "kontrolle" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Überprüfung</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Fahrzeuginformationen</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <p><span className="font-medium">Marke:</span> {formData.marke}</p>
                  <p><span className="font-medium">Modell:</span> {formData.modell}</p>
                  <p><span className="font-medium">Jahr:</span> {formData.erstzulassung}</p>
                  <p><span className="font-medium">Kilometer:</span> {formData.kilometerstand} km</p>
                  <p><span className="font-medium">Leistung:</span> {formData.leistung} PS</p>
                  <p><span className="font-medium">Kraftstoff:</span> {formData.kraftstoff}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Preis</h3>
                <p className="text-2xl font-bold text-kfz-blue">€ {parseFloat(formData.preisvorstellung).toLocaleString("de-DE")}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Bilder</h3>
                <p className="text-gray-600">{images.length} Bilder hochgeladen</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Beschreibung</h3>
                <p className="text-gray-600">{formData.beschreibung.substring(0, 100)}...</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Verkaufsart</h3>
                <p className="text-gray-600">{formData.verkaufsart}</p>
              </div>
            </div>
          </div>
        )}

        {/* Absenden */}
        {currentStep === "absenden" && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Bereit zum Absenden?</h2>
            <p className="text-gray-600 mb-8">
              Ihr Fahrzeug wird direkt an KFZ RBM gesendet. Wir melden uns bei Ihnen.
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
            Zurück
          </Button>

          {currentStep !== "absenden" ? (
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
              {saving ? "Wird abgesendet..." : "Fahrzeug absenden"}
              <Check className="ml-2 w-4 h-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
