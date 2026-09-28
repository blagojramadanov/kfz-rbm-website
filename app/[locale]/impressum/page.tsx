import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal-page";
import { COMPANY, EMAIL_HREF, PHONE_HREF, getAddress } from "@/lib/company";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "legalPages.impressum" });
  return {
    title: `${t("title")} – ${COMPANY.name}`,
    description: t("metaDescription", { name: COMPANY.legalName }),
  };
}

// Impressum per § 5 DDG and § 18 Abs. 2 MStV. USt-IdNr. and Handelsregister are
// omitted on purpose: the owner has not provided them (see lib/company.ts).
export default async function ImpressumPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("legalPages.impressum");
  const tCompany = await getTranslations("company");
  const address = getAddress(tCompany);

  const addressLines = [
    address.street,
    `${address.zip} ${address.city} (${address.district})`,
    address.country,
  ];

  return (
    <LegalPage
      title={t("title")}
      sections={[
        {
          id: "provider",
          title: t("sections.provider.title"),
          blocks: [
            {
              type: "lines",
              lines: [
                <strong key="name" className="font-semibold text-foreground">{COMPANY.legalName}</strong>,
                t("sections.provider.owner", { owner: COMPANY.owner }),
                ...addressLines,
              ],
            },
          ],
        },
        {
          id: "contact",
          title: t("sections.contact.title"),
          blocks: [
            { type: "link", label: t("sections.contact.phone"), href: PHONE_HREF, text: COMPANY.phone },
            { type: "link", label: t("sections.contact.email"), href: EMAIL_HREF, text: COMPANY.email },
          ],
        },
        {
          id: "responsible",
          title: t("sections.responsible.title"),
          blocks: [{ type: "lines", lines: [COMPANY.owner, ...addressLines] }],
        },
        {
          id: "dispute",
          title: t("sections.dispute.title"),
          blocks: [t("sections.dispute.body")],
        },
      ]}
    />
  );
}
