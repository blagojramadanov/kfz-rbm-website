"use client";

import { useState } from "react";
import { Link } from "@/lib/navigation";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { useErrorMessage } from "@/lib/use-error-message";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, AlertCircle, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const params = useParams();
  const locale = params.locale as string || 'de';
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
      await resetPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-kfz-blue via-kfz-blue-light to-kfz-blue-dark text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-2xl p-8 border border-white/20 text-center">
            <div className="mb-4 flex justify-center">
              <div className="bg-green-500/20 rounded-full p-4">
                <CheckCircle className="w-12 h-12 text-green-300" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("auth.passwordResetSent")}</h2>
            <p className="text-blue-100 mb-6">
              {t("auth.passwordResetSent")}
            </p>
            <Link href={`/login`}>
              <Button className="w-full bg-kfz-accent hover:bg-kfz-accent-light text-white font-semibold">
                Zur Anmeldung zurück
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-kfz-blue via-kfz-blue-light to-kfz-blue-dark text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Passwort zurücksetzen</h1>
            <p className="text-blue-100">
              Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen
              Anweisungen zum Zurücksetzen Ihres Passworts
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 mb-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">
                E-Mail-Adresse
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-blue-200" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ihre@email.com"
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-kfz-accent focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-kfz-accent hover:bg-kfz-accent-light text-white font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? "Wird gesendet..." : "Passwort-Reset anfordern"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="text-sm text-blue-100">{t("forms.divider")}</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>

          {/* Back to Login */}
          <p className="text-center text-blue-100">
            <Link href="/login" className="text-white font-semibold hover:underline">
              Zurück zur Anmeldung
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
