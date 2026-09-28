import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { SiteShell } from "@/components/site-shell";
import { COMPANY } from "@/lib/company";
import { locales } from "@/lib/locales";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/seo";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta" });
  // Defaults for pages without their own metadata; public pages use pageMetadata()
  // (lib/seo.ts) for canonical, hreflang and Open Graph.
  return {
    metadataBase: new URL(SITE_URL),
    title: t("title", { name: COMPANY.name }),
    description: t("description", { name: COMPANY.name }),
    openGraph: { siteName: COMPANY.fullName, images: [DEFAULT_OG_IMAGE] },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Opts the tree into static rendering (no headers() lookup for the locale).
  setRequestLocale(locale);

  let messages: Awaited<ReturnType<typeof getMessages>> = {};
  try {
    messages = await getMessages();
  } catch (error) {
    console.error('Failed to get messages:', error);
    messages = {};
  }

  return (
    <SiteShell locale={locale} messages={messages}>
      {children}
    </SiteShell>
  );
}
