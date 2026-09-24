/**
 * Central Company Configuration
 * All company name, contact info, and branding comes from this file
 * This is a DEMO/EXAMPLE website with fictional data only
 *
 * Placeholder wording that reads differently per language ("Beispielstraße",
 * "(Beispiel)", ...) lives in messages/*.json under `company.*`; use
 * getFormattedAddress() / getLegalInfo() with a `company` translator.
 */

// `t` must come from `useTranslations("company")` / `getTranslations({ locale, namespace: "company" })`.
type CompanyTranslator = (key: any) => string;

export const COMPANY = {
  // Display name (used in UI)
  name: "RBM",
  fullName: "RBM Premium Used Cars",

  // Contact Information (all fictional example data)
  email: "info@example.com",
  phone: "+49 000 0000000",

  // Address (fictional; street, city and country are localized, see `company.address.*`)
  address: {
    zip: "12345",
  },

  // Business hours (fictional). 24h strings; null means closed.
  // Single source of truth for the contact page and the footer (see components/business-hours.tsx).
  hours: {
    weekdays: { open: "09:00", close: "18:00" },
    saturday: { open: "10:00", close: "16:00" },
    sunday: null,
  },

  // Social Media
  social: {
    facebook: "#", // Placeholder - no real profile
    instagram: "#", // Placeholder - no real profile
    linkedin: "#", // Placeholder - no real profile
    twitter: "#", // Placeholder - no real profile
  },
} as const;

/** Address parts in the active language (`t` = `company` namespace translator). */
export function getAddress(t: CompanyTranslator) {
  return {
    street: t("address.street"),
    zip: COMPANY.address.zip,
    city: t("address.city"),
    country: t("address.country"),
  };
}

/** Legal/business identifiers in the active language (`t` = `company` namespace translator). */
export function getLegalInfo(t: CompanyTranslator) {
  return {
    ustIdNr: t("legal.ustIdNr"),
    registerNumber: t("legal.registerNumber"),
  };
}

/**
 * Get formatted address
 */
export function getFormattedAddress(t: CompanyTranslator) {
  const { street, zip, city, country } = getAddress(t);
  return `${street}, ${zip} ${city}, ${country}`;
}
