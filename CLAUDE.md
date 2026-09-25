@AGENTS.md

## Translation rules

These apply to every session; follow them without being reminded.

- German uses the formal "Sie". Macedonian uses the formal "Вие" (never "ти"; no singular imperatives such as "Филтрирај" — use "Филтрирајте").
- Files are UTF-8 without BOM. Never write files via PowerShell (use the Edit/Write tools or a POSIX shell).
- Never translate DB values. Enum-like DB values (fuel type, transmission, ...) go through the label helpers in `lib/vehicle-labels.ts`, which use `t.has()` and fall back to the raw value.
- "RBM" and "Premium Cars" stay untranslated.
- Every new message key is added to `messages/de.json`, `messages/en.json` and `messages/mk.json` at once.
- `npm run check:i18n` and `npm run build` must both pass before committing.
- Update `I18N_PROGRESS.md` after finishing each area.

## Workflow

Every task ends with build + check:i18n passing, I18N_PROGRESS.md updated, commit with a clear message, push to main, confirm Vercel Ready, report the commit hash.

## Localization rules

- **Client-side number formatting**: Use `useLocaleFormatter()` from `lib/use-locale-formatter.ts` instead of `useFormatter().number()`, `Intl.NumberFormat` directly, or `toLocaleString()`. The wrapper maps unsupported locales (mk) to supported ones (de-DE) to avoid browser Intl fallback to en-US. Server-side formatters (`getFormatter()`) work correctly for all locales.
- **Date formatting**: Server-side dates use `getFormatter()` (full Intl support). Client-side dates **also work correctly** because the browser Intl API has date/time data for "mk"; only number formatting falls back to en-US when the browser lacks numeric data. Do not use the wrapper for dates.

## Security rules

- Every server action starts with `requireUser()` or `requireAdmin()` from `lib/auth-guards.ts` and uses the session user. Never trust a user id, role, status or price sent by the client; validate input with zod (unknown fields are stripped).
- Use the RLS-bound session client. The service-role client (`lib/supabase-admin.ts`) only after those checks and only where RLS forbids the write.
- `/{locale}/dashboard/**` and `/{locale}/admin/**` are guarded server-side in `middleware.ts` (and client-side in the pages); a new protected area must be added to the middleware. The middleware does not protect server actions.
