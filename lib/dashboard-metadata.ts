import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { COMPANY } from "@/lib/company";

/**
 * <title> for a customer dashboard page: the page's own heading plus the company
 * name, like the legal pages ("Favoriten – RBM"). The dashboard pages are client
 * components, so each route has a small server layout that exports this.
 * `namespace` + `key` point at the message the page already uses as its heading.
 */
export async function getDashboardMetadata(locale: string, namespace: string, key = "title"): Promise<Metadata> {
  // Namespace comes from the layouts below, never from user input.
  const t = (await getTranslations({ locale, namespace: namespace as never })) as unknown as (key: string) => string;
  return {
    title: `${t(key)} – ${COMPANY.name}`,
    robots: { index: false, follow: false },
  };
}
