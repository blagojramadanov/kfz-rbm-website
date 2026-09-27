"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useErrorMessage } from "@/lib/use-error-message";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, AlertCircle, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

type Status = "verifying" | "ready" | "invalid" | "done";

const MIN_PASSWORD_LENGTH = 8;

/**
 * Establishes the recovery session from the email link. Supported links:
 * - `?code=…` (PKCE, the default Supabase template with the browser client): the
 *   Supabase client exchanges the code itself while it initializes
 *   (`detectSessionInUrl`), using the code verifier cookie set by
 *   resetPasswordForEmail. A second exchangeCodeForSession would fail (the
 *   verifier is single-use), so we only wait for that and check the result. The
 *   link therefore only works in the browser that requested it.
 * - `?token_hash=…&type=recovery` (template with {{ .TokenHash }}): verifyOtp,
 *   works in any browser.
 * Supabase reports expired/used links as `error`/`error_code` in the query or hash.
 */
async function establishRecoverySession(): Promise<boolean> {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const hasError = ["error", "error_code", "error_description"].some((key) => query.has(key) || hash.has(key));
  if (hasError) return false;

  const tokenHash = query.get("token_hash");
  if (tokenHash && query.get("type") === "recovery") {
    const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
    return !error;
  }

  if (query.get("code")) {
    const { error } = await supabase.auth.initialize();
    if (error) return false;
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  }

  return false;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>("verifying");
  const startedRef = useRef(false);

  useEffect(() => {
    // The link is single-use: never verify it twice (effects can run twice in dev).
    if (startedRef.current) return;
    startedRef.current = true;
    establishRecoverySession()
      .catch((err) => {
        console.error("Password recovery link failed:", err);
        return false;
      })
      .then((ok) => {
        // Keep the one-time code out of the address bar and the history.
        window.history.replaceState(window.history.state, "", window.location.pathname);
        setStatus(ok ? "ready" : "invalid");
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t("auth.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwordsNotMatch"));
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setStatus("done");

      // The recovery session is a normal login: admins to /admin, customers to /dashboard.
      const { data: { user } } = await supabase.auth.getUser();
      let isAdmin = false;
      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        isAdmin = profile?.role === "ADMIN";
      }
      setTimeout(() => router.replace(isAdmin ? "/admin" : "/dashboard"), 1500);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const card = (content: React.ReactNode, centered = true) => (
    <div className="min-h-screen bg-gradient-to-br from-kfz-blue via-kfz-blue-light to-kfz-blue-dark text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className={`bg-white/10 backdrop-blur-md rounded-lg shadow-2xl p-8 border border-white/20${centered ? " text-center" : ""}`}>
          {content}
        </div>
      </div>
    </div>
  );

  if (status === "verifying") {
    return card(<p className="text-blue-100">{t("auth.verifyingResetLink")}</p>);
  }

  if (status === "invalid") {
    return card(
      <>
        <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t("auth.invalidResetLink")}</h2>
        <p className="text-blue-100 mb-6">{t("auth.invalidResetLinkDesc")}</p>
        <Link href="/forgot-password">
          <Button className="w-full bg-kfz-accent hover:bg-kfz-accent-light text-white font-semibold">
            {t("auth.requestNewReset")}
          </Button>
        </Link>
      </>
    );
  }

  if (status === "done") {
    return card(
      <>
        <div className="mb-4 flex justify-center">
          <div className="bg-green-500/20 rounded-full p-4">
            <CheckCircle className="w-12 h-12 text-green-300" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">{t("auth.passwordUpdatedTitle")}</h2>
        <p className="text-blue-100">{t("auth.passwordUpdatedRedirect")}</p>
      </>
    );
  }

  return card(
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("auth.newPasswordTitle")}</h1>
        <p className="text-blue-100">{t("auth.newPasswordDescription")}</p>
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
          <label className="block text-sm font-medium mb-2">{t("auth.newPassword")}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-blue-200" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder={t("auth.passwordMinLength")}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-kfz-accent focus:border-transparent"
            />
          </div>
          <p className="text-xs text-blue-200 mt-1">{t("auth.passwordMinLength")}</p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium mb-2">{t("auth.repeatPassword")}</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-blue-200" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
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
          {loading ? t("auth.savingPassword") : t("auth.savePassword")}
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </form>

      {/* Back to Login */}
      <div className="mt-6 text-center">
        <Link href="/login" className="text-blue-100 hover:text-white transition-colors">
          {t("auth.backToLogin")}
        </Link>
      </div>
    </>,
    false
  );
}
