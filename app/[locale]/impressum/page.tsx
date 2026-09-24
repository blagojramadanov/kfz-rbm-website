import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/legal-page";
import { COMPANY } from "@/lib/company";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "legalPages.impressum" });
  return {
    title: `${t("title")} – ${COMPANY.name}`,
    description: t("metaDescription", { name: COMPANY.name }),
  };
}

// Deliberately lists no natural person (no owner / managing director): the
// demo data in lib/company.ts is fictional.
export default async function ImpressumPage() {
  const t = await getTranslations("legalPages.impressum");

  return (
    <LegalPage
      title={t("title")}
      intro={t("intro")}
      sections={[
        {
          id: "provider",
          title: t("sections.provider.title"),
          body: [
            COMPANY.fullName,
            COMPANY.address.street,
            `${COMPANY.address.zip} ${COMPANY.address.city}`,
            COMPANY.address.country,
          ],
        },
        {
          id: "contact",
          title: t("sections.contact.title"),
          body: [
            t("sections.contact.phone", { phone: COMPANY.phone }),
            t("sections.contact.email", { email: COMPANY.email }),
          ],
        },
        {
          id: "register",
          title: t("sections.register.title"),
          body: [
            t("sections.register.registerNumber", { number: COMPANY.legal.registerNumber }),
            t("sections.register.vatId", { vatId: COMPANY.legal.ustIdNr }),
          ],
        },
        {
          id: "responsible",
          title: t("sections.responsible.title"),
          body: [t("sections.responsible.body", { company: COMPANY.fullName })],
        },
      ]}
    />
  );
}
