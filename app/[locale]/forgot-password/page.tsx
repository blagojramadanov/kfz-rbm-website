"use client";

import { useState } from "react";
import { Link } from "@/lib/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { useErrorMessage } from "@/lib/use-error-message";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, AlertCircle, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await resetPassword(email, locale);
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
            <h2 className="text-2xl font-bold mb-2">{t("auth.resetEmailSentTitle")}</h2>
            <p className="text-primary-foreground/80 mb-6">
              {t("auth.passwordResetSent")}
            </p>
            <Link href={`/login`}>
              <Button variant="accent" className="w-full">
                {t("auth.backToLogin")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-kfz-blue via-kfz-blue-light to-kfz-blue-dark text-primary-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="mb-8">
            <h1 className="page-title mb-2">{t("auth.passwordResetTitle")}</h1>
            <p className="text-primary-foreground/80">
              {t("auth.forgotPasswordDescription")}
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("forms.email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-primary-foreground/70" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="user@example.com"
                  className="field-inverse"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button variant="accent"
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? t("common.loading") : t("auth.sendResetLink")}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="text-sm text-primary-foreground/80">{t("forms.divider")}</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>

          {/* Back to Login */}
          <p className="text-center text-primary-foreground/80">
            <Link href="/login" className="text-primary-foreground font-semibold hover:underline">
              {t("auth.backToLogin")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
