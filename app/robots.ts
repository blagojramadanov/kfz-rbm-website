import type { MetadataRoute } from "next";
import { locales } from "@/lib/locales";
import { SITE_URL } from "@/lib/seo";

// Dashboard, admin and auth pages are not for search engines (they are also
// noindex in their metadata and missing from the sitemap).
const PRIVATE_PATHS = ["/dashboard", "/admin", "/login", "/register", "/forgot-password", "/reset-password"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", ...locales.flatMap((l) => PRIVATE_PATHS.map((p) => `/${l}${p}`))],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
