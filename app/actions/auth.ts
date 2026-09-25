"use server";

import { z } from "zod";
import { ActionError, runAction } from "@/lib/action-result";
import { requireAdmin, requireUser } from "@/lib/auth-guards";
import { authErrorCode } from "@/lib/auth-errors";

/** Account actions. Every export returns an ActionResult; no human-readable text. */

const profileSchema = z.object({
  full_name: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(40).optional(),
  company_name: z.string().trim().max(100).optional(),
});

export async function updateUserProfile(updates: unknown) {
  return runAction("updateUserProfile", "UPDATE_FAILED", async () => {
    const { supabase, user } = await requireUser();
    // Allow-list: role, email and ids can never be changed here.
    const parsed = profileSchema.safeParse(updates);
    if (!parsed.success) throw new ActionError("INVALID_INPUT");
    const fields = Object.fromEntries(Object.entries(parsed.data).filter(([, value]) => value !== undefined));

    const { error } = await supabase
      .from("user_profiles")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) throw error;
    return {};
  });
}

export async function changePassword(newPassword: string) {
  return runAction("changePassword", "UPDATE_FAILED", async () => {
    const { supabase } = await requireUser();
    if (typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 72) {
      throw new ActionError("WEAK_PASSWORD");
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new ActionError(authErrorCode(error));
    return {};
  });
}

export async function assignUserRole(targetUserId: string, newRole: "CUSTOMER" | "ADMIN") {
  return runAction("assignUserRole", "UPDATE_FAILED", async () => {
    const { supabase } = await requireAdmin();
    const input = z
      .object({ id: z.guid(), role: z.enum(["CUSTOMER", "ADMIN"]) })
      .safeParse({ id: targetUserId, role: newRole });
    if (!input.success) throw new ActionError("INVALID_INPUT");

    // RLS ("Only admins can update role") enforces this as well.
    const { error } = await supabase
      .from("user_profiles")
      .update({ role: input.data.role, updated_at: new Date().toISOString() })
      .eq("id", input.data.id);
    if (error) throw error;
    return {};
  });
}
