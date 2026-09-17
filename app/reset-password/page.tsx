"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, AlertCircle, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setToken(searchParams.get("token"));
  }, []);

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-kfz-blue via-kfz-blue-light to-kfz-blue-dark text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-2xl p-8 border border-white/20 text-center">
            <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Ungültiger Link</h2>
            <p className="text-blue-100 mb-6">
              Der Password-Reset-Link ist ungültig oder abgelaufen.
            </p>
            <Link href="/forgot-password">
              <Button className="w-full bg-kfz-accent hover:bg-kfz-accent-light text-white font-semibold">
                Neuen Reset anfordern
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const validatePassword = (pwd: string) => pwd.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError("Passwort muss mindestens 8 Zeichen lang sein");
      setLoading(false);
      return;
    }

    try {
      await updatePassword(password);
      setSubmitted(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Fehler beim Zurücksetzen des Passworts"
      );
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
            <h2 className="text-2xl font-bold mb-2">Passwort aktualisiert!</h2>
            <p className="text-blue-100">
              Ihr Passwort wurde erfolgreich zurückgesetzt. Sie werden zum
              Dashboard weitergeleitet...
            </p>
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
            <h1 className="text-3xl font-bold mb-2">Neues Passwort setzen</h1>
            <p className="text-blue-100">
              Geben Sie Ihr neues Passwort ein
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
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Neues Passwort
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-blue-200" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mindestens 8 Zeichen"
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-kfz-accent focus:border-transparent"
                />
              </div>
              <p className="text-xs text-blue-200 mt-1">
                Mindestens 8 Zeichen erforderlich
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Passwort wiederholen
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-blue-200" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-kfz-accent focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-kfz-accent hover:bg-kfz-accent-light text-white font-semibold py-2 rounded-lg transition-all disabled:opacity-50 mt-6"
            >
              {loading ? "Wird gespeichert..." : "Passwort aktualisieren"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link href="/login" className="text-blue-100 hover:text-white transition-colors">
              Zurück zur Anmeldung
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
