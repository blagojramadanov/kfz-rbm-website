"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AlertCircle, Download } from "lucide-react";

export default function AdminExportPage() {
  const router = useRouter();
  const { loading, isAdmin } = useAuth();
  const [exportType, setExportType] = useState("vehicles");
  const [format, setFormat] = useState("csv");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/admin-access-denied");
    }
  }, [loading, isAdmin, router]);

  const handleExport = async () => {
    try {
      setExporting(true);
      setError("");
      setSuccess("");

      // Generate data based on export type
      let data: any[] = [];
      let filename = "";

      if (exportType === "vehicles") {
        const { getVehicles } = await import("@/app/actions/admin");
        data = await getVehicles({});
        filename = `fahrzeuge_${new Date().toISOString().split("T")[0]}.${format}`;
      } else if (exportType === "customers") {
        const { getCustomers } = await import("@/app/actions/admin");
        data = await getCustomers();
        filename = `kunden_${new Date().toISOString().split("T")[0]}.${format}`;
      } else if (exportType === "inquiries") {
        const { getInquiries } = await import("@/app/actions/admin");
        data = await getInquiries({});
        filename = `anfragen_${new Date().toISOString().split("T")[0]}.${format}`;
      } else if (exportType === "trade-ins") {
        const { getTradeInRequests } = await import("@/app/actions/admin");
        data = await getTradeInRequests({});
        filename = `inzahlungnahmen_${new Date().toISOString().split("T")[0]}.${format}`;
      }

      if (format === "csv") {
        // Convert to CSV
        if (data.length === 0) {
          setError("Keine Daten zum Exportieren gefunden.");
          return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
          headers.join(","),
          ...data.map((row) =>
            headers.map((header) => {
              const value = row[header];
              if (value === null || value === undefined) return "";
              if (typeof value === "string" && value.includes(",")) {
                return `"${value}"`;
              }
              return value;
            }).join(",")
          ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();

        setSuccess(`${data.length} Datensätze erfolgreich exportiert.`);
      } else if (format === "json") {
        // Export as JSON
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename.replace(".csv", ".json");
        link.click();

        setSuccess(`${data.length} Datensätze erfolgreich exportiert.`);
      }
    } catch (err) {
      console.error("Error exporting:", err);
      setError("Fehler beim Exportieren: " + (err instanceof Error ? err.message : "Unbekannter Fehler"));
    } finally {
      setExporting(false);
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Daten exportieren</h1>
        <p className="text-gray-600 mt-1">Exportieren Sie Ihre Daten in verschiedenen Formaten</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800 font-medium">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Was möchten Sie exportieren?
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="vehicles"
                  checked={exportType === "vehicles"}
                  onChange={(e) => setExportType(e.target.value)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-900">
                  Fahrzeuge
                  <span className="text-gray-600 ml-2">(aus dem Inventar)</span>
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="customers"
                  checked={exportType === "customers"}
                  onChange={(e) => setExportType(e.target.value)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-900">
                  Kunden
                  <span className="text-gray-600 ml-2">(alle registrierten Kunden)</span>
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="inquiries"
                  checked={exportType === "inquiries"}
                  onChange={(e) => setExportType(e.target.value)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-900">
                  Anfragen
                  <span className="text-gray-600 ml-2">(Kundenanfragen)</span>
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="trade-ins"
                  checked={exportType === "trade-ins"}
                  onChange={(e) => setExportType(e.target.value)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-900">
                  Inzahlungnahmen
                  <span className="text-gray-600 ml-2">(Tausch- und Inzahlungnahmeanfragen)</span>
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Exportformat
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === "csv"}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-900">
                  CSV (Kommagetrennte Werte)
                  <span className="text-gray-600 ml-2">(für Excel/Tabellenkalkulation)</span>
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={format === "json"}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-900">
                  JSON (JavaScript Object Notation)
                  <span className="text-gray-600 ml-2">(für Entwickler/APIs)</span>
                </span>
              </label>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Info:</strong> Der Export enthält alle verfügbaren Daten des ausgewählten Typs.
              Sensible Informationen sind enthalten (z.B. Kundentelefone, Provisionen).
            </p>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-kfz-blue text-white rounded-lg hover:bg-kfz-blue-dark font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            {exporting ? "Wird exportiert..." : "Jetzt exportieren"}
          </button>
        </form>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Häufig gestellte Fragen</h3>
        <div className="space-y-4">
          <div>
            <p className="font-medium text-gray-900">Welche Formate werden unterstützt?</p>
            <p className="text-sm text-gray-600 mt-1">
              Wir unterstützen CSV (für Excel/Tabellenkalkulation) und JSON (für
              Entwickler/APIs).
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Sind sensible Daten in den Exporten enthalten?</p>
            <p className="text-sm text-gray-600 mt-1">
              Ja, Exporte enthalten alle verfügbaren Daten, einschließlich
              Kundentelefone, E-Mails und Provisionen. Lagern Sie diese sicher.
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Wie häufig kann ich exportieren?</p>
            <p className="text-sm text-gray-600 mt-1">
              Sie können jederzeit exportieren. Es gibt keine Limits, aber die
              Datenmenge kann groß sein.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
