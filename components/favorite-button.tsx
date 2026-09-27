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
        "text-red-500 transition-colors",
        saved && "fill-red-500",
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
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border h-10 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60",
          saved
            ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            : "border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900",
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
        "bg-white rounded-full p-2 shadow hover:bg-gray-100 transition-colors disabled:opacity-60",
        className,
      )}
    >
      {heart}
    </button>
  );
}
