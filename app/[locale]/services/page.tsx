import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/page-header";

export default function ServicesPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-muted">
      <PageHeader title={t("pages.services.title")} description={t("pages.services.subtitle")} />
      <div className="page-container">
        {/* TODO: Add service offerings, financing, trade-in info */}
        <div className="card p-6 sm:p-8 text-center">
          <p className="text-muted-foreground">{t("pages.services.comingSoon")}</p>
        </div>
      </div>
    </div>
  );
}
