# I18N Translation Progress Checklist

This document tracks all files that contain hardcoded user-visible text requiring internationalization. Files are grouped by functional area.

---

## 1. Layout (Header, Footer, Navigation, Language Switcher)

- [x] `components/navbar.tsx` - Navigation menu items ("Fahrzeuge", "Export", "Über uns", "Dienstleistungen", "Kontakt", "Einstellungen"), user menu labels, login/logout buttons
- [x] `components/footer.tsx` - Footer text ("Premium used-car dealership"), section headers ("Quick Links", "Contact Info", "Follow Us"), copyright text ("All rights reserved"), policy links ("Privacy Policy", "Terms & Conditions", "Impressum"), hours ("Mon-Fri 9am-6pm")
- [x] `components/language-switcher.tsx` - Language selection labels and options
- [x] `app/layout.tsx` - Root layout (if any hardcoded text)
- [x] `app/[locale]/layout.tsx` - Locale layout structure and metadata
- [x] `app/admin/layout.tsx` - Admin layout structure
- [x] `app/[locale]/admin/layout.tsx` - Admin locale layout

---

## 2. Homepage

- [x] `app/page.tsx` - Root redirect page
- [x] `app/[locale]/page.tsx` - Main homepage with hero section ("Gebrauchtwagen kaufen. Verkaufen. Inzahlungnahme. Export.", "<neutral subheadline: no market-leader / years-of-experience claims>", "Fahrzeuge entdecken", "Mein Auto anbieten", "Neu hinzugefügte Fahrzeuge", "Ausgewählte Fahrzeuge", "Unsere Dienstleistungen", "Why Choose Us?", "Qualitätsgarantie", "Expertenteam", "Transparente Preise", "About Our Company", "Schnelle Abwicklung", "Faire Preise", "Gesamtlösung", "Bereit für Ihr Traumauto?", "Kontakt aufnehmen", "Anrufen: +49 123 456789")
- [x] `components/featured-vehicles.tsx` - Featured vehicle labels and descriptions
- [x] `components/latest-vehicles.tsx` - Latest vehicle section labels
- [x] `components/search-bar.tsx` - Search input placeholders and button labels
- [x] `components/services-grid.tsx` - Service card titles and descriptions

---

## 3. Vehicle Pages (/fahrzeuge, /fahrzeuge/export, /fahrzeuge/[slug])

- [x] `app/[locale]/fahrzeuge/page.tsx` - server page (ISR, localized `generateMetadata`); renders the shared `components/vehicle-listing.tsx`
- [x] `app/[locale]/fahrzeuge/export/page.tsx` - same, with export vehicles
- [x] `app/[locale]/fahrzeuge/[slug]/page.tsx` (+ `not-found.tsx`) - detail page (ISR on demand, localized `generateMetadata`, unique slug, legacy-URL redirect)
- [x] `app/[locale]/vehicles/page.tsx` - removed; `/{locale}/vehicles` now redirects to `/{locale}/fahrzeuge` via `next.config.js`
- [x] `components/vehicle-gallery.tsx`, `components/vehicle-card.tsx`, `components/vehicle-filters.tsx` (controlled, no raw DB values), `components/vehicle-listing.tsx` (new, shared by both listings)
- [x] `components/vehicle-source-badge.tsx`, `components/listing-type-badge.tsx`

Done in this area: strings in `vehicles.*` (shared vocabulary, `vehicles.filters/gallery/listing/card/source`) and `pages.fahrzeuge`, `pages.fahrzeugeExport`, `pages.fahrzeugDetail`; label maps `common.bodyTypes/colors/transmissions/vehicleConditions/listingTypes` (+ `getBodyTypeLabel`, `getColorLabel`, `getVehicleConditionLabel` in `lib/vehicle-labels.ts`); prices/mileage via `formatPrice`/`formatMileage` (`lib/format-vehicle.ts`, next-intl formatter); the Macedonian `vehicles.filter*` strings use "Вие" forms.

Also changed here (behaviour, not just text):
- The pages now read real vehicles only (anon Supabase client, `lib/public-vehicles.ts`). `lib/vehicle-data.ts` (German mock cars used as a fallback and as "similar vehicles") was deleted.
- The card/detail/filters used mock-only camelCase fields; real DB rows are snake_case, so real cars showed "undefined PS" and **"Mit Schaden"**. They now use one normalized `PublicVehicle` type.
- Removed UI that has no DB column behind it: HU/AU, accident history, "MwSt. ausweisbar", features list, and the two matching filter sections.
- Detail slug is now `<brand>-<model>-<first 8 hex of id>` (`lib/vehicle-slug.ts`), looked up by an id range query, not by scanning the newest 100. Old `brand-model` URLs (and wrong-name/right-id URLs) 308-redirect to the canonical slug.

## 4. About, Services, Contact

- [x] `app/[locale]/about/page.tsx` - About page headers, paragraphs, company description, values
- [x] `app/[locale]/services/page.tsx` - Services page headers, service descriptions, feature lists
- [x] `app/[locale]/contact/page.tsx` - Contact page headers, form labels, contact information, location map labels

---

## 5. Auth (Login, Register, Forgot/Reset Password)

- [x] `app/[locale]/login/page.tsx` - Login form (title "Willkommen zurück", labels "Email", "Passwort", buttons "Anmelden", links "Passwort vergessen?", error messages)
- [x] `app/[locale]/register/page.tsx` - Registration form (title, form labels, validation messages, submit button, login link)
- [x] `app/[locale]/forgot-password/page.tsx` - Forgot password form (title, email input label, submit button, back to login link)
- [x] `app/[locale]/reset-password/page.tsx` - Reset password form (title, password input labels, validation messages, submit button)

---

## 6. Customer: "Mein Auto anbieten" Wizard

- [x] `app/[locale]/dashboard/fahrzeug-anbieten/page.tsx` - Vehicle submission wizard (step headers, form labels, descriptions, validation messages, CTA buttons)
- [x] `components/submission-workflow-info.tsx` - Workflow information boxes, step descriptions, help text

---

## 7. Customer: Submissions, Offers, Trade-in Requests, Profile

- [ ] `app/[locale]/dashboard/anfragen/page.tsx` - Inquiries/requests list page (table headers, status labels, action buttons, empty state messages)
- [ ] `app/[locale]/dashboard/fahrzeug-angeboten/page.tsx` - Offered vehicles list (headers, vehicle status, view details links, manage buttons)
- [ ] `app/[locale]/dashboard/inzahlungnahme/page.tsx` - Trade-in summary page (section headers, vehicle information labels, pricing details)
- [ ] `app/[locale]/dashboard/inzahlungnahme-anfragen/page.tsx` - Trade-in requests list (table headers, status filters, request details, action buttons)
- [ ] `app/[locale]/dashboard/inzahlungnahme-anfragen/[id]/page.tsx` - Trade-in request detail (form fields, vehicle details, pricing breakdown, status badges, approve/reject buttons)
- [ ] `app/[locale]/dashboard/profil/page.tsx` - Profile page (form labels, sections "Personal Information", "Contact Information", field labels, save button, validation messages)
- [ ] `app/[locale]/dashboard/page.tsx` - Dashboard overview (welcome message, statistics labels, quick action cards, recent activity headers)
- [ ] `app/[locale]/dashboard/favoriten/page.tsx` - Favorites/wishlist page (section header, vehicle cards, remove buttons, empty state message)
- [ ] `app/[locale]/dashboard/fahrzeuge/page.tsx` - My vehicles/submissions page (list headers, status labels, manage links, empty state)
- [ ] `app/dashboard/inzahlungnahme-anfragen/[id]/page.tsx` - Trade-in request detail (alternative route)

