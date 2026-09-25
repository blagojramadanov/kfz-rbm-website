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
    if (!parsed.success) {
      console.error("[getSignedImageUrls] Validation failed:", parsed.error);
      throw new ActionError("INVALID_INPUT");
    }

    console.log(`[getSignedImageUrls] Processing ${parsed.data.length} paths:`, parsed.data.slice(0, 2));

    const { getSupabaseAdminClient } = await import("@/lib/supabase-admin");
    const supabase = getSupabaseAdminClient();

    const urls = await Promise.all(
      parsed.data.map(async (path) => {
        try {
          const { data, error } = await supabase.storage.from("customer-submitted-photos").createSignedUrl(path, 3600);
          if (error) {
            console.error(`[getSignedImageUrls] createSignedUrl error for path "${path}":`, {
              message: error.message,
              status: (error as any).status,
              statusCode: (error as any).statusCode,
            });
            return { path, url: null };
          }
          console.log(`[getSignedImageUrls] Got signed URL for ${path}`);
          return { path, url: data?.signedUrl ?? null };
        } catch (err) {
          console.error(`[getSignedImageUrls] Exception for path "${path}":`, {
            message: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
          });
          return { path, url: null };
        }
      })
    );
    console.log(`[getSignedImageUrls] Returning ${urls.filter(u => u.url).length} successful URLs`);
    return { urls };
  });
}
