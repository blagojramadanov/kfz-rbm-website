"use client";

import { AlertCircle } from "lucide-react";

export function SubmissionWorkflowInfo() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex gap-3 mb-6">
        <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-blue-900 mb-1">Fahrzeug-Veröffentlichungsprozess</h3>
          <p className="text-sm text-blue-800">
            Erfahren Sie, wie Ihre eingereichten Fahrzeuge veröffentlicht werden
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Step 1 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div className="w-0.5 h-12 bg-blue-300 mt-2"></div>
          </div>
          <div className="pb-6">
            <h4 className="font-semibold text-gray-900">Fahrzeug einreichen</h4>
            <p className="text-sm text-gray-600 mt-1">
              Sie reichen Ihr Fahrzeug über das Formular ein und laden Fotos hoch.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div className="w-0.5 h-12 bg-blue-300 mt-2"></div>
          </div>
          <div className="pb-6">
            <h4 className="font-semibold text-gray-900">Admin-Überprüfung</h4>
            <p className="text-sm text-gray-600 mt-1">
              Unser Team überprüft Ihr Fahrzeug auf Qualität, Genauigkeit und Marktfähigkeit.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div className="w-0.5 h-12 bg-blue-300 mt-2"></div>
          </div>
          <div className="pb-6">
            <h4 className="font-semibold text-gray-900">Genehmigung und Veröffentlichung</h4>
            <p className="text-sm text-gray-600 mt-1">
              Bei Genehmigung wird Ihr Fahrzeug als &quot;Kundenfahrzeug&quot; in unseren Katalog aufgenommen und ist öffentlich sichtbar.
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold flex-shrink-0">
              ✓
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Fahrzeug ist live!</h4>
            <p className="text-sm text-gray-600 mt-1">
              Interessierte können Ihr Fahrzeug sehen, Anfragen stellen und Probefahrten buchen.
            </p>
          </div>
        </div>
      </div>

      {/* Important Note */}
      <div className="mt-6 p-4 bg-white border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">Wichtig:</span> Nur genehmigt Fahrzeuge werden öffentlich angezeigt. Sie können abgelehnte Fahrzeuge erneut einreichen.
        </p>
      </div>
    </div>
  );
}
