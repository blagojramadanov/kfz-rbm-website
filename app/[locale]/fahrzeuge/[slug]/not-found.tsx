import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";

export default async function VehicleNotFound() {
  const t = await getTranslations("pages.fahrzeugDetail");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow p-12 text-center max-w-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{t("notFound.title")}</h1>
        <p className="text-gray-600 mb-6">{t("notFound.text")}</p>
        <Button asChild className="bg-kfz-blue hover:bg-kfz-blue-dark text-white">
          <Link href="/fahrzeuge">{t("backToOverview")}</Link>
        </Button>
      </div>
    </div>
  );
}
