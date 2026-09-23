"use server";

import { getSupabaseUser } from "@/lib/supabase-server";

export async function getSignedImageUrls(storagePaths: string[]) {
  const { supabase } = await getSupabaseUser();

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