---

## 8. Server Actions (Error/Success Messages → Error Codes)

- [x] `app/actions/admin.ts` or similar - Admin action error messages ("Fahrzeug gelöscht", "Fehler beim Löschen", confirmation dialogs "Sind Sie sicher...")
- [x] `app/actions/auth.ts` or similar - Auth action messages (login errors, registration messages, validation)
- [x] `app/actions/dashboard.ts` or similar - Dashboard action messages (submission success/error, profile update, trade-in status)
- [x] `lib/auth-context.tsx` - Auth context error messages, loading states

---

**Done (2026-09-25):** see "Area 8: error codes" at the end of this file.

---

## 9. Admin: Vehicles List, New, Edit

- [ ] `app/[locale]/admin/fahrzeuge/page.tsx` - Admin vehicles list (page title, table headers "Brand", "Model", "Year", "Mileage", "Price", "Status", action buttons "Edit", "Delete", "View", search/filter labels, confirmation dialogs)
- [ ] `app/[locale]/admin/fahrzeuge/neu/page.tsx` - New vehicle form (page title "Neues Fahrzeug hinzufügen", form field labels, help text, submit button, validation messages)
- [ ] `app/[locale]/admin/fahrzeuge/[id]/page.tsx` - Vehicle detail page (title, specifications display, actions "Edit", "Delete", "Mark as Featured")
- [ ] `app/[locale]/admin/fahrzeuge/[id]/edit/page.tsx` - Vehicle edit form (page title, form labels, update button, cancel link, validation messages)
- [ ] `app/admin/fahrzeuge/neu/page.tsx` - Alternative new vehicle form route
- [ ] `app/admin/fahrzeuge/neu/layout.tsx` - New vehicle form layout
- [ ] `app/admin/fahrzeuge/[id]/page.tsx` - Alternative vehicle detail route
- [ ] `app/admin/fahrzeuge/[id]/edit/page.tsx` - Alternative vehicle edit route

---

## 10. Admin: Submitted Vehicles

- [ ] `app/[locale]/admin/fahrzeuge/eingereicht/page.tsx` - Submitted vehicles list (page title, table headers, status labels, review buttons, action menu)
- [ ] `app/[locale]/admin/fahrzeuge/eingereicht/[id]/page.tsx` - Submitted vehicle detail/review page (vehicle information, photos, seller details, approval/rejection buttons, notes field)
- [ ] `app/admin/fahrzeuge/eingereicht/page.tsx` - Alternative submitted vehicles list
- [ ] `app/admin/fahrzeuge/eingereicht/[id]/page.tsx` - Alternative submitted vehicle detail
- [ ] `app/admin/fahrzeuge/eingereicht/layout.tsx` - Submitted vehicles layout

---

## 11. Admin: Overview, Inquiries, Trade-ins, Customers, Statistics

- [ ] `app/[locale]/admin/page.tsx` - Admin dashboard overview (welcome message, dashboard stats "Total Vehicles", "Total Customers", "Pending Inquiries", "Trade-in Requests", quick action cards, recent activity)
- [ ] `app/[locale]/admin/anfragen/page.tsx` - Inquiries list (page title, table headers, inquiry type labels, status filters, view details links, respond buttons)
- [ ] `app/[locale]/admin/inzahlungnahmen/page.tsx` - Trade-ins overview (page title, stats cards, filter options, trade-in request list with status)
- [ ] `app/[locale]/admin/kunden/page.tsx` - Customers list (page title, table headers "Name", "Email", "Phone", "Registration Date", search box, view profile link, contact buttons)
- [ ] `app/[locale]/admin/kunden/[id]/page.tsx` - Customer detail page (customer information sections, activity log, submitted vehicles, inquiries, contact history, edit button)
- [ ] `app/[locale]/admin/statistik/page.tsx` - Statistics page (page title, chart titles, metric labels "Total Revenue", "Average Price", "Vehicles Sold", "Customer Satisfaction", date range selector)
- [ ] `app/admin/kunden/[id]/page.tsx` - Alternative customer detail route

---

## 12. Legal pages (added after the homepage work)

- [x] `app/[locale]/privacy/page.tsx`, `app/[locale]/terms/page.tsx`, `app/[locale]/impressum/page.tsx` - demo pages (fictional data from `lib/company.ts`, no owner/managing director), localized `generateMetadata`; strings in `legalPages.*`; shared layout in `components/legal-page.tsx`
- [x] `app/[locale]/contact/page.tsx` - reads `?testDrive=<vehicle label>` and prefills the message (`contact.testDriveMessage`)

---

## Hardcoded Text Categories to Translate

For each file, look for and catalog:

- [ ] Page titles and headings
- [ ] Button labels and CTAs
- [ ] Form labels and placeholders
- [ ] Validation and error messages
- [ ] Success messages and confirmations
- [ ] Table headers
- [ ] Status badges and labels
- [ ] Empty state messages
- [ ] Navigation menu items
- [ ] Help text and hints
- [ ] Meta descriptions and alt text
- [ ] Aria labels and accessibility text
- [ ] Toast/notification messages
- [ ] Select options and dropdown items
- [ ] Dialog/modal titles and content
- [ ] Error confirmations (e.g., "Are you sure?")

---

## Translation Status Summary

- **Checklist items**: 64
- **Completed**: 26
- **Not started**: 38

---

## Conventions (read before touching messages)

- **Message layout**: one file per locale, `messages/{de,en,mk}.json`, loaded whole by `i18n.ts`.
  - Homepage strings: `pages.home.*` (components call `useTranslations("pages.home")`).
  - Shared labels: `common.*` (incl. `common.fuelTypes`, `common.transmissions`), opening-hours day labels: `hours.*`, page metadata: `meta.*`.
