import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal-page";
import { COMPANY } from "@/lib/company";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "legalPages.terms" });
  return {
    title: `${t("title")} – ${COMPANY.name}`,
    description: t("metaDescription", { name: COMPANY.name }),
  };
}

export default async function TermsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("legalPages.terms");
  const company = COMPANY.fullName;

  return (
    <LegalPage
      title={t("title")}
      intro={t("intro")}
      demoNotice
      sections={[
        { id: "scope", title: t("sections.scope.title"), blocks: [t("sections.scope.body", { company })] },
        { id: "offers", title: t("sections.offers.title"), blocks: [t("sections.offers.body")] },
        { id: "contract", title: t("sections.contract.title"), blocks: [t("sections.contract.body", { company })] },
        { id: "warranty", title: t("sections.warranty.title"), blocks: [t("sections.warranty.body")] },
        { id: "law", title: t("sections.law.title"), blocks: [t("sections.law.body")] },
      ]}
    />
  );
}
