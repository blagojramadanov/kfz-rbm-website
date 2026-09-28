import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { COMPANY } from "@/lib/company";
import { PageHeader } from "@/components/page-header";
import { SITE_IMAGES } from "@/lib/site-images";

export default function AboutPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-muted">
      <PageHeader
        title={<>{t("pages.about.title")} {COMPANY.name}</>}
        description={t("pages.about.description")}
        image={SITE_IMAGES.about}
        imageAlt={t("siteImages.about")}
      />
      <div className="page-container">
        {/* TODO: Add company story, team info, achievements */}
        <div className="card p-6 sm:p-8 text-center">
          <p className="text-muted-foreground">{t("pages.about.comingSoon")}</p>
        </div>
      </div>
    </div>
  );
}
