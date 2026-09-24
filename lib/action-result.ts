/**
 * Return type for server actions that the UI calls directly.
 *
 * Actions return `{ ok: false, error: CODE }` instead of throwing: a thrown error
 * becomes an HTTP 500 and an error page in production, and its message is not
 * translatable. The UI maps the code to `actionErrors.<CODE>` in messages/*.json.
 */

export const ACTION_ERROR_CODES = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "INVALID_INPUT",
  "INVALID_STATE",
  "DUPLICATE_VIN",
  "CREATE_FAILED",
  "UPDATE_FAILED",
  "DELETE_FAILED",
  "UPLOAD_FAILED",
  "LOAD_FAILED",
  "UNKNOWN",
] as const;

export type ActionErrorCode = (typeof ACTION_ERROR_CODES)[number];

export type ActionResult<T extends object = {}> =
  | ({ ok: true } & T)
  | { ok: false; error: ActionErrorCode };

export function isActionErrorCode(value: unknown): value is ActionErrorCode {
  return typeof value === "string" && (ACTION_ERROR_CODES as readonly string[]).includes(value);
}

/** Maps a thrown error (e.g. from requireAdmin(): "UNAUTHORIZED") to a code; anything else is `fallback`. */
export function toErrorCode(error: unknown, fallback: ActionErrorCode = "UNKNOWN"): ActionErrorCode {
  const message = error instanceof Error ? error.message : undefined;
  return isActionErrorCode(message) ? message : fallback;
}
