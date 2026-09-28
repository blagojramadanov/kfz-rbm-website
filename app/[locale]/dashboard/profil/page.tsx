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
import { PageHeader } from "@/components/page-header";

export default function ProfilePage() {
  const params = useParams();
  const locale = params.locale as string || 'de';
  const router = useRouter();
  const t = useTranslations("dashboard.profile");
  const tCommon = useTranslations("common");
  const { profile, loading, isAuthenticated, updateProfile, changePassword } = useAuth();
  const tNav = useTranslations("navigation");
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
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{tCommon("loading")}</p>
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
      setMessage({ type: "success", text: t("messages.profileUpdated") });
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
      setMessage({ type: "error", text: t("messages.passwordsNotMatch") });
      setSaving(false);
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setMessage({ type: "error", text: t("messages.passwordTooShort") });
      setSaving(false);
      return;
    }

    try {
      await changePassword(passwordForm.current_password, passwordForm.new_password);
      setMessage({ type: "success", text: t("messages.passwordChanged") });
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
    <div className="min-h-screen bg-muted">
      <PageHeader
        title={t("title")}
        description={t("description")}
        backHref="/dashboard"
        backLabel={tNav("dashboard")}
        width="narrow"
      />

      <main className="page-container-narrow">
        {/* Tabs */}
        <div className="card mb-8">
          <div className="border-b border-border px-8">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                  activeTab === "profile"
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                {t("tabs.profile")}
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                  activeTab === "password"
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                <Lock className="w-4 h-4 inline mr-2" />
                {t("tabs.security")}
              </button>
            </div>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`mx-8 mt-6 p-4 rounded-lg flex gap-3 ${
              message.type === "success"
                ? "bg-success-subtle/50 border border-success-border"
                : "bg-destructive-subtle/50 border border-destructive-border"
            }`}>
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${message.type === "success" ? "text-success-subtle-foreground" : "text-destructive-subtle-foreground"}`}>
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
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t("form.email")}
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="field bg-muted text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t("form.emailDisabled")}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t("form.fullName")}
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={profileForm.full_name}
                      onChange={handleProfileChange}
                      placeholder={t("form.placeholder.fullName")}
                      className="field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t("form.phone")}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                      placeholder={t("form.placeholder.phone")}
                      className="field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t("form.company")}
                    </label>
                    <input
                      type="text"
                      name="company_name"
                      value={profileForm.company_name}
                      onChange={handleProfileChange}
                      placeholder={t("form.placeholder.company")}
                      className="field"
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-4">
                  <Link href="/dashboard">
                    <Button variant="outline" >
                      {t("buttons.cancel")}
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={saving}

                  >
                    {saving ? t("buttons.saving") : t("buttons.save")}
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
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("password.current")}
                  </label>
                  <input
                    type="password"
                    name="current_password"
                    value={passwordForm.current_password}
                    onChange={handlePasswordChange}
                    required
                    className="field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("password.new")}
                  </label>
                  <input
                    type="password"
                    name="new_password"
                    value={passwordForm.new_password}
                    onChange={handlePasswordChange}
                    required
                    placeholder={t("password.newPlaceholder")}
                    className="field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("password.confirm")}
                  </label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={passwordForm.confirm_password}
                    onChange={handlePasswordChange}
                    required
                    className="field"
                  />
                </div>

                <div className="flex gap-4 justify-end pt-4">
                  <Link href="/dashboard">
                    <Button variant="outline" >
                      {t("buttons.cancel")}
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={saving}

                  >
                    {saving ? t("buttons.changingPassword") : t("buttons.changePassword")}
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
