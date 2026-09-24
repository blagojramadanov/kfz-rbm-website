"use client";
import { useTranslations } from "next-intl";
import type { ActionErrorCode } from "@/lib/action-result";
import { resizeImageToDataUrl } from "@/lib/resize-image";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, Save, ArrowLeft, X } from "lucide-react";

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
  const tErrors = useTranslations("actionErrors");

  const MAX_IMAGES = 20;
  const errorText = (code: ActionErrorCode) => tErrors(code);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/fahrzeuge">
        <button className="flex items-center gap-2 text-kfz-blue hover:text-kfz-blue-dark font-medium">
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Fahrzeugliste
        </button>
      </Link>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Neues Fahrzeug erstellen</h1>
        <p className="text-gray-600">Fügen Sie ein neues Fahrzeug zum Inventar hinzu</p>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}


        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Marke *
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="z.B. BMW"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Modell *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                placeholder="z.B. 3er Serie"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Jahr *
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Kilometer
              </label>
              <input
                type="number"
                name="mileage"
                value={formData.mileage}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Preis (€)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Getriebe
              </label>
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
              >
                <option value="automatic">Automatik</option>
                <option value="manual">Manuell</option>
                <option value="cvt">CVT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Kraftstoff
              </label>
              <select
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
              >
                <option value="gasoline">Benzin</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Elektro</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Karosserie
              </label>
              <input
                type="text"
                name="body_type"
                value={formData.body_type}
                onChange={handleInputChange}
                placeholder="z.B. Limousine"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Außenfarbe
              </label>
              <input
                type="text"
                name="color_exterior"
                value={formData.color_exterior}
                onChange={handleInputChange}
                placeholder="z.B. Schwarz"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Innenfarbe
              </label>
              <input
                type="text"
                name="color_interior"
                value={formData.color_interior}
                onChange={handleInputChange}
                placeholder="z.B. Beige"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Motorleistung (PS)
              </label>
              <input
                type="number"
                name="power_hp"
                value={formData.power_hp}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Motor (cc)
            </label>
            <input
              type="number"
              name="engine_cc"
              value={formData.engine_cc}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Beschreibung
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Fahrzeugbeschreibung..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
            />
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fahrzeugtyp</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Typ
                </label>
                <select
                  name="listing_type"
                  value={formData.listing_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                >
                  <option value="verkauf">🏪 Verkauf (Normalverkauf)</option>
                  <option value="export">🌍 Export (Für Export ins Ausland)</option>
                </select>
              </div>
            </div>

            {formData.listing_type === "export" && (
              <div className="mt-6 space-y-6 bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 italic">Exportspezifische Felder</p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Zustand
                    </label>
                    <select
                      name="zustand"
                      value={formData.zustand}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                    >
                      <option value="">-- Wählen --</option>
                      <option value="fahrbereit">Fahrbereit</option>
                      <option value="nicht_fahrbereit">Nicht fahrbereit</option>
                      <option value="unfallwagen">Unfallwagen</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Zielland (optional)
                    </label>
                    <input
                      type="text"
                      name="zielland"
                      value={formData.zielland}
                      onChange={handleInputChange}
                      placeholder="z.B. Marokko, Ägypten"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Export-Notizen (optional)
                  </label>
                  <textarea
                    name="export_notes"
                    value={formData.export_notes}
                    onChange={handleInputChange}
                    placeholder="z.B. 'Netto-Preis gemäß §25a', 'Ausfuhrlieferung'..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{tForm("images.title")}</h2>
            <p className="text-sm text-gray-600 mb-4">{tForm("images.hint", { max: MAX_IMAGES })}</p>
            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-kfz-blue transition-colors">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageSelection}
                disabled={formLoading || selectedFiles.length >= MAX_IMAGES}
                className="sr-only"
              />
              <span className="font-medium text-gray-900">{tForm("images.select")}</span>
              <span className="block text-xs text-gray-500 mt-1">
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
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
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
                    <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {progress && (
            <p role="status" className="text-sm text-gray-700">{progress}</p>
          )}

          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-kfz-blue text-white rounded-lg hover:bg-kfz-blue-dark font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {formLoading ? "Wird erstellt..." : "Fahrzeug erstellen"}
            </button>
            <Link href="/admin/fahrzeuge" className="flex-1">
              <button
                type="button"
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Abbrechen
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
