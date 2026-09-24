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

  // Legal/Business Info (all fictional)
  legal: {
    ustIdNr: "DE000000000 (Beispiel)",
    registerNumber: "HRB 000000 (Beispiel)",
    owner: "Beispielinhaber", // Generic, not a real person
  },
} as const;

/**
 * Get formatted address
 */
export function getFormattedAddress() {
  return `${COMPANY.address.street}, ${COMPANY.address.zip} ${COMPANY.address.city}, ${COMPANY.address.country}`;
}