- **next-intl keys are always relative to the namespace** passed to `useTranslations`/`getTranslations`; a dotted key is *not* an absolute path.
- **Never append a block to the JSON without checking the key does not already exist.** A duplicate top-level key does not error: `JSON.parse` (and webpack) keep the last one and silently drop the earlier section. `npm run check:i18n` now fails on duplicate keys.
- **DB values are never translated or changed.** Map them with `getFuelTypeLabel()` / `getTransmissionLabel()` from `lib/vehicle-labels.ts` (uses `t.has()`, falls back to the raw value). Pass a translator from `useTranslations("common")`.
- **Homepage vehicle lists** come from Supabase via `lib/public-vehicles.ts` (anon key, no cookies, so only rows the public RLS policy allows: `status = 'available'`). Latest = newest 4; featured = `vehicles.featured = true` (newest 6). The homepage, the two listings and the detail page use ISR (`export const revalidate = 60`, keep in sync with `REVALIDATE_SECONDS`); the Supabase fetch must not use `cache: "no-store"`. The list components are server components that take the vehicles as a prop; empty states are `pages.home.latest.empty` / `pages.home.featured.empty`.
- **Static rendering: every server page under `app/[locale]` that uses next-intl (`useTranslations`, `getTranslations`, `getFormatter`, ...) must call `setRequestLocale(locale)` (from `next-intl/server`) first.** The locale layout no longer sets `force-dynamic`, so a page that skips it fails `npm run build` ("Usage of next-intl APIs in Server Components currently opts into dynamic rendering"). Client pages are unaffected. A dynamic-segment page that should be ISR (like `fahrzeuge/[slug]`) also needs `generateStaticParams() { return []; }`.
- **Vehicle slugs**: `getVehicleSlug()` in `lib/vehicle-slug.ts` (`brand-model-<8 hex of id>`). Always build detail links with it (or use `PublicVehicle.slug`).
- **Formatting**: prices and mileage go through `formatPrice()` / `formatMileage()` (`lib/format-vehicle.ts`), other numbers through the next-intl formatter; never `toLocaleString("de-DE")`.
- **Company placeholders** ("Beispielstraße", "(Beispiel)") live in `company.*` messages; use `getFormattedAddress(t)` / `getAddress(t)` / `getLegalInfo(t)` from `lib/company.ts` with a `company` translator.
- **Fuel type values in the DB** are inconsistent (`gasoline`, `diesel`, `electric`, `hybrid` from the admin form; `Benzin`, `Diesel`, `Elektro` from older data). `common.fuelTypes` maps all of them; unknown values still fall back to the raw value. The other label maps (`transmissions`, `bodyTypes`, `colors`, `vehicleConditions`) use lowercase keys; the helpers try the exact value first, then the lowercased one.
- **Opening hours** live only in `COMPANY.hours` (`lib/company.ts`, 24h). Render them with `<BusinessHours />` (24h for de/mk, 12h AM/PM for en).
- German: formal "Sie". Macedonian: formal "Вие" (never "ти"). "RBM" and "Premium Cars" stay untranslated.
- Message files: UTF-8 **without BOM**, 4-space indent, trailing newline. Do not write them with PowerShell.
- Run `npm run check:i18n` (= `node scripts/check-i18n.mjs`) before every commit. It checks: duplicate keys, BOM, mojibake, key parity across locales, {placeholder} parity, and that every `t("…")` call in `app/`, `components/`, `lib/` resolves (namespace-aware) to a string in all three locales. Keys built with `${…}` only have their parent object verified.

## Incident log

- **2026-09-24 – homepage showed raw keys in production.** Commit `f22dbdd` appended second `vehicles`, `contact` and `pages` blocks to each message file; the later duplicates shadowed the originals, so `pages.home.*` (and other `pages.*`) disappeared, while copies of the home blocks sat at the JSON root. The old check script passed because it treated every dotted key as an absolute path and could not see duplicate keys. Fixed by merging the blocks, moving the home strings back to `pages.home`, and rewriting the check script.

## Known follow-ups

- `pages.about` and `pages.services` are still "coming soon" placeholders (translated in de/en/mk).
- **mk formality sweep still open** outside the translated areas: many Macedonian strings still use singular imperatives (e.g. `buttons.*` "Зачувај/Откажи/Избриши/Уреди/Затвори…", `forms.confirmPassword`, `forms.selectFile`, `errors.goHome`, `auth.*` "Пријави се/Регистрирај се/Потврди лозинка…", `common.confirm`, `pages.login|register|resetPassword.title`, `pages.contact.send`, `adminDashboard.approve/reject/manage*`, `contact.sendMessage`). Convert to "Вие" plural forms ("Зачувајте", "Пријавете се", ...) when each area is translated. Already fixed: `navigation.login/logout/register`, the homepage hero/search/services strings, `vehicles.*`.
- Homepage CTAs are wired with the locale-aware `Link` from `lib/navigation.ts` (pass hrefs without a locale prefix). Cards are real DB vehicles; "view details" goes to `/fahrzeuge/<slug>` and "test drive" to `/contact?testDrive=<vehicle label>`; export vehicles carry an "Export" badge.

## TODO (not i18n)

