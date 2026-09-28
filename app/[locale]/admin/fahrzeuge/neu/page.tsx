"use client";
import { useTranslations } from "next-intl";
import type { ActionErrorCode } from "@/lib/action-result";
import { useErrorMessage } from "@/lib/use-error-message";
import { resizeImageToDataUrl } from "@/lib/resize-image";
import { vehicleFieldsSchema } from "@/lib/vehicle-schema";
import { useVehicleValidation } from "@/lib/use-vehicle-validation";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, Save, ArrowLeft, X } from "lucide-react";
import {
  getFuelTypeLabel,
  getListingTypeLabel,
  getTransmissionLabel,
  getVehicleConditionLabel,
} from "@/lib/vehicle-labels";

// DB values; labels come from common.* via lib/vehicle-labels.ts.
const TRANSMISSIONS = ["automatic", "manual", "cvt"] as const;
const FUEL_TYPES = ["gasoline", "diesel", "hybrid", "electric"] as const;
const LISTING_TYPES = ["verkauf", "export"] as const;
const CONDITIONS = ["fahrbereit", "nicht_fahrbereit", "unfallwagen"] as const;

export default function AdminCreateVehiclePage() {
  const params = useParams();
  const locale = params.locale as string || 'de';
  const router = useRouter();
  const { loading, isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    mileage: 0,
    price: 0,
    transmission: "automatic",
    fuel_type: "gasoline",
    body_type: "",
    color_exterior: "",
    color_interior: "",
    engine_cc: 0,
    power_hp: 0,
    description: "",
    listing_type: "verkauf" as "verkauf" | "export",
    zustand: "",
    zielland: "",
    export_notes: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState("");
  const tForm = useTranslations("adminVehicleForm");
  const tCommon = useTranslations("common");
  const tButtons = useTranslations("buttons");
  const errorMessage = useErrorMessage();
  const validateVehicle = useVehicleValidation();

  const MAX_IMAGES = 20;
  const errorText = (code: ActionErrorCode) => errorMessage(code);

  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((current) => [...current, ...files].slice(0, MAX_IMAGES));
    e.target.value = "";
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((current) => current.filter((_, i) => i !== index));
  };

  // Calls a server action and turns a network/transport failure into a code
  // (the actions themselves never throw).
  const call = async <T,>(fn: () => Promise<T>): Promise<T | { ok: false; error: ActionErrorCode }> => {
    try {
      return await fn();
    } catch (err) {
      console.error("Server action failed:", err);
      return { ok: false, error: "UNKNOWN" };
    }
  };

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [loading, isAdmin, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
            ? parseFloat(value) || 0
            : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand || !formData.model) {
      setError(tForm("errors.brandModelRequired"));
      return;
    }

    const generateTestVIN = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let vin = 'TEST';
      for (let i = 0; i < 13; i++) {
        vin += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return vin;
    };
    const submitData = { ...formData, vin: generateTestVIN() };
    const invalid = validateVehicle(vehicleFieldsSchema, submitData);
    if (invalid) {
      setError(invalid);
      return;
    }
    const actions = await import("@/app/actions/admin");
    const { uploadVehicleImage } = await import("@/app/actions/vehicles");

    setFormLoading(true);
    setError("");
    try {
      // 1. Resize/read all photos first, so a broken file never leaves a vehicle behind.
      const images: string[] = [];
      for (const file of selectedFiles) {
        try {
          images.push(await resizeImageToDataUrl(file));
        } catch {
          setError(tForm("errors.imageRead", { name: file.name }));
          return;
        }
      }

      // 2. Create the vehicle as a (non-public) draft.
      setProgress(tForm("progress.creating"));
      const created = await call(() => actions.createVehicle(submitData));
      if (!created.ok) {
        setError(`${tForm("errors.createFailed")} ${errorText(created.error)}`);
        return;
      }
      const vehicleId = created.vehicleId;

      // 3. Upload the photos one by one.
      for (let i = 0; i < images.length; i++) {
        setProgress(tForm("progress.uploading", { current: i + 1, total: images.length }));
        const uploaded = await call(() => uploadVehicleImage(vehicleId, images[i]));
        if (!uploaded.ok) {
          // Roll back: remove the draft and the photos uploaded so far.
          const discarded = await call(() => actions.discardDraftVehicle(vehicleId));
          setError(
            `${tForm(discarded.ok ? "errors.uploadRolledBack" : "errors.uploadDraftKept")} ${errorText(uploaded.error)}`
          );
          return;
        }
      }

      // 4. Only now make it public.
      setProgress(tForm("progress.publishing"));
      const published = await call(() => actions.publishVehicle(vehicleId));
      if (!published.ok) {
        setError(`${tForm("errors.publishFailed")} ${errorText(published.error)}`);
        return;
      }

      router.push(`/admin/fahrzeuge/${vehicleId}`);
    } finally {
      setFormLoading(false);
      setProgress("");
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

  return (
    <div className="space-y-6">
      <Link href="/admin/fahrzeuge">
        <button className="flex min-h-11 items-center gap-2 text-primary hover:text-primary-hover font-medium">
          <ArrowLeft className="w-4 h-4" />
          {tForm("backToList")}
        </button>
      </Link>

      <div className="card p-6">
        <h1 className="page-title text-foreground mb-2">{tForm("newTitle")}</h1>
        <p className="text-muted-foreground">{tForm("newSubtitle")}</p>

        {error && (
          <div className="mt-6 bg-destructive-subtle/50 border border-destructive-border rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive-subtle-foreground">{error}</p>
          </div>
        )}


        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {tForm("fields.brand")} *
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder={tForm("placeholders.brand")}
                required
                className="field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {tForm("fields.model")} *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                placeholder={tForm("placeholders.model")}
                required
                className="field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {tForm("fields.year")} *
              </label>
              <input
                type="number"
                inputMode="numeric"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                required
                className="field"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {tForm("fields.mileage")}
              </label>
              <input
                type="number"
                inputMode="numeric"
                name="mileage"
                value={formData.mileage}
                onChange={handleInputChange}
                min="0"
                className="field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {tForm("fields.price")}
              </label>
              <input
                type="number"
                inputMode="numeric"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="100"
                className="field"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {tForm("fields.transmission")}
              </label>
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleInputChange}
                className="field"
              >
                {TRANSMISSIONS.map((value) => (
                  <option key={value} value={value}>{getTransmissionLabel(tCommon, value)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {tForm("fields.fuel")}
              </label>
              <select
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleInputChange}
                className="field"
              >
                {FUEL_TYPES.map((value) => (
                  <option key={value} value={value}>{getFuelTypeLabel(tCommon, value)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {tForm("fields.bodyType")}
              </label>
              <input
                type="text"
                name="body_type"
                value={formData.body_type}
                onChange={handleInputChange}
                placeholder={tForm("placeholders.bodyType")}
                className="field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {tForm("fields.colorExterior")}
              </label>
              <input
                type="text"
                name="color_exterior"
                value={formData.color_exterior}
                onChange={handleInputChange}
                placeholder={tForm("placeholders.colorExterior")}
                className="field"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {tForm("fields.colorInterior")}
              </label>
              <input
                type="text"
                name="color_interior"
                value={formData.color_interior}
                onChange={handleInputChange}
                placeholder={tForm("placeholders.colorInterior")}
                className="field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {tForm("fields.power")}
              </label>
              <input
                type="number"
                inputMode="numeric"
                name="power_hp"
                value={formData.power_hp}
                onChange={handleInputChange}
                min="0"
                className="field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {tForm("fields.engine")}
            </label>
            <input
              type="number"
              inputMode="numeric"
              name="engine_cc"
              value={formData.engine_cc}
              onChange={handleInputChange}
              min="0"
              className="field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {tForm("fields.description")}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={tForm("placeholders.description")}
              rows={4}
              className="field"
            />
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="card-title mb-4">{tForm("fields.listingSection")}</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {tForm("fields.listingType")}
                </label>
                <select
                  name="listing_type"
                  value={formData.listing_type}
                  onChange={handleInputChange}
                  className="field"
                >
                  {LISTING_TYPES.map((value) => (
                    <option key={value} value={value}>{getListingTypeLabel(tCommon, value)}</option>
                  ))}
                </select>
              </div>
            </div>

            {formData.listing_type === "export" && (
              <div className="mt-6 space-y-6 bg-info-subtle/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground italic">{tForm("fields.exportFields")}</p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {tForm("fields.condition")}
                    </label>
                    <select
                      name="zustand"
                      value={formData.zustand}
                      onChange={handleInputChange}
                      className="field"
                    >
                      <option value="">{tForm("fields.selectPlaceholder")}</option>
                      {CONDITIONS.map((value) => (
                        <option key={value} value={value}>{getVehicleConditionLabel(tCommon, value)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {tForm("fields.destination")}
                    </label>
                    <input
                      type="text"
                      name="zielland"
                      value={formData.zielland}
                      onChange={handleInputChange}
                      placeholder={tForm("placeholders.destination")}
                      className="field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {tForm("fields.exportNotes")}
                  </label>
                  <textarea
                    name="export_notes"
                    value={formData.export_notes}
                    onChange={handleInputChange}
                    placeholder={tForm("placeholders.exportNotes")}
                    rows={3}
                    className="field"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-border">
            <h2 className="text-lg font-semibold text-foreground mb-1">{tForm("images.title")}</h2>
            <p className="text-sm text-muted-foreground mb-4">{tForm("images.hint", { max: MAX_IMAGES })}</p>
            <label className="block border-2 border-dashed border-input rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageSelection}
                disabled={formLoading || selectedFiles.length >= MAX_IMAGES}
                className="sr-only"
              />
              <span className="font-medium text-foreground">{tForm("images.select")}</span>
              <span className="block text-xs text-muted-foreground mt-1">
                {tForm("images.selected", { count: selectedFiles.length })}
              </span>
            </label>
            {selectedFiles.length > 0 && (
              <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {selectedFiles.map((file, idx) => (
                  <li key={`${file.name}-${idx}`} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={tForm("images.previewAlt", { index: idx + 1 })}
                      className="w-full h-24 object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(idx)}
                      disabled={formLoading}
                      aria-label={tForm("images.remove", { index: idx + 1 })}
                      className="absolute top-1 right-1 bg-white/90 rounded-full p-1 shadow hover:bg-white"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{file.name}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {progress && (
            <p role="status" className="text-sm text-foreground">{progress}</p>
          )}

          <div className="flex gap-3 pt-6 border-t border-border">
            <button
              type="submit"
              disabled={formLoading}
              className="min-h-11 flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {formLoading ? tForm("creating") : tForm("create")}
            </button>
            <Link href="/admin/fahrzeuge" className="flex-1">
              <button
                type="button"
                className="min-h-11 w-full px-4 py-3 border border-input text-foreground rounded-lg hover:bg-muted font-medium transition-colors"
              >
                {tButtons("cancel")}
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
