"use server";

import { z } from "zod";
import { ActionError, runAction } from "@/lib/action-result";
import { requireUser } from "@/lib/auth-guards";
import {
  LIST_COLUMNS,
  toPublicVehicle,
  type PublicVehicle,
  type VehicleRow,
} from "@/lib/public-vehicles";

/**
 * Favorites ("Merken"), table `favorites` (migration 029).
 *
 * Every action uses the RLS-bound session client and the session user; the client
 * only ever sends a vehicle id. Guests get `{ ok: false, error: "UNAUTHORIZED" }`
 * (requireUser() throws it), which the UI turns into a redirect to the login.
 *
 * RLS: a customer reads/deletes only their own rows and may only insert a favorite
 * for a publicly listed vehicle. A favorite stays when its vehicle is sold or set
 * back to draft; the vehicles policy then hides that vehicle, so the embedded
 * vehicle comes back as null. Such favorites are returned with `vehicle: null` (no
 * service-role fallback) and shown as "no longer available".
 */

const vehicleIdSchema = z.guid();

// Postgres error codes returned by PostgREST.
const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";
const RLS_VIOLATION = "42501";

function parseVehicleId(vehicleId: unknown): string {
  const parsed = vehicleIdSchema.safeParse(vehicleId);
  if (!parsed.success) throw new ActionError("INVALID_INPUT");
  return parsed.data;
}

/** Vehicle ids the current user has saved (including ones no longer listed). */
export async function getFavoriteIds() {
  return runAction("getFavoriteIds", "LOAD_FAILED", async () => {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("favorites")
      .select("vehicle_id")
      .eq("user_id", user.id);
    if (error) throw error;
    return { ids: (data ?? []).map((row) => row.vehicle_id as string) };
  });
}

/**
 * Saves the vehicle, or removes it when it is already saved. Returns the new state,
 * which the UI takes over (it may differ from the optimistic guess, e.g. after a
 * change in another tab).
 */
export async function toggleFavorite(vehicleId: unknown) {
  return runAction("toggleFavorite", "UPDATE_FAILED", async () => {
    const { supabase, user } = await requireUser();
    const id = parseVehicleId(vehicleId);

    const { data: removed, error: deleteError } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("vehicle_id", id)
      .select("id");
    if (deleteError) throw deleteError;
    if (removed && removed.length > 0) return { saved: false };

    const { error: insertError } = await supabase
      .from("favorites")
      .insert({ user_id: user.id, vehicle_id: id });
    if (insertError) {
      // Saved in parallel (double click, second tab): it is saved either way.
      if (insertError.code === UNIQUE_VIOLATION) return { saved: true };
      // Unknown vehicle, or not publicly listed (RLS WITH CHECK).
      if (insertError.code === FOREIGN_KEY_VIOLATION || insertError.code === RLS_VIOLATION) {
        throw new ActionError("NOT_FOUND");
      }
      throw insertError;
    }
    return { saved: true };
  });
}

/** Removes one favorite (dashboard; also works for vehicles that are no longer listed). */
export async function removeFavorite(vehicleId: unknown) {
  return runAction("removeFavorite", "DELETE_FAILED", async () => {
    const { supabase, user } = await requireUser();
    const id = parseVehicleId(vehicleId);
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("vehicle_id", id);
    if (error) throw error;
    return {};
  });
}

export interface FavoriteEntry {
  vehicleId: string;
  createdAt: string;
  /** null when the vehicle is no longer publicly listed (sold, reserved, draft). */
  vehicle: PublicVehicle | null;
}

type FavoriteRow = {
  vehicle_id: string;
  created_at: string;
  vehicle: (VehicleRow & { status: string | null }) | null;
};

/** The current user's favorites, newest first. */
export async function getFavorites() {
  return runAction("getFavorites", "LOAD_FAILED", async () => {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("favorites")
      .select(`vehicle_id, created_at, vehicle:vehicles(${LIST_COLUMNS}, status)`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const favorites: FavoriteEntry[] = ((data ?? []) as unknown as FavoriteRow[]).map((row) => {
      // RLS already hides unlisted vehicles from customers; the check also covers
      // an admin (who can read every vehicle) looking at their own favorites.
      const listed =
        row.vehicle !== null &&
        row.vehicle.status === "available" &&
        (row.vehicle.listing_type === "verkauf" || row.vehicle.listing_type === "export");
      return {
        vehicleId: row.vehicle_id,
        createdAt: row.created_at,
        vehicle: listed && row.vehicle ? toPublicVehicle(row.vehicle) : null,
      };
    });
    return { favorites };
  });
}