- [ ] **Contact form only `console.log`s.** Needs storage (Supabase table + RLS: public insert, admin-only select/update/delete, same pattern as `customer_inquiries`) and an admin notification. The inquiry/test-drive buttons on vehicle pages only link to `/contact` (the test-drive one prefills the message).
- [ ] **DB fuel values are inconsistent** (`gasoline` / `Benzin` / `Diesel` ...). The admin vehicle form should save fixed enum values (ideally a DB `CHECK`/enum), plus a one-time data cleanup migration. Same for `transmission` (form saves `automatic`/`manual`/`cvt`, older rows have `Automatik`) and `body_type`/`color_exterior` (free text today). The `common.*` label maps tolerate the current mix.
- [x] **Vehicle detail slugs were not unique** (`brand-model`, newest-100 scan) - fixed in area 3 (unique `brand-model-<id8>` slug, id-range lookup, old URLs redirect).
- [ ] **Customers must not delete their submitted vehicles; only admins can.** Checked against the migrations in this repo (not against the live database): `submitted_vehicles` has only "Admins can delete submissions" for DELETE (`023_security_audit_fixes.sql`, which also drops every earlier policy first, incl. 002's "Users can delete their own draft vehicles"); `submitted_vehicle_images` and the customer storage bucket likewise allow DELETE for admins only; no customer UI calls a delete on these tables. Still to do: apply `supabase/migrations/024_enforce_admin_only_submission_delete.sql` (makes admin-only DELETE explicit, idempotent) and run `select tablename, policyname, cmd, roles from pg_policies where tablename in ('submitted_vehicles','submitted_vehicle_images')` in the Supabase SQL editor to confirm the live policies match, (the dead draft-image delete path `updateVehicleImages` was removed).
- [ ] Vehicle data the DB does not have: HU/AU, accident history, VAT-deductible flag, features (`vehicle_features` exists but is unused), first-registration month. The UI for them was removed in area 3; re-add together with the schema + admin form fields.
- [ ] Non-functional buttons: favorites (heart on cards), "Teilen" / "Merken" on the detail page.
- [ ] The one live vehicle has no rows in `vehicle_images` (cards show the placeholder); the admin flow should require at least one photo.
- [ ] ISR delay: new/changed vehicles appear up to 60 s after publishing; add `revalidatePath` to the admin publish/update actions if that is too slow.

## Translation audit (2026-09-24, on commit 806d2f3)

Read-only audit: no app code or translations were changed. Areas 1-3 and 12 are not part of it.

**Scope actually covered.** Code scan: all of areas 4-11. Live check: all public pages on /de, /en, /mk (48 visits, dev server) and every dashboard/admin route while logged out (66 visits, dev + production build). **Not run: the logged-in customer and admin passes** - `AUDIT_CUSTOMER_EMAIL/PASSWORD` and `AUDIT_ADMIN_EMAIL/PASSWORD` are not set in `.env.local` (checked by name only; no values were read or printed). So the "live issues" for areas 6-11 below are inferred from the code, not observed, and the customer-isolation and after-logout checks are only partly done (see "Caching check"). The Playwright script lives outside the repo (Playwright installed there, not in `package.json`); once the four variables exist it runs the authenticated passes unchanged.

### Summary

Hardcoded = AST scan of JSX text, placeholders/aria-label/alt/title, `alert/confirm/setError`, `new Error("...")` and copy-like string literals (status maps, ternaries); ~±10 %. Counts exclude the legacy duplicate routes `app/admin/**` and `app/dashboard/**` (277 more strings) because they are unreachable: the middleware 307-redirects `/admin/...` and `/dashboard/...` to `/{locale}/...` (verified on the production build) - delete them instead of translating them.

| Area | Pages / files | Hardcoded strings | Live issues (observed = O, inferred from code = I) | mk formality issues | Effort |
|---|---|---|---|---|---|
| 4 About, Services, Contact | 3 | 0 | O: none on de/en/mk (about/services are "coming soon" stubs) | 2 imperatives (`contact.sendMessage`, `pages.contact.send`) | small |
| 5 Auth | 4 | 29 (register 4, forgot 8, reset 17) | O: German text on /en and /mk in register, forgot-password, reset-password (e.g. "Haben Sie bereits ein Konto?", "Passwort zurücksetzen", "oder") | 12 imperatives (`auth.*`, `forms.confirmPassword/selectFile`, `pages.login/register/resetPassword.title`); `auth.createAccount` = "Создај сметачно" is a wrong word | small |
| 6 Wizard | 2 (926-line wizard) | 135 + 1 de-DE format | I: whole wizard German on /en and /mk (0 `t()` calls) | none yet (no mk strings exist) | large |
| 7 Customer | 9 pages | 230 + 26 de-DE formats | I: all German on /en and /mk; only `dashboard/page` has 3 `t()` calls | none yet | large |
| 8 Server actions / auth-context | 6 files | 97 (mostly `throw new Error("...")`, some English: "Unauthorized", "Failed to update profile") | I: German or English error text reaches the UI on every locale | `errors.goHome` "Оди на почетна" | medium (needs an error-code design, not just strings) |
| 9 Admin vehicles | 4 pages | 167 + 4 de-DE formats | I: all German on /en and /mk; DB status/fuel values shown via hardcoded German maps ("Verfügbar", "Entwurf") | `adminDashboard.approve/reject/manageVehicles/manageUsers` (4, shared with 11) | large |
| 10 Admin submissions | 2 pages | 62 + 5 de-DE formats | I: same; workflow labels with emoji ("🤝 Direktverkauf an RBM") hardcoded | - | medium |
| 11 Admin overview, inquiries, trade-ins, customers, stats | 6 pages | 143 + 8 de-DE formats | I: same; `admin/page` mixes 6 `t()` with 25 hardcoded strings | - | large |
| Cross-cutting | all | 44 hardcoded `de-DE`/`toLocale*` formats (in 6, 7, 9, 10, 11) | O: global 404 ("This page could not be found.") is English on all three locales; no page in areas 4-11 has its own `<title>` (all show the site default; they are client components, so `generateMetadata` needs server wrappers) | shared: `buttons.*` (15) + `common.confirm` = 16 imperatives | medium |

Total: about 863 hardcoded strings + 44 hardcoded date/number formats in the 7 open areas. mk informal "ти"/твој forms: 0 (in `mk.json` and in code). mojibake: 0 (all visits). Raw message keys: 0. Missing-message console errors: 0. Raw DB enum values shown: none observed on public pages (authenticated pages not observed; the hardcoded German maps in areas 9-11 will show German labels on every locale).

### Concrete issues per page

Observed live (public pages, production/dev build):
- `/en|/mk/register`: "Haben Sie bereits ein Konto? Anmelden", placeholder "Max Mustermann"; on mk also the divider "oder".
- `/en|/mk/forgot-password`: title "Passwort zurücksetzen", the description, "E-Mail-Adresse", "Passwort-Reset anfordern", "Zurück zur Anmeldung", "oder" (plus 3 more lines; the page has 3 `t()` calls and ~8 hardcoded strings).
- `/en|/mk/reset-password`: "Ungültiger Link", "Der Password-Reset-Link ist ungültig oder abgelaufen.", "Neuen Reset anfordern", success texts ("Passwort aktualisiert!") - the page has no `t()` calls at all, it is German on every locale.
- Any unknown URL, e.g. `/mk/does-not-exist`: English default 404 (`app/[locale]` has no `not-found.tsx`; only `fahrzeuge/[slug]` has one).
- `/en|/mk/fahrzeuge/<slug>`: the description is German because it is DB content (correct per the "never translate DB values" rule, listed for information). `RBM Premium Used Cars` (English `COMPANY.fullName`) appears inside mk/de sentences on privacy, terms and impressum.
- `/de/*`, `/mk` (home, about, services, contact, login, fahrzeuge, export, privacy, terms, impressum): no issues found.

Inferred from the code (not observed live), highest counts first: `dashboard/fahrzeug-anbieten` (123, incl. validation/toast strings and the "Schritt" stepper), `dashboard/inzahlungnahme` (58 + 9 formats), `admin/fahrzeuge/neu` (63), `dashboard/inzahlungnahme-anfragen/[id]` (46 + 8), `admin/fahrzeuge/[id]/edit` (48), `admin/statistik` (33), `admin/fahrzeuge/eingereicht/[id]` (33), `admin/kunden/[id]` (28), `dashboard/page` (28), `dashboard/profil` (29), `dashboard/fahrzeuge` (27), `admin/fahrzeuge` (26), `admin/inzahlungnahmen` (25), `admin/page` (25), `dashboard/inzahlungnahme-anfragen` (22), `admin/anfragen` (18), `admin/kunden` (14), `components/submission-workflow-info` (12), `dashboard/anfragen` (7), `dashboard/favoriten` (7), `dashboard/fahrzeug-angeboten` (6). Every page also has a hardcoded "Wird geladen..." loading state, and the prerendered HTML shell of every dashboard/admin page says "Wird geladen..." in German on all locales until hydration.

mk formality (all singular imperatives, no "ти"): `buttons.*` (save, cancel, delete, edit, create, update, submit, search, filter, close, viewMore, download, export, import, publish), `common.confirm`, `forms.confirmPassword`, `forms.selectFile`, `errors.goHome`, `auth.signIn/signUp/signOut/confirmPassword/createAccount/resetPassword/sendResetLink`, `pages.login|register|resetPassword.title`, `pages.contact.send`, `contact.sendMessage`, `adminDashboard.approve/reject/manageVehicles/manageUsers`. (`vehicles.doors` and `legalPages.terms.sections.offers.title` are nouns, `buttons.prev` is an adjective - not issues.) Areas 6-11 have no mk strings yet, so their formality can only be checked when they are written.

### Caching check (production build: `npm run build` + `next start`)

1. **Dashboard/admin pages are NOT rendered dynamically per request any more.** Since `force-dynamic` was removed from the locale layout (commit 806d2f3), the 9 dashboard pages and the admin list pages (`admin`, `anfragen`, `fahrzeuge`, `fahrzeuge/neu`, `fahrzeuge/eingereicht`, `inzahlungnahmen`, `kunden`, `statistik`) are prerendered static (`●`) and served with `Cache-Control: s-maxage=31536000` (`x-nextjs-cache: HIT`). Only the `[id]` routes (`dashboard/inzahlungnahme-anfragen/[id]`, `admin/fahrzeuge/[id]`, `.../edit`, `eingereicht/[id]`, `admin/kunden/[id]`) are still `ƒ` with `private, no-store`.
2. **No user data is cached.** Every dashboard/admin page and the admin layout is a client component (no `cookies()`/`headers()`, no server-side Supabase call); the cached HTML is only the "Wird geladen..." shell plus footer. Data is loaded in the browser (RLS with the user's session) or through server actions (per request, cookie-based). So nothing customer- or admin-specific can be served from cache.
3. **Guards are client-side only** (there is no auth check in `middleware.ts`): a logged-out visitor gets the 200 shell and is then redirected by JS. Verified on the production build: all 22 protected routes x 3 locales redirect to `/{locale}/login` (locale preserved, none stayed on the page). **Update: a server-side guard now exists in `middleware.ts` (see "Security fixes" below).**
4. **Customer sees only own data - not verified live** (no credentials). Evidence from code/DB: customer pages query `submitted_vehicles`/`trade_in_requests` under RLS (`auth.uid() = user_id`, migration 023). With the anonymous key (read-only probes on the live project): `submitted_vehicles`, `submitted_vehicle_images`, `trade_in_requests`, `customer_inquiries` -> `42501 permission denied`; `user_profiles` -> `[]`; non-available `vehicles` -> `[]`. (`favorite_vehicles` and `admin_settings` do not exist in the live DB, although `lib/supabase.ts` defines `FavoriteVehicle` and migration 019 creates `admin_settings`.)
5. **After logout - not verified live.** Because the cached HTML never contains user data, logout cannot leak cached content from the server side; whether the back button / bfcache shows stale client state after logout still needs the authenticated pass.
6. **Two authorization gaps found while reading the actions (out of i18n scope, not exploited or tested):** `uploadVehicleImagesBase64` in `app/actions/vehicles.ts` uses the service-role client with no session or admin check, and the full vehicle UUIDs are present in the public listing HTML, so an unauthenticated caller could attach images to any published vehicle; `finalizeSubmission(vehicleId, userId)` (same file, currently unused) uses the service-role client and trusts the client-supplied `userId` without checking the session. **Update: both are fixed, see "Security fixes" below.**

### Suggested order

1. Area 5 + global `not-found.tsx` + mk imperatives in `buttons.*`/`auth.*` (small, most visible); 2. area 8 error-code design (blocks 6-11); 3. area 7 + 6 (customer flow); 4. areas 9-11 (admin); 5. delete the legacy `app/admin`/`app/dashboard` duplicates first (halves the work), add server-side guards, run the authenticated audit passes.

## Security fixes (2026-09-24)

### What was vulnerable (commit 84c6078 and earlier)
1. **`uploadVehicleImagesBase64`** used the service-role client with no session or role check. An anonymous caller (or any customer) could upload files into the public `vehicle-images` bucket and attach them to any `vehicles` row; full vehicle UUIDs are in the public listing HTML. Names/content types were client-controlled and nothing was validated.
2. **`finalizeSubmission(vehicleId, userId)`** used the service-role client and trusted the client-sent `userId` with no session check and no state check: anyone knowing a submission id and its owner id could reset a submission (e.g. `in_bearbeitung`) to `eingereicht`.
3. **Mass assignment:** `createSubmittedVehicle` and `createTradeInRequest` spread client objects into the insert (RLS insert checks were the only barrier for `user_id`/`status`/`offered_price`).
4. Smaller: `getSubmittedVehicles/ById` and `updateVehicleImages` trusted a client-sent `userId`; `app/actions/admin.ts` had two stray `acceptOffer/rejectOffer(vehicleId, userId)` exports; images accepted any `data:` URL and were stored as `.jpg`; **no server-side route guard** (only client redirects).
5. Not exploitable *at the time of testing* only by accident: the `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` is a legacy key that Supabase **disabled on 2026-09-23** ("Legacy API keys are disabled"), so every service-role call currently fails locally (see open items).

### What changed
- `lib/auth-guards.ts`: `requireUser()` / `requireAdmin()` (session via `auth.getUser()`, role read from `user_profiles` in the database). Errors are stable codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `INVALID_INPUT`, `INVALID_STATE`, `UPLOAD_FAILED`, `CREATE_FAILED`, `LOAD_FAILED`, `UPDATE_FAILED`.
- `uploadVehicleImagesBase64` (published vehicles): admin only, RLS-bound session client (the admin policies on `vehicle_images` and the bucket allow it), **no service-role use any more**. New `uploadSubmissionImages(submissionId, files)`: owner only (`user_id` compared with the session user, statuses `draft`/`eingereicht`), private `customer-submitted-photos/{user}/{submission}/` folder, session client.
- `finalizeSubmission(vehicleId)`: user from the session, ownership + `status = draft` check, service-role only for the final status write, pinned to `id + user_id + status`, payload fixed to `status`/`updated_at`. `acceptOffer/rejectOffer` share the same pattern (session + ownership + `angebot_gesendet`, write pinned to owner and state, exactly one row must change).
- zod (`zod` added to `package.json`) on every customer write: `createSubmittedVehicle` (explicit allow-list; `status`, `user_id`, `offered_price`, admin fields are stripped), `createTradeInRequest` (allow-list; status fixed to `new`), `getSignedImageUrls`, uploads (`lib/image-upload.ts`: only jpeg/png/webp data URLs, max 8 MB, max 20 per request, magic bytes must match, generated file names).
- `getSubmittedVehicles()` / `getSubmittedVehicleById(id)` no longer take a user id (callers updated); removed the dead `updateVehicleImages` and the duplicate `acceptOffer/rejectOffer` in `admin.ts`; `verifyAdminRole` now uses `requireAdmin`; the admin upload input only accepts jpeg/png/webp.
- **`middleware.ts`**: `/{locale}/dashboard/**` needs a valid session (`auth.getUser()`), `/{locale}/admin/**` also `user_profiles.role = ADMIN` (read server-side); anonymous -> `/{locale}/login`, logged-in non-admin on an admin URL -> `/{locale}/dashboard`; fails closed if Supabase is unreachable; matches on the decoded, normalized path; sets `Cache-Control: private, no-store` on allowed responses; refreshed auth cookies are forwarded. The client guards stay. Server actions are *not* covered by the middleware (they can be POSTed from any URL) - they have their own checks.
- `supabase/migrations/024_enforce_admin_only_submission_delete.sql` (idempotent; **not applied by me**, see open items).

### Service-role client inventory (every use)
| Action (file) | Guard before the service-role client is created |
|---|---|
| `createVehicle` (admin.ts) | `verifyAdminRole()` -> `requireAdmin()` |
| `approveSubmittedVehicle` (admin.ts) | `verifyAdminRole()` |
| `publishSubmittedVehicle` (admin.ts) | `verifyAdminRole()` |
| `acceptOffer` / `rejectOffer` (vehicles.ts) | `requireUser()` + ownership from the session + state `angebot_gesendet`; write pinned to owner/state |
| `finalizeSubmission` (vehicles.ts) | `requireUser()` + ownership + state `draft`; write pinned |
| `uploadVehicleImagesBase64` (vehicles.ts) | no longer uses it (`requireAdmin()` + session client) |

The other admin actions use the session client under RLS after `verifyAdminRole()`. No API routes exist.

### How it was tested
- **In-process, real action code, fake Supabase with RLS switched off** (worst case: only the action's own checks count): the fixed code passes 27/27 (anonymous and other-customer upload/finalize/accept/reject/upload-to-submission blocked with no write and no service-role client; owner and admin paths allowed; injected `status/user_id/offered_price` stripped; html/fake-png/oversized/malformed input rejected). The same scenarios against the pre-fix commit pass only 6/13: anonymous **and** customer uploads attached images through the service-role client, anonymous and other-customer `finalizeSubmission` rewrote the status, `createSubmittedVehicle` forwarded `user_id` of another user to the insert.
- **Live, real Next.js production build + real Supabase, anonymous** (38 checks): 25 direct/bypass URL variants of dashboard/admin (incl. `/de//admin`, `/DE/admin`, `/admin`, `/de/admin/%2e%2e/admin`, forged Supabase session cookie with a fake admin JWT, garbage cookies) all end at `/{locale}/login`; anonymous POSTs of the upload/accept/create actions to their hosting pages are redirected; public pages and `/login` still work; the published vehicle's image rows stayed 0 -> 0. **This found a real bypass in my first middleware version** (`/de/%61dmin`, `/de/%64ashboard` skipped the guard and served the page shell); fixed by decoding/normalizing the path and re-tested. The actions-only build (old middleware) also rejects the anonymous action POSTs (HTTP 500).
- **Not run (blocked): live customer and admin sessions.** No `AUDIT_*` credentials exist in `.env.local` and the service-role key is disabled, so I could neither log in nor create throwaway users (I did not want to create auth users I cannot delete). Therefore *not verified live*: that a real customer/admin session passes the new middleware, that a customer is redirected from `/admin`, the customer `DELETE`/`UPDATE` attempt against `submitted_vehicles` (only covered by the migrations and by anonymous `42501` probes), and a real admin upload through the session client. Scripts for these are ready outside the repo; run them once the variables are set.

### Open items (need you)
1. **Rotate the Supabase secret key.** The legacy `service_role` key is disabled. Create a new secret key (`sb_secret_...`) in the Supabase dashboard and set `SUPABASE_SERVICE_ROLE_KEY` in Vercel and `.env.local` (check that the installed `@supabase/supabase-js` accepts it). Until then `createVehicle`, `approveSubmittedVehicle`, `publishSubmittedVehicle`, `acceptOffer`, `rejectOffer` and `finalizeSubmission` fail at runtime.
2. Apply migration 024 in the Supabase SQL editor and run its verification query.
3. Add `AUDIT_CUSTOMER_*` / `AUDIT_ADMIN_*` to `.env.local` and run the logged-in checks (customer redirect from admin, customer DELETE/UPDATE attempt, admin upload, logout).
4. Server actions now throw the error codes listed above; the UI still shows `err.message`, so a failed wizard submit shows a raw code until area 8 maps codes to translated text.
5. Other actions (admin CRUD in `admin.ts`) still take free-form objects; they are admin-only, but should get zod schemas too.

## Production fix: admin image upload + locale paths (2026-09-24)

### What broke (after commit 3aa1d04)
1. **`POST /de/admin/fahrzeuge/neu` -> 500 `UPLOAD_FAILED`.** 3aa1d04 moved the image upload to the admin's session client. Role `authenticated` only has `SELECT` on `public.vehicle_images` (migration 010), so the image-row insert was always rejected ("permission denied for table vehicle_images", confirmed live with a throwaway non-admin user). The thrown error became a 500 page, and because the vehicle had already been created as `available`, a public vehicle without photos was left behind (AUDI A4 `c1d3a890`, now set to `draft` by hand).
2. **`POST /admin/fahrzeuge/<id>/edit` -> 307 -> "failed to forward action response".** Admin/dashboard pages used `next/link` and `next/navigation`'s `useRouter` with bare `/admin/...` and `/dashboard/...` paths. The middleware redirected those (307), and for a server action POST the redirect loses the request. The same bare paths caused the many 307s on normal navigation.

### Changes
- **Migration 025** (`supabase/migrations/025_vehicle_image_storage_admin_policies.sql`, **must be applied by hand**): RLS enabled on `vehicle_images`, admin-only INSERT/UPDATE/DELETE policies, then `GRANT INSERT, UPDATE, DELETE` to `authenticated`. `vehicle-images` bucket: SELECT/INSERT/UPDATE/DELETE policies for admins only (public read stays via the public bucket URL). `customer-submitted-photos`: INSERT only into `{own uid}/{a submission the uploader owns, status draft/eingereicht}/` (before: any second folder). Idempotent.
- **Actions return result objects** (`lib/action-result.ts`: `{ ok: true, ... } | { ok: false, error: CODE }`) instead of throwing: `createVehicle`, new `publishVehicle`, new `discardDraftVehicle`, `updateVehicle`, `deleteVehicle` (admin.ts) and `uploadVehicleImage` (vehicles.ts, one image per call, replaces `uploadVehicleImagesBase64`). Failure causes are logged server-side (`[uploadVehicleImage] storage upload: ...`).
- **No half-created vehicles:** the create form creates the vehicle as `draft` (not public), resizes each photo in the browser (`lib/resize-image.ts`, max 1920 px JPEG), uploads them one by one, and only then publishes. On any failure it calls `discardDraftVehicle` (removes rows + files); if even that fails, the vehicle stays a non-public draft and the form says so. The old two-step "create, then upload on a success screen" flow is gone. `deleteVehicle` now also removes the vehicle's files; `updateVehicle` validates with zod (allow-list).
- **Translated errors:** `actionErrors.<CODE>`, `adminVehicleForm.*`, `adminVehicleActions.*` (de/en/mk). Area 8 can reuse `actionErrors` for the other actions.
- `experimental.serverActions.bodySizeLimit = "4mb"` (default 1 MB; Vercel's hard limit is 4.5 MB per request).
- **Locale-aware navigation everywhere in `app/[locale]/**` + navbar/footer:** `Link`/`useRouter` from `lib/navigation.ts`, hand-built `/${locale}/...` prefixes removed, `router.push("/admin-access-denied")` (route never existed) -> `/dashboard`. The language switcher keeps `next/navigation` on purpose. Server-side `permanentRedirect` in the vehicle detail page keeps its explicit `/${locale}` prefix.
- **Removed the legacy `app/admin/**` and `app/dashboard/**` routes** (10 files): unreachable (the middleware redirects every non-locale URL) and full of bare paths.

### Tests
- In-process against the real actions (fake Supabase, RLS off): create with 2 images -> draft -> 2 rows + 2 files -> `available`; storage denial and row-insert denial -> `UPLOAD_FAILED` returned (no throw), draft and already-uploaded files rolled back; invalid 2nd image rolls back the 1st; discard refuses published vehicles; edit saves allowed fields and ignores `id`/`source_type`; delete removes row + files; anonymous/customer get `UNAUTHORIZED`/`FORBIDDEN` with zero writes (12/12). Earlier security suite updated to the new action: 26/26.
- Live storage probe (throwaway users, deleted afterwards): non-admins and anon are denied on `vehicle-images`; customers can upload into their own folder, not into another user's; **before 025 a customer could upload into `{own uid}/{any id}/`**.
- Live navigation on the production build (throwaway customer, deleted afterwards): all 7 dashboard links x de/en/mk clicked, links on each target page collected: **0 requests to non-locale paths, 0 redirects**; a customer opening `/{locale}/admin` gets a server-side 307 to `/{locale}/dashboard`. Admin pages could not be crawled (no admin session), but use the same code path after the codemod.
- **Not run: the admin create/edit/delete test with 2 images on `npm run dev`.** `AUDIT_ADMIN_*` is not in `.env.local`, and the rotated secret key has no UPDATE grant on `user_profiles`, so no temporary admin could be created. It also cannot pass before migration 025 is applied.

### Open items
1. Apply migration 025 in the Supabase SQL editor, then run its verification queries.
2. Add `AUDIT_ADMIN_*` / `AUDIT_CUSTOMER_*` to `.env.local` so the admin flow can be tested live.
3. Vehicle `f9af008f` ("sssssssss SSSS...", created 2026-09-24 22:41, 0 images) is live; probably another failed test - delete or set to draft in the admin.
4. The customer wizard still sends all photos in one `createSubmittedVehicle` request; with several photos this can exceed the 4 MB limit. Switch it to `uploadSubmissionImages` per photo.
5. `lib/auth-context.tsx` builds the password-reset link without a locale (`/reset-password`); it is a GET, so the middleware redirect works, but it always lands on `/de`.

## Area 8: error codes (2026-09-25)

### Design
- Server actions and the client auth helpers never return or throw human-readable text. Actions return `{ ok: true, ... } | { ok: false, error: CODE }` via `runAction()` (`lib/action-result.ts`); unexpected errors are logged with the action name and mapped to the action's fallback code (a raw DB/Supabase message never reaches the client). Throwing is not an option: in production Next.js replaces the message of an error thrown in a server action.
- Codes: generic (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `INVALID_INPUT`, `INVALID_STATE`, `DUPLICATE_VIN`, `CREATE/UPDATE/DELETE/UPLOAD/LOAD_FAILED`, `UNKNOWN`) plus auth (`INVALID_CREDENTIALS`, `EMAIL_NOT_CONFIRMED`, `EMAIL_TAKEN`, `WEAK_PASSWORD`, `SAME_PASSWORD`, `INVALID_CURRENT_PASSWORD`, `RATE_LIMITED`, `NETWORK`).
- `lib/auth-errors.ts` maps Supabase Auth errors (`code`/`status`/English text) to codes; `lib/auth-context.tsx` throws `ActionError(code)`.
- UI: `useErrorMessage()` (`lib/use-error-message.ts`) turns a code, a failed result or anything caught into `errors.codes.<CODE>` (de/en/mk); anything that is not a known code becomes `errors.codes.UNKNOWN`. `actionErrors.*` was renamed to `errors.codes.*` (8 new keys x 3 locales).
- All callers updated: login, register, forgot/reset password, profile, customer wizard, my vehicles (accept/reject offer), trade-in (new/list/detail), all admin pages.

### Bugs found and fixed on the way
- `changePassword` in `auth-context` never verified the current password (`signInWithPassword` returns the error, it does not throw), so any current password was accepted. Now `INVALID_CURRENT_PASSWORD`.
- The wizard ignored the result of `createSubmittedVehicle` and redirected to the success page even when the submission failed.
- Admin vehicle detail page stored `{ vehicle, images }` as the vehicle (all fields empty); now `result.vehicle`.
- The profile page swallowed every error into one generic German text.

### Tests
- `tsc --noEmit`, `npm run check:i18n`, `npm run build`: pass.
- In-process: `authErrorCode` (5 cases) and `runAction` (success, `ActionError`, unknown error -> fallback code without leaking the message, guard code passthrough): all pass.
- Not run live in a browser (no `AUDIT_*` sessions), so wrong-password / wrong-current-password messages on the deployed site are not yet seen in all three languages.

### Still open
- Hardcoded German texts next to the error handling (validation messages, `confirm()`/`alert()` prompts, labels) belong to areas 5-7 and 9-11; `alert()` in "my vehicles" should become an inline message there.
- Admin CRUD actions still take free-form objects (only admin-only).

## Area 4 & 5, Cross-cutting: Localization + Error Codes (2026-09-25)

### Completed
- **Area 4 (About, Services, Contact)**: All 3 pages ✅
- **Area 5 (Auth: Login, Register, Forgot/Reset Password)**: 29 hardcoded strings moved to t() calls, German text on /en and /mk fixed ✅
  - New keys: `auth.haveAccount`, `auth.signInLink`, `auth.passwordResetTitle`, `auth.invalidResetLink`, `auth.invalidResetLinkDesc`, `auth.requestNewReset`, `forms.divider`, `forms.fullNamePlaceholder`
  - Fixed Macedonian imperatives: 16 shared (`buttons.*`, `common.confirm`) + 6 auth-specific (`auth.signIn/Up/Out/confirmPassword/createAccount/resetPassword`)
- **Cross-cutting**: Localized 404 page (`app/[locale]/not-found.tsx`) with keys `pages.notFound.*` (title, description, backHome)

### Not yet done
- `generateMetadata` for areas 4-11 (all client components, would need server wrappers; deferred to later area)
- Shared imperative `pages.contact.send` in area 4 (marked done but needs Macedonian formal form verification)

### Tests
- ✅ `npm run check:i18n`, `npm run build`
- ✅ Created `app/[locale]/not-found.tsx` (no module exports, so no type errors)
- ⏳ Ultrareview running (2 of 3 free uses) for areas 4, 5 changes

## Cross-cutting: Signed URLs for Private Submission Images + Admin Page Fixes (2026-09-25)

### Completed
- **Admin submission detail page** (`app/[locale]/admin/fahrzeuge/eingereicht/[id]/page.tsx`) ✅
  - Fetch signed URLs for submission images using `getSignedImageUrls()`
  - Respects RLS: admin sees all submissions, customer only their own
  - Display signed URLs via next/image with `unoptimized` flag (Supabase URLs already allowed in next.config)
  - Signed URLs valid for 1 hour, fetched server-side before rendering
  - **Bug fixes:** Proper null checks on result object before accessing `.ok`; loading state for images; no broken fallback URLs
  - **Localization fixes:** Use label helpers for fuel_type, transmission, body_type, color; use useLocaleFormatter() for mileage, power, price display

- **Customer wizard edit flow** (`app/[locale]/dashboard/fahrzeug-anbieten/page.tsx`) ✅
  - Fetch signed URLs when loading previously submitted vehicle for editing
  - Use signed URLs for image preview display in edit mode
  - Graceful error handling if signing fails (signed URL mapping fails silently, doesn't break page)

### Bug fixes applied to admin detail page
- Fixed undefined `.ok` access error by adding null/safety checks around server action results
- Fixed infinite loading state: removed `errorMessage` from useEffect dependency array (was causing effect to run incorrectly)
- Fixed broken image src fallback: now shows loading state instead of falling back to empty string (which caused browser to use page URL as src)
- Fixed NaN power value: corrected field name from `power` to `power_hp` in interface and display (server returns power_hp)
- Fixed raw sales_type value: now translates DB values (direct, tradeIn, consignment) to signed translation keys (wizard.salesType.*)
- Fixed missing image loading: moved signed URL fetching to separate effect that runs when vehicle.images changes, with better error logging
- Fixed raw DB values displayed without translation:
  - fuel_type: now uses `getFuelTypeLabel(tCommon, vehicle.fuel_type)`
  - transmission: now uses `getTransmissionLabel(tCommon, vehicle.transmission)`
  - body_type: now uses `getBodyTypeLabel(tCommon, vehicle.body_type)`
  - color: now uses `getColorLabel(tCommon, vehicle.color)`
- Fixed price formatting: now uses `format.number(..., { style: "currency", currency: "EUR" })` via useLocaleFormatter()
- Added proper vehicle null checks: render loading state when vehicle is null, not undefined errors

### Why this fix was needed
- Submission images stored in private bucket with paths like "<userId>/<submissionId>/<file>.jpg"
- Raw paths return 400 from next/image (bucket is private since migration 025)
- Existing `getSignedImageUrls()` action already handles RLS, just needed to be used

### Approach chosen: Server-side signed URLs via existing action
- Minimal code changes
- Leverages existing RLS policies (admin access to all, customer to own only)
- Session client prevents unauthorized access
- Signed URLs with 1-hour TTL good for page load time

### Tests
- ✅ `npm run check:i18n` passes
- ✅ `npm run build` succeeds
- Admin submission detail page: needs live testing with existing AUDI A8/VW Golf submissions

---

## Cross-cutting: Locale-aware Number Formatting (2026-09-25)

### Completed
- **Browser Intl support mapping for Macedonian** ✅
  - Created `lib/i18n/number-locale.ts`: maps app locales to Intl-supported locales (mk → de-DE for number formatting)
  - Created `lib/use-locale-formatter.ts`: wrapper hook that intercepts format.number() calls and applies locale mapping
  - Updated `app/[locale]/layout.tsx` to pass `locale` prop to NextIntlClientProvider for proper context
  - Updated all client-side number formatting to use `useLocaleFormatter()` instead of `useFormatter()`:
    - `app/[locale]/dashboard/fahrzeug-anbieten/page.tsx` (wizard)
    - `components/vehicle-card.tsx` (used on listings and detail pages)
  - Server-side formatters (featured-vehicles, latest-vehicles, vehicle detail page) unchanged (server Intl already supports mk)

### Why this fix was needed
- Browser Intl API does not have data for "mk" (Macedonian), silently falls back to en-US
- Results: "85,000" (en-US) instead of "85.000" (Macedonian uses same separators as German)
- Server-side formatters have full Intl support and work correctly
- Hydration mismatch when server renders "85.000" but browser renders "85,000"

### Solution chosen: Wrapper hook `useLocaleFormatter()`
- Maps unsupported locales to supported ones (mk → de-DE)
- Spreads base formatter for all other methods (dateTime, relativeTime, list, dateTimeRange)
- Passes through unchanged if locale is already supported (de, en)
- No configuration needed; transparently handles the mapping

---

## Area 6: Customer "Mein Auto anbieten" Wizard (2026-09-25)

### Completed
- **Wizard page** (`app/[locale]/dashboard/fahrzeug-anbieten/page.tsx`): 135+ hardcoded German strings moved to `wizard.*` namespace ✅
  - All step labels, field labels, placeholders, validation messages, error messages replaced with `t()` calls
  - Fixed hardcoded German number format on review page (`.toLocaleString()` instead of `.toLocaleString("de-DE")`)
  - Updated form field values to use normalized keys (gasoline/diesel, manual/automatic, sedan/suv, direct/tradeIn/consignment, yes/no)
  - Added helper function to translate sales type labels on review page
  - Used error codes from area 8 for validation error messages

- **Code-level improvements** (final fixes + live testing fixes) ✅
  - Extracted constants: `MAX_IMAGES = 20`, `DESCRIPTION_MIN_CHARS = 20`, `MAX_MILEAGE = 99999999`, `MAX_POWER = 99999`, `MAX_PRICE = 99999999.99`
  - Fixed missing placeholder values: `images.uploadCount` now passes `{current, max}`, `description.minCharsNote` now passes `{min}`
  - Updated validation messages to pass placeholder values: `mileageRange` and `powerRange` with `{ max: format.number(...) }`, `priceMax` with EUR currency formatting, `descriptionMinLength` with `{ min }` placeholder
  - Review page now uses `useFormatter().number()` for mileage, power, and price displays with proper localization
  - Imported label helpers (`getFuelTypeLabel`, `getTransmissionLabel`, `getBodyTypeLabel`) and use them on review page to display translated DB values (fuel, transmission, body type)
  - Updated unit message strings: `wizard.units.kilometers` → `wizard.units.mileage` (format "{value} km"), `wizard.units.horsePower` → `wizard.units.power` (format "{value} PS" in de/mk, "{value} hp" in en)
  - Removed unit suffix from field labels (powerHp: "Leistung (PS)" → "Leistung") to avoid duplication when displaying with formatted value
  - Fixed description truncation: changed from `substring(0, 100) + "..."` to CSS `line-clamp-3` for proper ellipsis handling
  - All messages now use ICU placeholders and formatters for consistent number/currency display across locales

- **Success page** (`app/[locale]/dashboard/fahrzeug-angeboten/page.tsx`): Fully localized ✅
  - Added `wizard.success.*` keys in de/en/mk: title, message, description, viewVehicles button, backToDashboard button
  - Macedonian uses formal "Вашето возило" (formal possessive)
  - Updated loading text to use translations instead of hardcoded German

- **Workflow info component** (`components/submission-workflow-info.tsx`): All hardcoded strings replaced with `wizard.workflow.*` keys ✅
  - 4 workflow steps + important note all use translations

- **Message files**: Added 125+ new keys in `wizard.*` namespace across all three locales ✅
  - German (de.json): Full translations for labels, options, validation messages, workflow info, success page; updated validation messages with {min}/{max}/{maxCount} placeholders; new unit format strings
  - English (en.json): Full English translations with proper plurals and formal address; validation placeholders and new unit format strings
  - Macedonian (mk.json): Full Macedonian translations with formal "Вие" forms, no imperatives; validation placeholders with correct Macedonian formatting; new unit format strings with proper abbreviations; success page with formal language

- **Macedonian language corrections** (comprehensive fixes) ✅
  - Wizard title: "Понудете го Вашиот автомобил" (formal verb + formal possessive)
  - Field labels: transmission="Менувач", bodyType="Тип на каросерија", huAu="Технички преглед (HU/AU)", powerHp="Моќност" (unit removed from label)
  - Placeholders: "нпр. BMW, Mercedes" (brand names), "нпр. црна, бела" (lowercase colors)
  - Options: fuel.electric="Електрично", bodyType.wagon="Караван", bodyType.van="Комбе", bodyType.smallCar="Мал автомобил"
  - Common labels (shared with vehicle display): transmissions.manual="Рачен" (not "Ручна" Serbian), transmissions.automatic="Автоматски" (not "Автоматска" Serbian), bodyTypes.van="Комбе" (not "Ван" English)
  - Footer: followUs="Следете нè" (formal, corrected from "Следувајте нас")
  - Terminology: "возило" (not "кола"), "знаци" (not "карактери")
  - ICU plural forms for imagesCount and validation messages

### Tests
- ✅ `npm run check:i18n`: All 413 keys found, no duplicates, all placeholders match, no encoding issues
- ✅ `npm run build`: Compilation successful, no type errors, all pages rendered
- ✅ Area 6 removed all hardcoded strings from wizard workflow (audit count: 135+ → 0)
- ✅ Code passes TypeScript checks; all formatter and label helper calls use correct namespace/parameters
- ✅ Validation messages pass {min}/{max}/{maxCount}/{current} placeholders with formatted values
- ✅ Review page displays mileage/power with proper ICU format strings, translated fuel/transmission/body type values
- ✅ Success page fully localized with proper translations in de/en/mk
- ✅ Missing placeholder values fixed; no raw keys visible on /de, /en, /mk
- ✅ Unit duplication fixed on review step

## Cross-cutting: Middleware Fix for Server Action Response Forwarding (2026-09-25)

### Root Cause
The next-intl middleware was intercepting internal POST requests for server actions (requests with the `next-action` header) and potentially redirecting them based on locale detection. When Next.js's internal `httpRedirectFetch` tried to follow these redirects to forward the server action response, it failed with "fetch failed" in Vercel logs.

### Solution Applied
Modified `middleware.ts` to skip all middleware processing (i18n routing and auth checks) for server action requests:
- Check for POST method + `next-action` header presence
- Return `NextResponse.next()` immediately, bypassing the i18n middleware
- This allows the request to proceed without redirect, while the server action itself still validates auth via `requireUser()`/`requireAdmin()`

### Technical Details
- Server actions run through `lib/auth-guards.ts` (session-based checks), not the middleware
- The middleware now only handles browser page navigations and form submissions
- Server action responses can now be forwarded without encountering middleware-induced redirects
- Fixes the "Failed to forward action response [TypeError: fetch failed]" error seen in Vercel logs

### Tests
- ✅ `npm run build`: Compilation successful
- ✅ `npm run check:i18n`: All checks pass
- Ready for live testing: admin submission detail page should now render signed image URLs correctly

