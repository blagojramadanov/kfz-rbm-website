/**
 * Error codes and result type for server actions (and the client auth helpers).
 *
 * Server actions never return or throw human-readable text. They return
 * `{ ok: false, error: CODE }`; the UI turns the code into a translated message
 * with useErrorMessage() (lib/use-error-message.ts -> messages `errors.codes.*`).
 * Throwing is not an option: in production builds Next.js replaces the message of
 * an error thrown in a server action, so a thrown code would never reach the client.
 */

export const ACTION_ERROR_CODES = [
  // generic
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
  // authentication (lib/auth-context.tsx, app/actions/auth.ts)
  "INVALID_CREDENTIALS",
  "EMAIL_NOT_CONFIRMED",
  "EMAIL_TAKEN",
  "WEAK_PASSWORD",
  "SAME_PASSWORD",
  "INVALID_CURRENT_PASSWORD",
  "RATE_LIMITED",
  "NETWORK",
  "UNKNOWN",
] as const;

export type ActionErrorCode = (typeof ACTION_ERROR_CODES)[number];

export type ActionResult<T extends object = {}> =
  | ({ ok: true } & T)
  | { ok: false; error: ActionErrorCode };

/** Throw inside runAction() to end it with a specific code. */
export class ActionError extends Error {
  constructor(public readonly code: ActionErrorCode) {
    super(code);
    this.name = "ActionError";
  }
}

export function isActionErrorCode(value: unknown): value is ActionErrorCode {
  return typeof value === "string" && (ACTION_ERROR_CODES as readonly string[]).includes(value);
}

/** Maps a thrown error (e.g. requireAdmin()'s "FORBIDDEN") to a code; anything else is `fallback`. */
export function toErrorCode(error: unknown, fallback: ActionErrorCode = "UNKNOWN"): ActionErrorCode {
  if (error instanceof ActionError) return error.code;
  const message = error instanceof Error ? error.message : undefined;
  return isActionErrorCode(message) ? message : fallback;
}

/**
 * Runs an action body and turns any thrown error into `{ ok: false, error }`.
 * Unexpected errors are logged with the action name (server log only).
 */
export async function runAction<T extends object>(
  name: string,
  fallback: ActionErrorCode,
  body: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await body();
    return { ok: true, ...data };
  } catch (error) {
    const code = toErrorCode(error, fallback);
    if (!(error instanceof ActionError)) console.error(`[${name}]`, error);
    return { ok: false, error: code };
  }
}
