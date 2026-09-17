"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, Lock, User, AlertCircle, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, isAuthenticated } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (isAuthenticated) {
    router.push("/dashboard");
    return null;
  }

  const validatePassword = (pwd: string) => pwd.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!fullName.trim()) {
      setError("Bitte geben Sie Ihren Namen ein");
      setLoading(false);
      return;
    }

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
      await signUp(email, password, fullName);
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Registrierung fehlgeschlagen"
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
            <h2 className="text-2xl font-bold mb-2">Registrierung erfolgreich!</h2>
            <p className="text-blue-100 mb-6">
              Bitte überprüfen Sie Ihr E-Mail-Postfach, um Ihr Konto zu bestätigen.
            </p>
            <Link href="/login">
              <Button className="w-full bg-kfz-accent hover:bg-kfz-accent-light text-white font-semibold">
                Zur Anmeldung
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-kfz-blue via-kfz-blue-light to-kfz-blue-dark text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Konto erstellen</h1>
            <p className="text-blue-100">
              Werden Sie KFZ RBM Mitglied und entdecken Sie Ihre Traumautos
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Vollständiger Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-blue-200" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Max Mustermann"
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-kfz-accent focus:border-transparent"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">
                E-Mail
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Passwort
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
              {loading ? "Wird registriert..." : "Konto erstellen"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="text-sm text-blue-100">oder</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>

          {/* Login Link */}
          <p className="text-center text-blue-100">
            Haben Sie bereits ein Konto?{" "}
            <Link href="/login" className="text-white font-semibold hover:underline">
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
