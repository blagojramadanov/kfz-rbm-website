"use client";

import { useTranslations } from "next-intl";
import type { z } from "zod";
import { useLocaleFormatter } from "./use-locale-formatter";
import { formatPrice } from "./format-vehicle";
import { VEHICLE_LIMITS, firstInvalidVehicleField } from "./vehicle-schema";

// Schema field -> adminVehicleForm.fields.* label, for the generic message.
const FIELD_LABELS: Record<string, string> = {
  transmission: "transmission",
  fuel_type: "fuel",
  body_type: "bodyType",
  color_exterior: "colorExterior",
  color_interior: "colorInterior",
  description: "description",
  listing_type: "listingType",
  zustand: "condition",
  zielland: "destination",
  export_notes: "exportNotes",
  status: "status",
  featured: "featured",
};

/**
 * Checks admin vehicle form data against the same zod schema the server action uses
 * and returns a translated message for the first invalid field (null if valid).
 */
export function useVehicleValidation() {
  const t = useTranslations("adminVehicleForm");
  const format = useLocaleFormatter();

  return (schema: z.ZodType, data: unknown): string | null => {
    const field = firstInvalidVehicleField(schema, data);
    if (field === null) return null;
    switch (field) {
      case "vin":
      case "brand":
      case "model":
        return t(`validation.${field}`);
      case "year":
        return t("validation.year", { min: String(VEHICLE_LIMITS.minYear), max: String(VEHICLE_LIMITS.maxYear) });
      case "mileage":
        return t("validation.mileage", { max: format.number(VEHICLE_LIMITS.maxMileage) });
      case "price":
        return t("validation.price", { max: formatPrice(format, VEHICLE_LIMITS.maxPrice) });
      case "engine_cc":
        return t("validation.engine", { max: format.number(VEHICLE_LIMITS.maxEngineCc) });
      case "power_hp":
        return t("validation.power", { max: format.number(VEHICLE_LIMITS.maxPowerHp) });
      default: {
        const label = FIELD_LABELS[field];
        return t("validation.invalidField", { field: label ? t(`fields.${label}`) : field });
      }
    }
  };
}
