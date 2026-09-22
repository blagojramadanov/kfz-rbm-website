import { useTranslations } from "next-intl";
import { COMPANY } from "@/lib/company";

export default function AboutPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t("pages.about.title")} {COMPANY.name}</h1>
        <p className="text-lg text-gray-600 mb-8">
          {t("pages.about.description")}
        </p>

        {/* TODO: Add company story, team info, achievements */}
        <div className="bg-gray-50 p-8 rounded-lg shadow text-center">
          <p className="text-gray-600">{t("pages.about.comingSoon")}</p>
        </div>
      </div>
    </div>
  );
}
