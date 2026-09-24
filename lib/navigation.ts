import { createNavigation } from "next-intl/navigation";
import { locales } from "@/lib/locales";

// Locale-aware Link/redirect/useRouter. Must match the middleware config
// (locales + localePrefix "always"). Pass hrefs WITHOUT a locale prefix.
export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  localePrefix: "always",
});
