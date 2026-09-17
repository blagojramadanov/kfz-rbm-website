"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminAccessDeniedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-red-100 rounded-full p-6">
            <AlertCircle className="w-16 h-16 text-red-600" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Zugriff verweigert
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Sie haben keine Berechtigung, auf den Admin-Bereich zuzugreifen. Nur
          Administratoren können auf diese Seite zugreifen.
        </p>

        <div className="space-y-3">
          <Link href="/">
            <Button className="w-full bg-kfz-blue hover:bg-kfz-blue-dark text-white font-semibold">
              Zur Startseite zurück
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>

          <Link href="/dashboard">
            <Button variant="outline" className="w-full border-kfz-blue text-kfz-blue hover:bg-kfz-blue hover:text-white">
              Zum Dashboard
            </Button>
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Wenn Sie ein Administrator sein sollten, kontaktieren Sie bitte den
          Support.
        </p>
      </div>
    </div>
  );
}
