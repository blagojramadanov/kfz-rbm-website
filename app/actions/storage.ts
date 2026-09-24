"use server";

import { z } from "zod";
import { getSupabaseUser } from "@/lib/supabase-server";

export async function getSignedImageUrls(paths: unknown) {
  const { supabase } = await getSupabaseUser();
  // Which paths may be signed is decided by the storage RLS policy (own folder or admin).
  const storagePaths = z.array(z.string().max(300)).max(100).parse(paths);

  const signedUrls = await Promise.all(
    storagePaths.map(async (path) => {
      const { data } = await supabase.storage
        .from("customer-submitted-photos")
        .createSignedUrl(path, 3600); // 1 hour expiry
      return { path, url: data?.signedUrl };
    })
  );

  return signedUrls;
}
