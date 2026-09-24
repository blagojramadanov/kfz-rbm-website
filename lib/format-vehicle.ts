import type { useFormatter } from "next-intl";

// Works with both `useFormatter()` (client) and `await getFormatter()` (server).
type Formatter = ReturnType<typeof useFormatter>;

/** Whole-euro price in the active locale, e.g. "42.750 €" (de) / "€42,750" (en). */
export function formatPrice(format: Formatter, price: number): string {
  return format.number(price, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

/** Mileage in kilometres in the active locale, e.g. "28.000 km" (de) / "28,000 km" (en). */
export function formatMileage(format: Formatter, mileage: number): string {
  return format.number(mileage, { style: "unit", unit: "kilometer" });
}
