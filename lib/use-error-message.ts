import { useTranslations } from "next-intl";
import { ActionError } from "@/lib/action-result";

/**
 * Turns an error code (or a failed ActionResult, or anything caught in a catch
 * block) into a translated message from `errors.codes.*`. Unknown codes and
 * anything that is not a code fall back to `errors.codes.UNKNOWN`, so a raw code
 * or a technical message never reaches the user.
 */
export function useErrorMessage() {
  const t = useTranslations("errors.codes");

  return (value: unknown): string => {
    let code: unknown = value;
    if (value instanceof ActionError) code = value.code;
    else if (value instanceof Error) code = value.message;
    else if (value && typeof value === "object" && "error" in value) code = (value as { error: unknown }).error;

    return typeof code === "string" && /^[A-Z_]+$/.test(code) && t.has(code) ? t(code) : t("UNKNOWN");
  };
}
