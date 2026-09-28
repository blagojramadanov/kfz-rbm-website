"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { useErrorMessage } from "@/lib/use-error-message";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, Lock, AlertCircle } from "lucide-react";

/**
 * `next` is a path without locale (the navigation router adds the current one).
 * Only same-site paths are accepted: no scheme, no "//host", no backslashes, and
 * not the auth pages themselves.
 */
function getSafeNextPath(value: string | null): string | null {
  if (!value || value.length > 500) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  if (/[\u0000-\u001f]/.test(value)) return null;
  if (/^\/(login|register)(\/|\?|$)/.test(value)) return null;
  return value;
}

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations();
  const errorMessage = useErrorMessage();
  const { signIn, isAuthenticated, profile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // `next` is read once on mount and the redirect happens once: a later run of the
  // redirect effect (profile re-set after SIGNED_IN, token refresh) could otherwise
  // read a URL the router has already changed and fall back to the dashboard.
  const nextPathRef = useRef<string | null | undefined>(undefined);
  const redirectedRef = useRef(false);
  useEffect(() => {
    if (nextPathRef.current === undefined) {
      nextPathRef.current = getSafeNextPath(new URLSearchParams(window.location.search).get("next"));
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !profile || redirectedRef.current) return;
    redirectedRef.current = true;
    // Back to where the login was requested (e.g. the favorite heart), same locale.
    // Without a valid `next`: admins to /admin, customers to /dashboard.
    const next = nextPathRef.current;
    if (next) {
      router.replace(next);
    } else {
      router.replace(profile.role === "ADMIN" ? "/admin" : "/dashboard");
    }
  }, [isAuthenticated, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      // Redirect will happen via useEffect above
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-kfz-blue via-kfz-blue-light to-kfz-blue-dark text-primary-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="mb-8">
            <h1 className="page-title mb-2">{t("auth.welcomeBack")}</h1>
            <p className="text-primary-foreground/80">
              {t("auth.signInMessage")}
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
          <form onSubmit={handleSubmit} className="space-y-5">
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("auth.password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-primary-foreground/70" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="field-inverse"
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                href={`/forgot-password`}
                className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>

            {/* Submit Button */}
            <Button variant="accent"
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? t("common.loading") : t("auth.signIn")}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="text-sm text-primary-foreground/80">{t("common.orElse")}</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-primary-foreground/80">
            {t("auth.dontHaveAccount")}{" "}
            <Link href={`/register`} className="text-primary-foreground font-semibold hover:underline">
              {t("auth.signUp")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
