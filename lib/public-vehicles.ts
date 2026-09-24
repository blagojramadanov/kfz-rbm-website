import { createClient } from "@supabase/supabase-js";

/**
 * Public, read-only vehicle queries for the homepage.
 *
 * Uses the anon key without cookies, so only what the existing RLS policy
 * ("Public can view available vehicles": status = 'available') lets an
 * anonymous visitor read is ever returned. The `status` filter below just
 * mirrors that policy. Never use the service-role client here.
 */

export interface PublicVehicle {
  id: string;
  slug: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  /** Raw DB value (e.g. "diesel", "Benzin"); map with getFuelTypeLabel(). */
  fuelType: string;
  /** First image by sort_order, or null when the vehicle has none. */
  image: string | null;
  featured: boolean;
}

interface VehicleRow {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel_type: string | null;
  featured: boolean | null;
  vehicle_images: { image_url: string; sort_order: number | null }[] | null;
}

/**
 * Slug of the vehicle detail route (/fahrzeuge/[slug]). Must stay identical to
 * the matching logic in app/[locale]/fahrzeuge/[slug]/page.tsx.
 */
export function getVehicleSlug(vehicle: { brand: string; model: string }): string {
  return `${vehicle.brand}-${vehicle.model}`.toLowerCase().replace(/\s+/g, "-");
}

function getPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      // Homepage lists must reflect newly published vehicles immediately.
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    },
  );
}

function toPublicVehicle(row: VehicleRow): PublicVehicle {
  const images = [...(row.vehicle_images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  return {
    id: row.id,
    slug: getVehicleSlug(row),
    brand: row.brand,
    model: row.model,
    year: row.year,
    price: Number(row.price),
    mileage: row.mileage,
    fuelType: row.fuel_type ?? "",
    image: images[0]?.image_url ?? null,
    featured: Boolean(row.featured),
  };
}

async function queryVehicles(limit: number, onlyFeatured: boolean): Promise<PublicVehicle[]> {
  let query = getPublicClient()
    .from("vehicles")
    .select(
      "id, brand, model, year, price, mileage, fuel_type, featured, vehicle_images(image_url, sort_order)",
    )
    .eq("status", "available");
  if (onlyFeatured) query = query.eq("featured", true);

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load public vehicles:", error.message);
    return [];
  }
  return ((data ?? []) as unknown as VehicleRow[]).map(toPublicVehicle);
}

/** Newest published vehicles. */
export function getLatestVehicles(limit = 4): Promise<PublicVehicle[]> {
  return queryVehicles(limit, false);
}

/** Newest published vehicles that have `vehicles.featured = true`. */
export function getFeaturedVehicles(limit = 6): Promise<PublicVehicle[]> {
  return queryVehicles(limit, true);
}
