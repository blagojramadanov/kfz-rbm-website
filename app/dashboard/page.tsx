"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Car, MessageSquare, Heart, Plus, FileText, LogOut, ArrowRight, Repeat2 } from "lucide-react";
import Link from "next/link";
import { SubmissionWorkflowInfo } from "@/components/submission-workflow-info";

export default function DashboardPage() {
  const router = useRouter();
  const { profile, loading, isAuthenticated, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-kfz-blue to-kfz-blue-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-2">
            Willkommen, {profile.full_name}!
          </h1>
          <p className="text-blue-100 text-lg">
            Verwalten Sie Ihre Fahrzeuge und Profil
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Workflow Info */}
        <div className="mb-12">
          <SubmissionWorkflowInfo />
        </div>
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Link href="/dashboard/fahrzeuge">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Meine Fahrzeuge</p>
                  <p className="text-3xl font-bold text-gray-900">—</p>
                </div>
                <Car className="w-10 h-10 text-kfz-blue" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/anfragen">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Anfragen</p>
                  <p className="text-3xl font-bold text-gray-900">—</p>
                </div>
                <MessageSquare className="w-10 h-10 text-green-600" />
              </div>
            </div>
          </Link>

          <Link href="/dashboard/favoriten">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Favoriten</p>
                  <p className="text-3xl font-bold text-gray-900">—</p>
                </div>
                <Heart className="w-10 h-10 text-red-600" />
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Mitglied seit</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(profile.created_at).toLocaleDateString("de-DE")}
                </p>
              </div>
              <FileText className="w-10 h-10 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Submit Vehicle */}
          <Link href="/dashboard/fahrzeug-anbieten">
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <Plus className="w-6 h-6 text-kfz-blue" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Fahrzeug anbieten
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                Verkaufen Sie Ihr Fahrzeug über KFZ RBM. Einfach, schnell und sicher.
              </p>
              <Button className="bg-kfz-blue hover:bg-kfz-blue-dark text-white font-semibold w-full">
                <Plus className="mr-2 w-4 h-4" />
                Fahrzeug hinzufügen
              </Button>
            </div>
          </Link>

          {/* My Vehicles */}
          <Link href="/dashboard/fahrzeuge">
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <Car className="w-6 h-6 text-kfz-blue" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Meine Fahrzeuge
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                Verwalten Sie Ihre angebotenen Fahrzeuge, sehen Sie den Status und bearbeiten Sie Details.
              </p>
              <Button variant="outline" className="border-kfz-blue text-kfz-blue hover:bg-kfz-blue hover:text-white w-full">
                Fahrzeuge ansehen
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>

          {/* Inquiries */}
          <Link href="/dashboard/anfragen">
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-green-100 rounded-lg p-3">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Anfragen
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                Sehen Sie Anfragen von Interessenten zu Ihren Fahrzeugen und antworten Sie schnell.
              </p>
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white w-full">
                Anfragen ansehen
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>

          {/* Favorites */}
          <Link href="/dashboard/favoriten">
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-red-100 rounded-lg p-3">
                  <Heart className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Favoriten
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                Sehen Sie Ihre gespeicherten Fahrzeuge und verwalten Sie Ihre Favoriten.
              </p>
              <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white w-full">
                Favoriten ansehen
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>

          {/* Trade-In */}
          <Link href="/dashboard/inzahlungnahme">
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-purple-100 rounded-lg p-3">
                  <Repeat2 className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Inzahlungnahme
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                Tauschen Sie Ihr Fahrzeug gegen ein anderes aus unserem Bestand ein.
              </p>
              <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white w-full">
                Neue Anfrage
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>

          {/* Trade-In Requests */}
          <Link href="/dashboard/inzahlungnahme-anfragen">
            <div className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-indigo-100 rounded-lg p-3">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Meine Anfragen
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                Verwalten Sie Ihre Inzahlungnahmeanfragen und sehen Sie den aktuellen Status.
              </p>
              <Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white w-full">
                Anfragen ansehen
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>
        </div>

        {/* Profile & Logout */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/dashboard/profil">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Profil verwalten</h3>
              <p className="text-gray-600 mb-4">
                Bearbeiten Sie Ihre Profilinformationen, Passwort und Sicherheitseinstellungen.
              </p>
              <Button className="w-full bg-kfz-blue hover:bg-kfz-blue-dark text-white">
                Zum Profil
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Kontoaktionen</h3>
            <p className="text-gray-600 mb-4">
              Abmelden und eine neue Sitzung starten.
            </p>
            <Button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              <LogOut className="mr-2 w-4 h-4" />
              Abmelden
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
