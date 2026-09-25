"use client";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { User, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { useErrorMessage } from "@/lib/use-error-message";

export default function ProfilePage() {
  const params = useParams();
  const locale = params.locale as string || 'de';
  const router = useRouter();
  const { profile, loading, isAuthenticated, updateProfile, changePassword } = useAuth();
  const errorMessage = useErrorMessage();

  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    company_name: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        company_name: profile.company_name || "",
      });
    }
  }, [profile]);

  if (loading || !isAuthenticated || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Wird geladen...</p>
        </div>
      </div>
    );
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    try {
      await updateProfile({
        full_name: profileForm.full_name,
        phone: profileForm.phone,
        company_name: profileForm.company_name,
      });
      setMessage({ type: "success", text: "Profil erfolgreich aktualisiert" });
    } catch (error) {
      setMessage({ type: "error", text: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);

    // Validate passwords
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ type: "error", text: "Passwörter stimmen nicht überein" });
      setSaving(false);
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setMessage({ type: "error", text: "Passwort muss mindestens 8 Zeichen lang sein" });
      setSaving(false);
      return;
    }

    try {
      await changePassword(passwordForm.current_password, passwordForm.new_password);
      setMessage({ type: "success", text: "Passwort erfolgreich geändert" });
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      setMessage({ type: "error", text: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/dashboard" className="text-kfz-blue hover:underline mb-2 inline-block">
            Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Profil
          </h1>
          <p className="text-gray-600 mt-1">
            Verwalten Sie Ihre Kontoinformationen und Sicherheitseinstellungen
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200 px-8">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                  activeTab === "profile"
                    ? "text-kfz-blue border-kfz-blue"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                Profilinformationen
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                  activeTab === "password"
                    ? "text-kfz-blue border-kfz-blue"
                    : "text-gray-600 border-transparent hover:text-gray-900"
                }`}
              >
                <Lock className="w-4 h-4 inline mr-2" />
                Sicherheit
              </button>
            </div>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`mx-8 mt-6 p-4 rounded-lg flex gap-3 ${
              message.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}>
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${message.type === "success" ? "text-green-800" : "text-red-800"}`}>
                {message.text}
              </p>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="p-8">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Die Email-Adresse kann nicht geändert werden</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vollständiger Name
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={profileForm.full_name}
                      onChange={handleProfileChange}
                      placeholder="z.B. Max Mustermann"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                      placeholder="z.B. +49 123 456789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unternehmen
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={profileForm.company_name}
                      onChange={handleProfileChange}
                      placeholder="z.B. Auto GmbH"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-4">
                  <Link href="/dashboard">
                    <Button variant="outline" className="border-gray-300">
                      Abbrechen
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-kfz-blue hover:bg-kfz-blue-dark text-white font-semibold"
                  >
                    {saving ? "Wird gespeichert..." : "Änderungen speichern"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <div className="p-8">
              <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aktuelles Passwort
                  </label>
                  <input
                    type="password"
                    name="current_password"
                    value={passwordForm.current_password}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Neues Passwort
                  </label>
                  <input
                    type="password"
                    name="new_password"
                    value={passwordForm.new_password}
                    onChange={handlePasswordChange}
                    required
                    placeholder="Mindestens 8 Zeichen"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passwort wiederholen
                  </label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={passwordForm.confirm_password}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kfz-blue focus:border-transparent"
                  />
                </div>

                <div className="flex gap-4 justify-end pt-4">
                  <Link href="/dashboard">
                    <Button variant="outline" className="border-gray-300">
                      Abbrechen
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-kfz-blue hover:bg-kfz-blue-dark text-white font-semibold"
                  >
                    {saving ? "Wird gespeichert..." : "Passwort ändern"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
