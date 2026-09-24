import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal-page";
import { COMPANY, getAddress, getLegalInfo } from "@/lib/company";

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
export default async function ImpressumPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("legalPages.impressum");
  const tCompany = await getTranslations("company");
  const address = getAddress(tCompany);
  const legal = getLegalInfo(tCompany);

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
            address.street,
            `${address.zip} ${address.city}`,
            address.country,
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
            t("sections.register.registerNumber", { number: legal.registerNumber }),
            t("sections.register.vatId", { vatId: legal.ustIdNr }),
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
