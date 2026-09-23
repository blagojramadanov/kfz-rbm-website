"use server";

import { getSupabaseUser } from "@/lib/supabase-server";

interface UpdateProfileInput {
  full_name?: string;
  phone?: string;
  company_name?: string;
}

export async function updateUserProfile(updates: UpdateProfileInput) {
  try {
    const { supabase, user } = await getSupabaseUser();

    // Filter out any attempt to update protected fields
    const safeUpdates = {
      full_name: updates.full_name,
      phone: updates.phone,
      company_name: updates.company_name,
      updated_at: new Date().toISOString(),
    };

    // Never allow role to be updated via this function
    const updateData = Object.fromEntries(
      Object.entries(safeUpdates).filter(([_key, value]) => value !== undefined)
    );

    const { error } = await supabase
      .from("user_profiles")
      .update(updateData)
      .eq("id", user.id);

    if (error) {
      if (error.code === "PGRST100") {
        throw new Error("RLS policy violation: Insufficient permissions");
      }
      throw new Error(error.message || "Failed to update profile");
    }

    return { success: true };
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to update profile");
  }
}

export async function changePassword(newPassword: string) {
  try {
    const { supabase } = await getSupabaseUser();

    if (newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message || "Failed to update password");
    }

    return { success: true };
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to change password");
  }
}

export async function assignUserRole(
  targetUserId: string,
  newRole: "CUSTOMER" | "ADMIN"
) {
  try {
    const { supabase, user } = await getSupabaseUser();

    // Verify requester is admin
    const { data: requesterProfile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (requesterProfile?.role !== "ADMIN") {
      throw new Error("Only admins can assign roles");
    }

    // Update role (RLS will also enforce this, defense in depth)
    const { error } = await supabase
      .from("user_profiles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", targetUserId);

    if (error) {
      throw new Error(error.message || "Failed to update user role");
    }

    return { success: true };
  } catch (error) {
    throw error instanceof Error ? error : new Error("Failed to assign user role");
  }
}
