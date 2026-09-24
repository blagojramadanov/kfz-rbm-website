import { getSupabaseUser } from "@/lib/supabase-server";

/**
 * Server-side auth guards for server actions.
 *
 * Every server action is a public POST endpoint: anyone can call it directly,
 * whatever the UI shows. So each action must call one of these first and use the
 * returned session user - never a user id (or role) sent by the client.
 *
 * Error messages are stable codes (UNAUTHORIZED / FORBIDDEN) so the UI can map
 * them to translated text later (see I18N_PROGRESS.md, area 8).
 */

/** The logged-in user with a session-bound (RLS) client. Throws UNAUTHORIZED when there is no valid session. */
export async function requireUser() {
  try {
    return await getSupabaseUser();
  } catch {
    throw new Error("UNAUTHORIZED");
  }
}

/** Like requireUser(), and additionally checks `user_profiles.role = 'ADMIN'` in the database. Throws FORBIDDEN otherwise. */
export async function requireAdmin() {
  const { supabase, user } = await requireUser();

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }

  return { supabase, user };
}
