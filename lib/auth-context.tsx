"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AuthUser, UserProfile } from "@/lib/supabase";

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Profile doesn't exist, create a default one
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser.user) {
            const newProfile: UserProfile = {
              id: userId,
              email: authUser.user.email || "",
              full_name: authUser.user.user_metadata?.full_name || "",
              role: "CUSTOMER",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            await supabase.from("user_profiles").insert(newProfile);
            setProfile(newProfile);
          }
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // Check auth state on mount and listen for changes
  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || "",
            user_metadata: session.user.user_metadata,
          };
          setUser(authUser);
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email || "",
          user_metadata: session.user.user_metadata,
        };
        setUser(authUser);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user?.email) throw new Error("No user email found");

    // Verify current password by attempting to sign in
    try {
      await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
    } catch {
      throw new Error("Aktuelles Passwort ist ungültig");
    }

    // If verification succeeds, update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in");

    // Import server action dynamically to avoid circular dependency
    const { updateUserProfile } = await import("@/app/actions/auth");

    // Call server action which enforces RLS and prevents role updates
    await updateUserProfile(user.id, updates as any);

    // Update local state only with safe fields (filter out undefined)
    const safeUpdates: Record<string, any> = {};
    if (updates.full_name !== undefined) safeUpdates.full_name = updates.full_name;
    if (updates.phone !== undefined) safeUpdates.phone = updates.phone;
    if (updates.company_name !== undefined) safeUpdates.company_name = updates.company_name;

    setProfile((prev) =>
      prev ? { ...prev, ...safeUpdates, updated_at: new Date().toISOString() } : null
    );
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isAdmin: profile?.role === "ADMIN",
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    changePassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
