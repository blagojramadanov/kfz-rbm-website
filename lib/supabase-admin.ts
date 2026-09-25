import { createClient } from "@supabase/supabase-js";

// Admin client using secret key for sensitive operations (synced via Supabase-Vercel integration)
export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const secretKey = process.env.SUPABASE_SECRET_KEY!;

  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is not set");
  }

  return createClient(supabaseUrl, secretKey);
}
