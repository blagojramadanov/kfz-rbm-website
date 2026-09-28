import type { MetadataRoute } from "next";
import { locales } from "@/lib/locales";
import { getPublicVehicles } from "@/lib/public-vehicles";
import { DEFAULT_LOCALE, localizedUrl } from "@/lib/seo";

// Public pages and published vehicles in de/en/mk. Dashboard, admin and the auth
// pages are left out on purpose (auth pages are also noindex, see lib/seo.ts).
// Must be a literal; same refresh as the vehicle pages (REVALIDATE_SECONDS).
export const revalidate = 60;

const PUBLIC_PATHS = ["", "/fahrzeuge", "/fahrzeuge/export", "/services", "/about", "/contact", "/impressum", "/privacy"];

function entries(path: string, lastModified?: string): MetadataRoute.Sitemap {
  const languages = {
    ...Object.fromEntries(locales.map((l) => [l, localizedUrl(l, path)])),
    "x-default": localizedUrl(DEFAULT_LOCALE, path),
  };
  return locales.map((locale) => ({
    url: localizedUrl(locale, path),
    ...(lastModified ? { lastModified } : {}),
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Anon client: only vehicles the public RLS policy shows (available, sale or export).
  const vehicles = await getPublicVehicles();
  return [
    ...PUBLIC_PATHS.flatMap((path) => entries(path)),
    ...vehicles.flatMap((v) => entries(`/fahrzeuge/${v.slug}`, v.createdAt)),
  ];
}
