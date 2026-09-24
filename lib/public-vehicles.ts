import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import {
  getLegacyVehicleSlug,
  getSlugIdPrefix,
  getVehicleSlug,
} from "@/lib/vehicle-slug";

/**
 * Public, read-only vehicle queries (homepage, listings, detail page).
 *
 * Uses the anon key without cookies, so only what the existing RLS policy
 * ("Public can view available vehicles": status = 'available') lets an
 * anonymous visitor read is ever returned. The `status` filter below just
 * mirrors that policy. Never use the service-role client here.
 *
 * Because nothing here touches cookies/headers, the pages that call it can be
 * statically generated and refreshed with ISR (`export const revalidate = 60`).
 */

export const REVALIDATE_SECONDS = 60;

export type ListingType = "verkauf" | "export";

export interface PublicVehicle {
  id: string;
  /** Unique detail-page slug, see lib/vehicle-slug.ts. */
  slug: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  /** Raw DB values (e.g. "diesel", "Benzin"); map with the helpers in lib/vehicle-labels.ts. */
  fuelType: string;
  transmission: string;
  bodyType: string;
  color: string;
  powerHp: number | null;
  listingType: ListingType;
  featured: boolean;
  /** First image by sort_order, or null when the vehicle has none. */
  image: string | null;
  createdAt: string;
}

export interface PublicVehicleDetail extends PublicVehicle {
  /** All images by sort_order. */
  images: string[];
  engineCc: number | null;
  description: string | null;
  /** Export condition (fahrbereit, nicht_fahrbereit, unfallwagen). */
  zustand: string | null;
  zielland: string | null;
  exportNotes: string | null;
}

interface VehicleRow {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel_type: string | null;
  transmission: string | null;
  body_type: string | null;
  color_exterior: string | null;
  power_hp: number | null;
  listing_type: string | null;
  featured: boolean | null;
  created_at: string;
  vehicle_images: { image_url: string; sort_order: number | null }[] | null;
}

interface VehicleDetailRow extends VehicleRow {
  engine_cc: number | null;
  description: string | null;
  zustand: string | null;
  zielland: string | null;
  export_notes: string | null;
}

const LIST_COLUMNS =
  "id, brand, model, year, price, mileage, fuel_type, transmission, body_type, color_exterior, power_hp, listing_type, featured, created_at, vehicle_images(image_url, sort_order)";
const DETAIL_COLUMNS = `${LIST_COLUMNS}, engine_cc, description, zustand, zielland, export_notes`;

function getPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      // Cached and refreshed every REVALIDATE_SECONDS (ISR); never "no-store".
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, next: { revalidate: REVALIDATE_SECONDS } }),
      },
    },
  );
}

function sortedImages(row: VehicleRow): string[] {
  return [...(row.vehicle_images ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((image) => image.image_url);
}

function toPublicVehicle(row: VehicleRow): PublicVehicle {
  return {
    id: row.id,
    slug: getVehicleSlug(row),
    brand: row.brand,
    model: row.model,
    year: row.year,
    price: Number(row.price),
    mileage: row.mileage,
    fuelType: row.fuel_type ?? "",
    transmission: row.transmission ?? "",
    bodyType: row.body_type ?? "",
    color: row.color_exterior ?? "",
    powerHp: row.power_hp,
    listingType: row.listing_type === "export" ? "export" : "verkauf",
    featured: Boolean(row.featured),
    image: sortedImages(row)[0] ?? null,
    createdAt: row.created_at,
  };
}

function toPublicVehicleDetail(row: VehicleDetailRow): PublicVehicleDetail {
  return {
    ...toPublicVehicle(row),
    images: sortedImages(row),
    engineCc: row.engine_cc,
    description: row.description,
    zustand: row.zustand,
    zielland: row.zielland,
    exportNotes: row.export_notes,
  };
}

interface ListOptions {
  listingType?: ListingType;
  featured?: boolean;
  limit?: number;
}

/** Newest available vehicles. Returns [] (and logs) when the query fails. */
export async function getPublicVehicles(options: ListOptions = {}): Promise<PublicVehicle[]> {
  let query = getPublicClient()
    .from("vehicles")
    .select(LIST_COLUMNS)
    .eq("status", "available");
  if (options.listingType) query = query.eq("listing_type", options.listingType);
  if (options.featured) query = query.eq("featured", true);

  let ordered = query.order("created_at", { ascending: false });
  if (options.limit) ordered = ordered.limit(options.limit);

  const { data, error } = await ordered;
  if (error) {
    console.error("Failed to load public vehicles:", error.message);
    return [];
  }
  return ((data ?? []) as unknown as VehicleRow[]).map(toPublicVehicle);
}

/** Newest available vehicles of any listing type (sale and export). */
export function getLatestVehicles(limit = 4): Promise<PublicVehicle[]> {
  return getPublicVehicles({ limit });
}

/** Newest available vehicles that have `vehicles.featured = true`. */
export function getFeaturedVehicles(limit = 6): Promise<PublicVehicle[]> {
  return getPublicVehicles({ featured: true, limit });
}

/**
 * Looks a vehicle up by the id part at the end of its slug, using a range on the
 * uuid primary key (no scan). Returns null when the slug has no id part or no
 * available vehicle matches. Throws on a query error so a transient failure is
 * not cached as a 404.
 */
export const getVehicleBySlug = cache(async (slug: string): Promise<PublicVehicleDetail | null> => {
  const prefix = getSlugIdPrefix(slug);
  if (!prefix) return null;

  const { data, error } = await getPublicClient()
    .from("vehicles")
    .select(DETAIL_COLUMNS)
    .eq("status", "available")
    .gte("id", `${prefix}-0000-0000-0000-000000000000`)
    .lte("id", `${prefix}-ffff-ffff-ffff-ffffffffffff`)
    .limit(5);
  if (error) throw new Error(`Failed to load vehicle "${slug}": ${error.message}`);

  const rows = (data ?? []) as unknown as VehicleDetailRow[];
  // 8 hex chars can in theory collide; prefer the row whose brand/model also match.
  const row = rows.find((r) => getVehicleSlug(r) === slug.toLowerCase()) ?? rows[0];
  return row ? toPublicVehicleDetail(row) : null;
});

/**
 * Resolves an old `brand-model` URL to the vehicle's current unique slug (the
 * newest available match, like the old lookup did). Only fetches id/brand/model.
 */
export const findSlugByLegacySlug = cache(async (legacySlug: string): Promise<string | null> => {
  const { data, error } = await getPublicClient()
    .from("vehicles")
    .select("id, brand, model")
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(`Failed to resolve legacy slug "${legacySlug}": ${error.message}`);

  const match = (data ?? []).find((v) => getLegacyVehicleSlug(v) === legacySlug.toLowerCase());
  return match ? getVehicleSlug(match) : null;
});

/** Other available vehicles of the same brand (newest first). */
export async function getRelatedVehicles(
  vehicle: Pick<PublicVehicle, "id" | "brand">,
  limit = 4,
): Promise<PublicVehicle[]> {
  const { data, error } = await getPublicClient()
    .from("vehicles")
    .select(LIST_COLUMNS)
    .eq("status", "available")
    .eq("brand", vehicle.brand)
    .neq("id", vehicle.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Failed to load related vehicles:", error.message);
    return [];
  }
  return ((data ?? []) as unknown as VehicleRow[]).map(toPublicVehicle);
}
