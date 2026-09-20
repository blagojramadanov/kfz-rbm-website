/**
 * Central Company Configuration
 * All company name, contact info, and branding comes from this file
 * This is a DEMO/EXAMPLE website with fictional data only
 */

export const COMPANY = {
  // Display name (used in UI)
  name: "RBM",
  fullName: "RBM Premium Used Cars",

  // Contact Information (all fictional example data)
  email: "info@example.com",
  phone: "+49 000 0000000",

  // Address (all fictional example data)
  address: {
    street: "Beispielstraße 1",
    city: "Beispielstadt",
    zip: "12345",
    country: "Deutschland",
  },

  // Business hours (fictional)
  hours: {
    weekday: "09:00 - 18:00",
    saturday: "10:00 - 16:00",
    closed: "Sonntag",
  },

  // Social Media
  social: {
    facebook: "#", // Placeholder - no real profile
    instagram: "#", // Placeholder - no real profile
    linkedin: "#", // Placeholder - no real profile
    twitter: "#", // Placeholder - no real profile
  },

  // Demo/Example Notice
  demoNotice: {
    de: "Demo-Website – alle Angaben sind fiktive Beispieldaten.",
    en: "Demo website – all information is fictional example data.",
    mk: "Демо веб-сајт – сви подаци су фиктивни примери.",
  },

  // Legal/Business Info (all fictional)
  legal: {
    ustIdNr: "DE000000000 (Beispiel)",
    registerNumber: "HRB 000000 (Beispiel)",
    owner: "Beispielinhaber", // Generic, not a real person
  },

  // Tagline
  tagline: "Premium Gebrauchtwagen von vertrauenswürdigen Partnern",
} as const;

/**
 * Get formatted address
 */
export function getFormattedAddress() {
  return `${COMPANY.address.street}, ${COMPANY.address.zip} ${COMPANY.address.city}, ${COMPANY.address.country}`;
}

/**
 * Get formatted hours
 */
export function getFormattedHours() {
  return `Mo-Fr: ${COMPANY.hours.weekday}, Sa: ${COMPANY.hours.saturday}, ${COMPANY.hours.closed}: Geschlossen`;
}
