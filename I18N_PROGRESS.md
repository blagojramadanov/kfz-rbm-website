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

- [ ] `app/[locale]/login/page.tsx` - Login form (title "Willkommen zurück", labels "Email", "Passwort", buttons "Anmelden", links "Passwort vergessen?", error messages)
- [ ] `app/[locale]/register/page.tsx` - Registration form (title, form labels, validation messages, submit button, login link)
- [ ] `app/[locale]/forgot-password/page.tsx` - Forgot password form (title, email input label, submit button, back to login link)
- [ ] `app/[locale]/reset-password/page.tsx` - Reset password form (title, password input labels, validation messages, submit button)

---

## 6. Customer: "Mein Auto anbieten" Wizard

- [ ] `app/[locale]/dashboard/fahrzeug-anbieten/page.tsx` - Vehicle submission wizard (step headers, form labels, descriptions, validation messages, CTA buttons)
- [ ] `components/submission-workflow-info.tsx` - Workflow information boxes, step descriptions, help text

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

- [ ] `app/actions/admin.ts` or similar - Admin action error messages ("Fahrzeug gelöscht", "Fehler beim Löschen", confirmation dialogs "Sind Sie sicher...")
- [ ] `app/actions/auth.ts` or similar - Auth action messages (login errors, registration messages, validation)
- [ ] `app/actions/dashboard.ts` or similar - Dashboard action messages (submission success/error, profile update, trade-in status)
- [ ] `lib/auth-context.tsx` - Auth context error messages, loading states

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
- **Completed**: 24
- **Not started**: 40

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
- [ ] **Customers must not delete their submitted vehicles; only admins can.** Checked against the migrations in this repo (not against the live database): `submitted_vehicles` has only "Admins can delete submissions" for DELETE (`023_security_audit_fixes.sql`, which also drops every earlier policy first, incl. 002's "Users can delete their own draft vehicles"); `submitted_vehicle_images` and the customer storage bucket likewise allow DELETE for admins only; no customer UI calls a delete on these tables. Still to do: run `select tablename, policyname, cmd, roles from pg_policies where tablename in ('submitted_vehicles','submitted_vehicle_images')` in the Supabase SQL editor to confirm the live policies match, and remove the dead draft-image delete path in `updateVehicleImages` (`app/actions/vehicles.ts`; RLS would deny it anyway).
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
3. **Guards are client-side only** (there is no auth check in `middleware.ts`): a logged-out visitor gets the 200 shell and is then redirected by JS. Verified on the production build: all 22 protected routes x 3 locales redirect to `/{locale}/login` (locale preserved, none stayed on the page). Recommended hardening (not done): a server-side guard in the middleware (check the Supabase session cookie) or `dynamic = "force-dynamic"` on the dashboard/admin layouts.
4. **Customer sees only own data - not verified live** (no credentials). Evidence from code/DB: customer pages query `submitted_vehicles`/`trade_in_requests` under RLS (`auth.uid() = user_id`, migration 023). With the anonymous key (read-only probes on the live project): `submitted_vehicles`, `submitted_vehicle_images`, `trade_in_requests`, `customer_inquiries` -> `42501 permission denied`; `user_profiles` -> `[]`; non-available `vehicles` -> `[]`. (`favorite_vehicles` and `admin_settings` do not exist in the live DB, although `lib/supabase.ts` defines `FavoriteVehicle` and migration 019 creates `admin_settings`.)
5. **After logout - not verified live.** Because the cached HTML never contains user data, logout cannot leak cached content from the server side; whether the back button / bfcache shows stale client state after logout still needs the authenticated pass.
6. **Two authorization gaps found while reading the actions (out of i18n scope, not exploited or tested):** `uploadVehicleImagesBase64` in `app/actions/vehicles.ts` uses the service-role client with no session or admin check, and the full vehicle UUIDs are present in the public listing HTML, so an unauthenticated caller could attach images to any published vehicle; `finalizeSubmission(vehicleId, userId)` (same file, currently unused) uses the service-role client and trusts the client-supplied `userId` without checking the session. Both should call the same `verifyAdminRole()` / `getSupabaseUser()` guards as the other actions.

### Suggested order

1. Area 5 + global `not-found.tsx` + mk imperatives in `buttons.*`/`auth.*` (small, most visible); 2. area 8 error-code design (blocks 6-11); 3. area 7 + 6 (customer flow); 4. areas 9-11 (admin); 5. delete the legacy `app/admin`/`app/dashboard` duplicates first (halves the work), add server-side guards, run the authenticated audit passes.
