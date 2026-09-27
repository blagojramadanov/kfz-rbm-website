"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { usePathname, useRouter } from "@/lib/navigation";
import { useToast } from "@/components/ui/toast";

/**
 * The logged-in user's saved vehicle ids, shared by every heart button, the
 * navbar badge and the dashboard. Loaded client-side after login, so the public
 * pages stay static (ISR). Toggling is optimistic: the heart flips at once and is
 * set back (with an error toast) when the server action fails.
 */

interface FavoritesContextValue {
  /** false until the ids of a logged-in user are loaded (always true for guests). */
  ready: boolean;
  count: number;
  isSaved: (vehicleId: string) => boolean;
  isPending: (vehicleId: string) => boolean;
  /** Guests are sent to the login page and come back to the current URL. */
  toggle: (vehicleId: string) => Promise<void>;
  /** Removes without the optimistic "saved" state (dashboard). Returns false on failure. */
  remove: (vehicleId: string) => Promise<boolean>;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

/** Login URL that returns to the current page (path without locale + query). */
export function useLoginRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(() => {
    const next = `${pathname}${typeof window !== "undefined" ? window.location.search : ""}`;
    router.push(`/login?next=${encodeURIComponent(next)}`);
  }, [pathname, router]);
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("favorites");
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const redirectToLogin = useLoginRedirect();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const pendingRef = useRef(new Set<string>());

  const userId = user?.id ?? null;

  useEffect(() => {
    if (loading) return;
    setIds(new Set());
    if (!userId) {
      setReady(true);
      return;
    }
    setReady(false);
    let cancelled = false;
    (async () => {
      const { getFavoriteIds } = await import("@/app/actions/favorites");
      const result = await getFavoriteIds();
      if (cancelled) return;
      if (result.ok) setIds(new Set(result.ids));
      setReady(true);
    })().catch((error) => {
      console.error("Failed to load favorites:", error);
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, loading]);

  const setSaved = (vehicleId: string, saved: boolean) =>
    setIds((current) => {
      const next = new Set(current);
      if (saved) next.add(vehicleId);
      else next.delete(vehicleId);
      return next;
    });

  const setPendingFlag = (vehicleId: string, value: boolean) => {
    if (value) pendingRef.current.add(vehicleId);
    else pendingRef.current.delete(vehicleId);
    setPending(new Set(pendingRef.current));
  };

  const toggle = async (vehicleId: string) => {
    if (loading) return;
    if (!userId) {
      redirectToLogin();
      return;
    }
    if (pendingRef.current.has(vehicleId)) return;

    const wasSaved = ids.has(vehicleId);
    setSaved(vehicleId, !wasSaved);
    setPendingFlag(vehicleId, true);
    try {
      const { toggleFavorite } = await import("@/app/actions/favorites");
      const result = await toggleFavorite(vehicleId);
      if (result.ok) {
        setSaved(vehicleId, result.saved);
        showToast(result.saved ? t("addedToast") : t("removedToast"));
        return;
      }
      setSaved(vehicleId, wasSaved);
      if (result.error === "UNAUTHORIZED") {
        redirectToLogin();
        return;
      }
      showToast(result.error === "NOT_FOUND" ? t("notAvailableToast") : t("toggleFailed"), "error");
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      setSaved(vehicleId, wasSaved);
      showToast(t("toggleFailed"), "error");
    } finally {
      setPendingFlag(vehicleId, false);
    }
  };

  const remove = async (vehicleId: string) => {
    if (!userId || pendingRef.current.has(vehicleId)) return false;
    setPendingFlag(vehicleId, true);
    try {
      const { removeFavorite } = await import("@/app/actions/favorites");
      const result = await removeFavorite(vehicleId);
      if (!result.ok) {
        showToast(t("removeFailed"), "error");
        return false;
      }
      setSaved(vehicleId, false);
      showToast(t("removedToast"));
      return true;
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      showToast(t("removeFailed"), "error");
      return false;
    } finally {
      setPendingFlag(vehicleId, false);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        ready,
        count: ids.size,
        isSaved: (vehicleId) => ids.has(vehicleId),
        isPending: (vehicleId) => pending.has(vehicleId),
        toggle,
        remove,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used within a FavoritesProvider");
  return context;
}
