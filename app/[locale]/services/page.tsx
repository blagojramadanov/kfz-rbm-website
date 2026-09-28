import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ContactCta } from "@/components/contact-cta";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";
import { COMPANY } from "@/lib/company";
import { SERVICES } from "@/lib/services";
import { SITE_IMAGES } from "@/lib/site-images";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "pages.services" });
  return {
    title: `${t("title")} – ${COMPANY.name}`,
    description: t("subtitle"),
  };
}

export default function ServicesPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = useTranslations("pages.services");
  const tImg = useTranslations("siteImages");

  return (
    <div className="min-h-screen bg-muted">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        image={SITE_IMAGES.services}
        imageAlt={tImg("services")}
      >
        <Button asChild variant="accent" size="lg" className="mt-6">
          <Link href="/fahrzeuge">
            {t("headerCta")}
            <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
          </Link>
        </Button>
      </PageHeader>

      <div className="page-container space-y-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ id, icon: Icon, href }) => (
            <article key={id} className="card p-6 flex flex-col">
              <div className="inline-flex w-12 h-12 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-4">
                <Icon className="w-6 h-6" aria-hidden="true" />
              </div>
              <h2 className="card-title mb-2">{t(`items.${id}.title`)}</h2>
              <p className="text-muted-foreground mb-6 flex-1">{t(`items.${id}.text`)}</p>
              <Button asChild variant="outline-primary" className="self-start whitespace-normal text-left h-auto sm:h-auto min-h-11 sm:min-h-10">
                <Link href={href}>
                  {t(`items.${id}.cta`)}
                  <ArrowRight className="ml-2 w-4 h-4 shrink-0" aria-hidden="true" />
                </Link>
              </Button>
            </article>
          ))}
        </div>

        <ContactCta
          title={t("contactCta.title")}
          text={t("contactCta.text")}
          contactLabel={t("contactCta.button")}
          callLabel={t("contactCta.call", { phone: COMPANY.phone })}
        />
      </div>
    </div>
  );
}
