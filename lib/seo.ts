import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { COMPANY } from "@/lib/company";
import { locales, type Locale } from "@/lib/locales";

/**
 * Absolute site origin for canonical URLs, hreflang, Open Graph and the sitemap.
 * NEXT_PUBLIC_SITE_URL wins; on Vercel the production domain is used otherwise
 * (so a custom domain works without a code change).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://kfz-rbm-website.vercel.app")
).replace(/\/+$/, "");

export const DEFAULT_LOCALE: Locale = "de";

/** Hero photo with the RBM logo, 1200x630 (public/images/og-default.jpg). */
export const DEFAULT_OG_IMAGE = { url: "/images/og-default.jpg", width: 1200, height: 630 };

const OG_LOCALES: Record<Locale, string> = { de: "de_DE", en: "en_US", mk: "mk_MK" };

/** Absolute URL of a page. `path` has no locale prefix: "" (home) or "/fahrzeuge". */
export function localizedUrl(locale: string, path: string) {
  return `${SITE_URL}/${locale}${path}`;
}

/** Canonical URL plus hreflang links for de/en/mk and x-default (German). */
export function localeAlternates(locale: string, path: string): Metadata["alternates"] {
  return {
    canonical: localizedUrl(locale, path),
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, localizedUrl(l, path)])),
      "x-default": localizedUrl(DEFAULT_LOCALE, path),
    },
  };
}

/**
 * Metadata for a public page: title, description, canonical, hreflang and Open
 * Graph (default image unless `image` is given). `noindex` pages (auth) get no
 * canonical/hreflang, since they are not meant to show up in search results.
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  image,
  noindex = false,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
}): Metadata {
  return {
    title,
    description,
    ...(noindex
      ? { robots: { index: false, follow: true } }
      : { alternates: localeAlternates(locale, path) }),
    openGraph: {
      type: "website",
      siteName: COMPANY.fullName,
      locale: OG_LOCALES[locale as Locale] ?? OG_LOCALES[DEFAULT_LOCALE],
      url: localizedUrl(locale, path),
      title,
      description,
      images: image ? [image] : [DEFAULT_OG_IMAGE],
    },
    twitter: { card: "summary_large_image" },
  };
}

/**
 * Metadata for a client-component page from `meta.pages.{key}.title/description`
 * (used by the small server layouts of contact and the auth pages).
 */
export async function getPageMetadata(
  locale: string,
  key: "contact" | "login" | "register" | "forgotPassword" | "resetPassword",
  path: string,
  { noindex = false }: { noindex?: boolean } = {},
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta.pages" });
  return pageMetadata({
    locale,
    path,
    title: `${t(`${key}.title`)} – ${COMPANY.name}`,
    description: t(`${key}.description`, { name: COMPANY.name }),
    noindex,
  });
}
