import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalPage, type LegalBlock, type LegalSection } from "@/components/legal-page";
import { COMPANY, EMAIL_HREF, PHONE_HREF, getAddress } from "@/lib/company";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "legalPages.privacy" });
  return {
    title: `${t("title")} – ${COMPANY.name}`,
    description: t("metaDescription", { name: COMPANY.legalName }),
  };
}

/**
 * Privacy policy. It must match how the site really works; when a service is added
 * or removed (hosting, database, email, analytics, embeds), update this page and
 * `legalPages.privacy` in all three message files.
 *
 * Structure per section: "p" = paragraph, "list" = bullet list with `items` entries
 * (keys p1..pN and item1..itemN in the messages, in the order given here).
 */
type Part = "p" | { list: number } | { link: string; href: string };

const SECTIONS: { id: string; parts: Part[] }[] = [
  { id: "controller", parts: ["p"] }, // + contact block, added below
  { id: "overview", parts: ["p", { list: 3 }, "p"] },
  { id: "hosting", parts: ["p", { list: 5 }, "p", "p", { link: "policy", href: "https://vercel.com/legal/privacy-policy" }] },
  { id: "tls", parts: ["p", "p"] },
  { id: "database", parts: ["p", "p", "p", { link: "policy", href: "https://supabase.com/privacy" }] },
  { id: "email", parts: ["p", "p", { link: "policy", href: "https://resend.com/legal/privacy-policy" }] },
  { id: "account", parts: ["p", { list: 4 }, "p", "p"] },
  { id: "inquiries", parts: ["p", { list: 5 }, "p", "p", "p", { link: "googlePolicy", href: "https://policies.google.com/privacy" }, "p"] },
  { id: "submissions", parts: ["p", { list: 4 }, "p", "p", "p"] },
  { id: "favorites", parts: ["p"] },
  { id: "cookies", parts: ["p", { list: 3 }, "p", "p"] },
  { id: "fonts", parts: ["p"] },
  { id: "social", parts: ["p", "p"] },
  { id: "recipients", parts: ["p", "p"] },
  { id: "retention", parts: ["p", { list: 5 }] },
  { id: "rights", parts: ["p", { list: 7 }, "p", "p"] },
  { id: "complaint", parts: ["p"] }, // + authority block, added below
  { id: "obligation", parts: ["p", "p"] },
];

export default async function PrivacyPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("legalPages.privacy");
  const tCompany = await getTranslations("company");
  const address = getAddress(tCompany);
  const values = { company: COMPANY.legalName, owner: COMPANY.owner, email: COMPANY.email };

  const sections: LegalSection[] = SECTIONS.map(({ id, parts }) => {
    let p = 0;
    let lists = 0;
    const blocks: LegalBlock[] = parts.map((part) => {
      if (part === "p") {
        p += 1;
        return t(`sections.${id}.p${p}`, values);
      }
      if ("list" in part) {
        lists += 1;
        const prefix = lists === 1 ? "item" : `list${lists}Item`;
        return {
          type: "list",
          items: Array.from({ length: part.list }, (_, i) => t(`sections.${id}.${prefix}${i + 1}`, values)),
        };
      }
      return { type: "link", label: t(`sections.${id}.${part.link}`), href: part.href };
    });
    return { id, title: t(`sections.${id}.title`), blocks };
  });

  // Controller: full contact data.
  sections[0].blocks.push(
    {
      type: "lines",
      lines: [
        <strong key="name" className="font-semibold text-foreground">{COMPANY.legalName}</strong>,
        t("sections.controller.owner", { owner: COMPANY.owner }),
        address.street,
        `${address.zip} ${address.city} (${address.district})`,
        address.country,
      ],
    },
    { type: "link", label: t("sections.controller.phone"), href: PHONE_HREF, text: COMPANY.phone },
    { type: "link", label: t("sections.controller.email"), href: EMAIL_HREF, text: COMPANY.email },
  );

  // Supervisory authority for Bavaria.
  const complaint = sections.find((section) => section.id === "complaint")!;
  complaint.blocks.push(
    {
      type: "lines",
      lines: [
        <strong key="name" className="font-semibold text-foreground">{t("sections.complaint.authority")}</strong>,
        "Promenade 18",
        "91522 Ansbach",
        address.country,
      ],
    },
    { type: "link", label: t("sections.complaint.website"), href: "https://www.lda.bayern.de" },
  );

  return (
    <LegalPage
      title={t("title")}
      intro={t("intro", values)}
      sections={sections}
      updated={t("updated")}
      toc
    />
  );
}
