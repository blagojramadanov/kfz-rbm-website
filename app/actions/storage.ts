"use server";

import { z } from "zod";
import { ActionError, runAction } from "@/lib/action-result";
import { requireUser } from "@/lib/auth-guards";

/** Signed URLs (1 h) for photos in the private customer bucket. */
export async function getSignedImageUrls(paths: unknown) {
  return runAction("getSignedImageUrls", "LOAD_FAILED", async () => {
    const { supabase } = await requireUser();
    // Which paths may be signed is decided by the storage RLS policy (own folder or admin).
    const parsed = z.array(z.string().max(300)).max(100).safeParse(paths);
    if (!parsed.success) throw new ActionError("INVALID_INPUT");

    const urls = await Promise.all(
      parsed.data.map(async (path) => {
        const { data } = await supabase.storage.from("customer-submitted-photos").createSignedUrl(path, 3600);
        return { path, url: data?.signedUrl ?? null };
      })
    );
    return { urls };
  });
}
