"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, Save, ArrowLeft } from "lucide-react";
import { useErrorMessage } from "@/lib/use-error-message";
import { vehicleUpdateSchema } from "@/lib/vehicle-schema";
import { useVehicleValidation } from "@/lib/use-vehicle-validation";
import { getFuelTypeLabel, getTransmissionLabel, getVehicleStatusLabel } from "@/lib/vehicle-labels";

// DB values; labels come from common.* via lib/vehicle-labels.ts.
const TRANSMISSIONS = ["automatic", "manual", "cvt"] as const;
const FUEL_TYPES = ["gasoline", "diesel", "hybrid", "electric"] as const;
const VEHICLE_STATUSES = ["draft", "available", "reserved", "sold"] as const;

export default function AdminEditVehiclePage() {
  const tForm = useTranslations("adminVehicleForm");
  const tActions = useTranslations("adminVehicleActions");
  const tCommon = useTranslations("common");
  const tButtons = useTranslations("buttons");
  const errorMessage = useErrorMessage();
  const validateVehicle = useVehicleValidation();
  const router = useRouter();
  const params = useParams();
  const vehicleId = params?.id as string;
  const { loading, isAdmin } = useAuth();
  const [formData, setFormData] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    const loadVehicle = async () => {
      if (!vehicleId) return;
      try {
        setInitialLoading(true);
        const { getVehicleById } = await import("@/app/actions/admin");
        const result = await getVehicleById(vehicleId);
        if (!result.ok) {
          setError(errorMessage(result));
          return;
        }
        const { vehicle } = result;
        setFormData({
          vin: vehicle.vin,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          mileage: vehicle.mileage,
          price: vehicle.price,
          transmission: vehicle.transmission,
          fuel_type: vehicle.fuel_type,
          body_type: vehicle.body_type,
          color_exterior: vehicle.color_exterior,
          color_interior: vehicle.color_interior,
          engine_cc: vehicle.engine_cc,
          power_hp: vehicle.power_hp,
          description: vehicle.description,
          status: vehicle.status,
          featured: vehicle.featured,
        });
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setInitialLoading(false);
      }
    };

    if (isAdmin && vehicleId) loadVehicle();
  }, [vehicleId, isAdmin]);

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
    if (!formData.vin || !formData.brand || !formData.model) {
      setError(tForm("errors.requiredFields"));
      return;
    }
    const invalid = validateVehicle(vehicleUpdateSchema, formData);
    if (invalid) {
      setError(invalid);
      return;
    }

    try {
      setFormLoading(true);
      setError("");
      const { updateVehicle } = await import("@/app/actions/admin");
      const result = await updateVehicle(vehicleId, formData);
      if (!result.ok) {
        setError(`${tActions("updateFailed")} ${errorMessage(result)}`);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.push(`/admin/fahrzeuge/${vehicleId}`);
      }, 1000);
    } catch (err) {
      console.error("Error updating vehicle:", err);
      setError(`${tActions("updateFailed")} ${errorMessage(err)}`);
    } finally {
      setFormLoading(false);
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

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{tForm("loadingVehicle")}</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="space-y-6">
        <Link href="/admin/fahrzeuge">
          <button className="flex items-center gap-2 text-primary hover:text-primary-hover font-medium">
            <ArrowLeft className="w-4 h-4" />
            {tForm("backToList")}
          </button>
        </Link>
        <div className="bg-destructive-subtle/50 border border-destructive-border rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive-subtle-foreground">{error || tForm("loadFailed")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href={`/admin/fahrzeuge/${vehicleId}`}>
        <button className="flex items-center gap-2 text-primary hover:text-primary-hover font-medium">
          <ArrowLeft className="w-4 h-4" />
          {tForm("backToVehicle")}
        </button>
      </Link>

      <div className="card p-6">
        <h1 className="page-title text-foreground mb-2">{tForm("editTitle")}</h1>
        <p className="text-muted-foreground">
          {formData.year} {formData.brand} {formData.model}
        </p>

        {error && (
          <div className="mt-6 bg-destructive-subtle/50 border border-destructive-border rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive-subtle-foreground">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 bg-success-subtle/50 border border-success-border rounded-lg p-4">
            <p className="text-sm text-success-subtle-foreground font-medium">{tForm("updated")}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {tForm("fields.vin")} *
              </label>
              <input
                type="text"
                name="vin"
                value={formData.vin}
                onChange={handleInputChange}
                placeholder={tForm("placeholders.vin")}
                required
                className="field"
              />
            </div>
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
          </div>

          <div className="grid md:grid-cols-2 gap-6">
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

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {tForm("fields.status")}
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="field"
              >
                {VEHICLE_STATUSES.map((value) => (
                  <option key={value} value={value}>{getVehicleStatusLabel(tCommon, value)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-input"
                />
                <span className="text-sm font-medium text-foreground">{tForm("fields.featured")}</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-border">
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {formLoading ? tForm("saving") : tButtons("save")}
            </button>
            <Link href={`/admin/fahrzeuge/${vehicleId}`} className="flex-1">
              <button
                type="button"
                className="w-full px-4 py-3 border border-input text-foreground rounded-lg hover:bg-muted font-medium transition-colors"
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
