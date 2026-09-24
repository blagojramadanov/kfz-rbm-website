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
