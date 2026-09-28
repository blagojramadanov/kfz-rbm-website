/**
 * Central company data. Real data only: fields the owner has not provided
 * (USt-IdNr., Handelsregister, opening hours) are deliberately absent and must
 * not be shown anywhere until they are.
 *
 * Naming: `legalName` ("KFZ RBM") is used in the Impressum, the privacy policy
 * (controller) and the footer copyright line. Everywhere else the brand `name`
 * ("RBM") / `fullName` is used. Neither is translated.
 */

// `t` must come from `useTranslations("company")` / `getTranslations({ locale, namespace: "company" })`.
type CompanyTranslator = (key: any, values?: Record<string, string>) => string;

export const COMPANY = {
  // Brand (used in the UI)
  name: "RBM",
  fullName: "RBM Premium Used Cars",

  // Legal entity
  legalName: "KFZ RBM",
  owner: "Vlado Ramadanov",

  // Contact
  email: "kfzrbm@gmail.com",
  phone: "+49 176 11848557",
  /** E.164 form for tel: links */
  phoneE164: "+4917611848557",

  // Address (proper names, not translated; the country and the district label are, see `company.address.*`)
  address: {
    street: "Am Neuhäusl 24",
    zip: "93142",
    city: "Maxhütte-Haidhof",
    district: "Pirkensee",
  },

  social: {
    facebook: "https://www.facebook.com/profile.php?id=61573370368219",
    instagram: "https://www.instagram.com/kfzrbm/",
  },
} as const;

export const PHONE_HREF = `tel:${COMPANY.phoneE164}`;
export const EMAIL_HREF = `mailto:${COMPANY.email}`;

/** Address parts in the active language (`t` = `company` namespace translator). */
export function getAddress(t: CompanyTranslator) {
  return {
    street: COMPANY.address.street,
    zip: COMPANY.address.zip,
    city: COMPANY.address.city,
    district: t("address.district", { name: COMPANY.address.district }),
    country: t("address.country"),
  };
}

/** One-line address, e.g. "Am Neuhäusl 24, 93142 Maxhütte-Haidhof (Ortsteil Pirkensee), Deutschland". */
export function getFormattedAddress(t: CompanyTranslator) {
  const { street, zip, city, district, country } = getAddress(t);
  return `${street}, ${zip} ${city} (${district}), ${country}`;
}
