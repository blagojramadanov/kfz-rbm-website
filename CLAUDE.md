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
