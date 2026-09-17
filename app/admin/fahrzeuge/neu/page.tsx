"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminCreateVehiclePage() {
  const router = useRouter();
  const { loading, isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    vin: "",
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
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/admin-access-denied");
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
    if (!formData.vin || !formData.brand || !formData.model) {
      setError("Bitte füllen Sie alle erforderlichen Felder aus");
      return;
    }

    try {
      setFormLoading(true);
      setError("");
      const { createVehicle } = await import("@/app/actions/admin");
      const result = await createVehicle(formData);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/admin/fahrzeuge/${result.vehicleId}`);
      }, 1000);
    } catch (err) {
      console.error("Error creating vehicle:", err);
      setError("Fehler beim Erstellen des Fahrzeugs: " + (err instanceof Error ? err.message : "Unbekannter Fehler"));
    } finally {
      setFormLoading(false);
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

        {success && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium">Fahrzeug erfolgreich erstellt! Wird weitergeleitet...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                VIN *
              </label>
              <input
                type="text"
                name="vin"
                value={formData.vin}
                onChange={handleInputChange}
                placeholder="Fahrzeug-Identifizierungsnummer"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
              />
            </div>
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
          </div>

          <div className="grid md:grid-cols-2 gap-6">
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
