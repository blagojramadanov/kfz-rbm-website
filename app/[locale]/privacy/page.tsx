import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/legal-page";
import { COMPANY, getFormattedAddress } from "@/lib/company";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "legalPages.privacy" });
  return {
    title: `${t("title")} – ${COMPANY.name}`,
    description: t("metaDescription", { name: COMPANY.name }),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("legalPages.privacy");

  return (
    <LegalPage
      title={t("title")}
      intro={t("intro")}
      sections={[
        {
          id: "controller",
          title: t("sections.controller.title"),
          body: [
            t("sections.controller.body", {
              company: COMPANY.fullName,
              address: getFormattedAddress(),
              email: COMPANY.email,
            }),
          ],
        },
        { id: "data", title: t("sections.data.title"), body: [t("sections.data.body")] },
        { id: "purposes", title: t("sections.purposes.title"), body: [t("sections.purposes.body")] },
        { id: "cookies", title: t("sections.cookies.title"), body: [t("sections.cookies.body")] },
        {
          id: "rights",
          title: t("sections.rights.title"),
          body: [t("sections.rights.body", { email: COMPANY.email })],
        },
      ]}
    />
  );
}
