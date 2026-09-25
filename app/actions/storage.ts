"use server";

import { z } from "zod";
import { ActionError, runAction, toErrorCode } from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth-guards";

/** Signed URLs (1 h) for photos in the private customer bucket. Admin only. */
export async function getSignedImageUrls(paths: unknown) {
  return runAction("getSignedImageUrls", "LOAD_FAILED", async () => {
    // Admin-only: uses service-role client to bypass storage RLS for reading all customers' images
    try {
      await requireAdmin();
    } catch (error) {
      throw new ActionError(toErrorCode(error, "UNAUTHORIZED") === "FORBIDDEN" ? "UNAUTHORIZED" : toErrorCode(error, "UNAUTHORIZED"));
    }

    const parsed = z.array(z.string().max(300)).max(100).safeParse(paths);
    if (!parsed.success) throw new ActionError("INVALID_INPUT");

    const { getSupabaseAdminClient } = await import("@/lib/supabase-admin");
    const supabase = getSupabaseAdminClient();

    const urls = await Promise.all(
      parsed.data.map(async (path) => {
        try {
          const { data, error } = await supabase.storage.from("customer-submitted-photos").createSignedUrl(path, 3600);
          if (error) {
            console.error(`[getSignedImageUrls] createSignedUrl failed for ${path}:`, error.message);
          }
          return { path, url: data?.signedUrl ?? null };
        } catch (err) {
          console.error(`[getSignedImageUrls] exception for ${path}:`, err);
          return { path, url: null };
        }
      })
    );
    return { urls };
  });
}
