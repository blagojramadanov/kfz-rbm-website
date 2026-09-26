import { z } from "zod";

// Shared by the admin vehicle actions (server, authoritative) and the admin vehicle
// forms (client, to show a translated message per field before submitting).

export const VEHICLE_LIMITS = {
  minYear: 1900,
  maxYear: new Date().getFullYear() + 1,
  maxMileage: 5_000_000,
  maxPrice: 100_000_000,
  maxEngineCc: 20_000,
  maxPowerHp: 5_000,
} as const;

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();
const optionalInt = (max: number) => z.number().int().min(0).max(max).optional().nullable();

// Columns an admin may set from the vehicle forms. Anything else (id, source_type,
// submitted_vehicle_id, created_at, ...) is stripped.
export const vehicleFieldsSchema = z.object({
  vin: z.string().trim().min(1).max(17),
  brand: z.string().trim().min(1).max(50),
  model: z.string().trim().min(1).max(100),
  year: z.number().int().min(VEHICLE_LIMITS.minYear).max(VEHICLE_LIMITS.maxYear),
  mileage: z.number().int().min(0).max(VEHICLE_LIMITS.maxMileage),
  price: z.number().min(0).max(VEHICLE_LIMITS.maxPrice),
  transmission: optionalText(20),
  fuel_type: optionalText(20),
  body_type: optionalText(30),
  color_exterior: optionalText(50),
  color_interior: optionalText(50),
  engine_cc: optionalInt(VEHICLE_LIMITS.maxEngineCc),
  power_hp: optionalInt(VEHICLE_LIMITS.maxPowerHp),
  description: optionalText(10_000),
  listing_type: z.enum(["verkauf", "export"]).optional(),
  zustand: optionalText(30),
  zielland: optionalText(100),
  export_notes: optionalText(5_000),
});

export const vehicleUpdateSchema = vehicleFieldsSchema.partial().extend({
  status: z.enum(["draft", "available", "sold", "reserved"]).optional(),
  featured: z.boolean().optional(),
});

/** Name of the first invalid field, or null if the data is valid. */
export function firstInvalidVehicleField(schema: z.ZodType, data: unknown): string | null {
  const result = schema.safeParse(data);
  if (result.success) return null;
  return String(result.error.issues[0]?.path[0] ?? "");
}
