"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { useErrorMessage } from "@/lib/use-error-message";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'de';
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const { signUp, isAuthenticated, profile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isAuthenticated && profile) {
      // Redirect based on user role
      if (profile.role === "ADMIN") {
        router.push(`/admin`);
      } else {
        router.push(`/dashboard`);
      }
    }
  }, [isAuthenticated, profile, router, locale]);

  const validatePassword = (pwd: string) => pwd.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!fullName.trim()) {
      setError(t("validation.required"));
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.passwordsNotMatch"));
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError(t("validation.passwordTooShort"));
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password, fullName);
      setSubmitted(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-kfz-blue via-kfz-blue-light to-kfz-blue-dark text-primary-foreground flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-2xl p-8 border border-white/20 text-center">
            <div className="mb-4 flex justify-center">
              <div className="bg-success/20 rounded-full p-4">
                <CheckCircle className="w-12 h-12 text-success-border" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("auth.registrationSuccess")}</h2>
            <p className="text-primary-foreground/80 mb-6">
              {t("pages.contact.contactInfo")}
            </p>
            <Link href={`/login`}>
              <Button variant="accent" className="w-full">
                {t("auth.signIn")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-kfz-blue via-kfz-blue-light to-kfz-blue-dark text-primary-foreground flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="mb-8">
            <h1 className="page-title mb-2">{t("auth.createAccount")}</h1>
            <p className="text-primary-foreground/80">
              {t("auth.createAccountMessage")}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/20 border border-destructive-border/50 rounded-lg p-4 mb-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive-border flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive-subtle">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("forms.fullName")}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-primary-foreground/70" />
                <input
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder={t("forms.fullNamePlaceholder")}
                  className="field-inverse"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("forms.email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-primary-foreground/70" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ihre@email.com"
                  className="field-inverse"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("auth.password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-primary-foreground/70" />
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="field-inverse"
                />
              </div>
              <p className="text-xs text-primary-foreground/70 mt-1">
                {t("validation.passwordTooShort")}
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("auth.confirmPassword")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-primary-foreground/70" />
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="field-inverse"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button variant="accent"
              type="submit"
              disabled={loading}
              className="w-full mt-6"
            >
              {loading ? t("common.loading") : t("auth.createAccount")}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="text-sm text-primary-foreground/80">{t("forms.divider")}</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>

          {/* Login Link */}
          <p className="text-center text-primary-foreground/80">
            {t("auth.haveAccount")}{" "}
            <Link href="/login" className="text-primary-foreground font-semibold hover:underline">
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
