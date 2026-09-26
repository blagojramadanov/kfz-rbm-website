import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { COMPANY } from "@/lib/company";
import AdminShell from "./admin-shell";

export const dynamic = "force-dynamic";

// Server wrapper so the admin area gets a localized <title>; the UI lives in the client shell.
export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("adminTitle", { name: COMPANY.name }),
    robots: { index: false, follow: false },
  };
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
