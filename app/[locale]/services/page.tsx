import { useTranslations } from "next-intl";

export default function ServicesPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t("pages.services.title")}</h1>
        <p className="text-lg text-gray-600 mb-8">
          {t("pages.services.subtitle")}
        </p>

        {/* TODO: Add service offerings, financing, trade-in info */}
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600">{t("pages.services.comingSoon")}</p>
        </div>
      </div>
    </div>
  );
}
