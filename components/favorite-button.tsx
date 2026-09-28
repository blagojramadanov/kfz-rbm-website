"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFavorites } from "@/lib/favorites-context";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  vehicleId: string;
  /** "icon": round heart on a card image; "button": labelled "Merken"/"Gemerkt" button. */
  variant?: "icon" | "button";
  size?: "sm" | "md";
  className?: string;
}

/** Heart toggle for a public vehicle. Works inside a card <Link> (stops the navigation). */
export function FavoriteButton({ vehicleId, variant = "icon", size = "sm", className }: FavoriteButtonProps) {
  const t = useTranslations("favorites");
  const { isSaved, isPending, toggle } = useFavorites();
  const saved = isSaved(vehicleId);
  const pending = isPending(vehicleId);

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    void toggle(vehicleId);
  };

  const heart = (
    <Heart
      aria-hidden="true"
      className={cn(
        variant === "icon" && size === "md" ? "w-6 h-6" : "w-5 h-5",
        "text-destructive transition-colors",
        saved && "fill-destructive",
      )}
    />
  );

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        disabled={pending}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border h-10 px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60",
          saved
            ? "border-destructive-border bg-destructive-subtle/50 text-destructive hover:bg-destructive-subtle"
            : "border-input bg-card text-foreground hover:bg-secondary",
          className,
        )}
      >
        {heart}
        {saved ? t("saved") : t("save")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? t("remove") : t("add")}
      title={saved ? t("remove") : t("add")}
      disabled={pending}
      className={cn(
        "bg-card rounded-full p-2 shadow hover:bg-secondary transition-colors disabled:opacity-60",
        className,
      )}
    >
      {heart}
    </button>
  );
}
