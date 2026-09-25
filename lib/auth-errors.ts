import { ActionError, type ActionErrorCode } from "@/lib/action-result";

/**
 * Maps a Supabase Auth error (English text, only meant for developers) to one of
 * our codes. Unknown errors become UNKNOWN; the original is only logged.
 */
export function authErrorCode(error: { code?: string; status?: number; message?: string } | null | undefined): ActionErrorCode {
  if (!error) return "UNKNOWN";
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();

  if (code === "invalid_credentials" || message.includes("invalid login credentials")) return "INVALID_CREDENTIALS";
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) return "EMAIL_NOT_CONFIRMED";
  if (code === "user_already_exists" || code === "email_exists" || message.includes("already registered")) return "EMAIL_TAKEN";
  if (code === "weak_password" || message.includes("password should be")) return "WEAK_PASSWORD";
  if (code === "same_password" || message.includes("should be different from the old")) return "SAME_PASSWORD";
  if (code.startsWith("over_") || error.status === 429 || message.includes("rate limit")) return "RATE_LIMITED";
  if (message.includes("fetch") || message.includes("network")) return "NETWORK";
  if (code === "session_not_found" || code === "session_expired" || message.includes("auth session missing")) return "UNAUTHORIZED";
  return "UNKNOWN";
}

/** Throws an ActionError for a Supabase Auth error (client side; the UI translates it). */
export function throwAuthError(error: { code?: string; status?: number; message?: string }): never {
  const code = authErrorCode(error);
  if (code === "UNKNOWN") console.error("Auth error:", error);
  throw new ActionError(code);
}
