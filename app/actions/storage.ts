"use server";

import { z } from "zod";
import { ActionError, runAction } from "@/lib/action-result";
import { requireUser } from "@/lib/auth-guards";
import { resolveVehicleImageUrl } from "@/lib/vehicle-images";

const BUCKET = "customer-submitted-photos";
const SIGNED_URL_SECONDS = 3600;

/**
 * Signed URLs (1 h) for photos in the private customer bucket.
 *  - Admins: any path (service-role client, after the role check in the database).
 *  - Customers: only paths recorded as images of a submission they own. Ownership
 *    comes from the database (`submitted_vehicles.user_id` = session user), and the
 *    URLs are signed with the customer's own session client, so the storage RLS
 *    policy ("Customers can view own photos") applies as a second layer.
 * A value that is already a URL is returned resolved, not signed; if signing a
 * customer's own photo fails, it is retried with the service-role client.
 * Paths the caller may not see (or that cannot be signed at all) come back with `url: null`.
 */
export async function getSignedImageUrls(paths: unknown) {
  return runAction("getSignedImageUrls", "LOAD_FAILED", async () => {
    const { supabase, user } = await requireUser();

    const parsed = z.array(z.string().min(1).max(300)).max(100).safeParse(paths);
    if (!parsed.success) throw new ActionError("INVALID_INPUT");
    const requested = [...new Set(parsed.data)];
    if (requested.length === 0) return { urls: [] as { path: string; url: string | null }[] };

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profileError) throw profileError;
    const isAdmin = profile?.role === "ADMIN";

    let signer = supabase;
    let allowed: Set<string>;
    if (isAdmin) {
      const { getSupabaseAdminClient } = await import("@/lib/supabase-admin");
      signer = getSupabaseAdminClient() as unknown as typeof supabase;
      allowed = new Set(requested);
    } else {
      // Only image rows whose submission belongs to the session user.
      const { data: owned, error } = await supabase
        .from("submitted_vehicle_images")
        .select("image_url, submitted_vehicles!inner(user_id)")
        .in("image_url", requested)
        .eq("submitted_vehicles.user_id", user.id);
      if (error) throw error;
      allowed = new Set((owned ?? []).map((row) => row.image_url as string));
    }

    const sign = async (client: typeof supabase, path: string) => {
      const { data, error } = await client.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
      if (error) console.error("[getSignedImageUrls] createSignedUrl failed:", path, error.message);
      return data?.signedUrl ?? null;
    };

    const urls = await Promise.all(
      requested.map(async (path) => {
        if (!allowed.has(path)) return { path, url: null };
        // Already a URL (e.g. a photo that was stored as a public vehicle-images URL):
        // shown the way the public vehicle images are, not signed.
        if (/^(https?:|data:)/i.test(path)) return { path, url: resolveVehicleImageUrl(path) };

        // Rows written as "customer-submitted-photos/{user}/..." or "/{user}/..." are
        // signed under the plain object path.
        const objectPath = path.replace(/^\/+/, "").replace(new RegExp(`^${BUCKET}/`), "");
        let url = await sign(signer, objectPath);
        if (!url && !isAdmin) {
          // The storage policy only matches the {user_id}/{submission_id}/ layout; older
          // uploads can sit elsewhere. Ownership is already checked above via the
          // database, so sign with the service-role client instead of dropping the photo.
          const { getSupabaseAdminClient } = await import("@/lib/supabase-admin");
          url = await sign(getSupabaseAdminClient() as unknown as typeof supabase, objectPath);
        }
        return { path, url };
      })
    );
    return { urls };
  });
}
