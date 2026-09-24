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
- [x] `app/[locale]/page.tsx` - Main homepage with hero section ("Gebrauchtwagen kaufen. Verkaufen. Inzahlungnahme. Export.", "Deutschlands führender Autohändler...", "Fahrzeuge entdecken", "Mein Auto anbieten", "Neu hinzugefügte Fahrzeuge", "Ausgewählte Fahrzeuge", "Unsere Dienstleistungen", "Why Choose Us?", "Qualitätsgarantie", "Expertenteam", "Transparente Preise", "About Our Company", "Schnelle Abwicklung", "Faire Preise", "Gesamtlösung", "Bereit für Ihr Traumauto?", "Kontakt aufnehmen", "Anrufen: +49 123 456789")
- [x] `components/featured-vehicles.tsx` - Featured vehicle labels and descriptions
- [x] `components/latest-vehicles.tsx` - Latest vehicle section labels
- [x] `components/search-bar.tsx` - Search input placeholders and button labels
- [x] `components/services-grid.tsx` - Service card titles and descriptions

---

## 3. Vehicle Pages (/fahrzeuge, /fahrzeuge/export, /fahrzeuge/[slug])

- [ ] `app/[locale]/fahrzeuge/page.tsx` - Vehicle listing page headers, filters, sorting options
- [ ] `app/[locale]/fahrzeuge/export/page.tsx` - Export vehicle page headers and content
- [ ] `app/[locale]/fahrzeuge/[slug]/page.tsx` - Individual vehicle detail page (title, specifications, features, CTA buttons)
- [ ] `app/[locale]/vehicles/page.tsx` - Alternative vehicle listing page
- [ ] `components/vehicle-gallery.tsx` - Gallery controls, image navigation labels
- [ ] `components/vehicle-card.tsx` - Vehicle card display (price labels, status badges, view/favorite buttons)
- [ ] `components/vehicle-filters.tsx` - Filter labels (brand, model, year, price, mileage) and options
- [ ] `components/vehicle-source-badge.tsx` - Source type badges and labels
- [ ] `components/listing-type-badge.tsx` - Listing type badges and labels

> **Macedonian (mk) TODO for this area:** the `vehicles.filter*` strings (e.g. `vehicles.filter`, `filterBrand`, `filterModel`, `filterYear`, `filterPrice`, `filterMileage`) use singular imperatives ("Филтрирај"). They must be changed to the formal "Вие" plural forms ("Филтрирајте") when this area is translated. Review the rest of `vehicles.*` in `mk.json` for the same problem.
> Also: map DB fuel type / transmission values with `getFuelTypeLabel()` / `getTransmissionLabel()` (`lib/vehicle-labels.ts`); `components/vehicle-filters.tsx` currently renders them raw.

---

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

- **Total Files**: 74
- **Completed**: 0
- **In Progress**: 0
- **Not Started**: 74

---

## Conventions (read before touching messages)

- **Message layout**: one file per locale, `messages/{de,en,mk}.json`, loaded whole by `i18n.ts`.
  - Homepage strings: `pages.home.*` (components call `useTranslations("pages.home")`).
  - Shared labels: `common.*` (incl. `common.fuelTypes`, `common.transmissions`), opening-hours day labels: `hours.*`, page metadata: `meta.*`.
- **next-intl keys are always relative to the namespace** passed to `useTranslations`/`getTranslations`; a dotted key is *not* an absolute path.
- **Never append a block to the JSON without checking the key does not already exist.** A duplicate top-level key does not error: `JSON.parse` (and webpack) keep the last one and silently drop the earlier section. `npm run check:i18n` now fails on duplicate keys.
- **DB values are never translated or changed.** Map them with `getFuelTypeLabel()` / `getTransmissionLabel()` from `lib/vehicle-labels.ts` (uses `t.has()`, falls back to the raw value). Pass a translator from `useTranslations("common")`.
- **Opening hours** live only in `COMPANY.hours` (`lib/company.ts`, 24h). Render them with `<BusinessHours />` (24h for de/mk, 12h AM/PM for en).
- German: formal "Sie". Macedonian: formal "Вие" (never "ти"). "RBM" and "Premium Cars" stay untranslated.
- Message files: UTF-8 **without BOM**, 4-space indent, trailing newline. Do not write them with PowerShell.
- Run `npm run check:i18n` (= `node scripts/check-i18n.mjs`) before every commit. It checks: duplicate keys, BOM, mojibake, key parity across locales, {placeholder} parity, and that every `t("…")` call in `app/`, `components/`, `lib/` resolves (namespace-aware) to a string in all three locales. Keys built with `${…}` only have their parent object verified.

## Incident log

- **2026-09-24 – homepage showed raw keys in production.** Commit `f22dbdd` appended second `vehicles`, `contact` and `pages` blocks to each message file; the later duplicates shadowed the originals, so `pages.home.*` (and other `pages.*`) disappeared, while copies of the home blocks sat at the JSON root. The old check script passed because it treated every dotted key as an absolute path and could not see duplicate keys. Fixed by merging the blocks, moving the home strings back to `pages.home`, and rewriting the check script.

## Known follow-ups

- Vehicle pages (section 3) still need translating; reuse `common.fuelTypes` / `common.transmissions`.
- `pages.about` and `pages.services` are still "coming soon" placeholders (translated in de/en/mk).
- Some `mk` strings outside the pages touched here (e.g. `vehicles.filter*`) use singular imperatives ("Филтрирај"); switch to the formal plural ("Филтрирајте") when those pages are translated.
- Homepage CTAs are wired with the locale-aware `Link` from `lib/navigation.ts` (pass hrefs without a locale prefix). Still unlinked: the demo vehicle cards' "view details" and "test drive" buttons (the demo cards are hardcoded, not DB vehicles, and there is no test-drive page).
