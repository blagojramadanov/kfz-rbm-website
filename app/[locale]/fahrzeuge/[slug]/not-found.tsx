import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";

export default async function VehicleNotFound() {
  const t = await getTranslations("pages.fahrzeugDetail");

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4">
      <div className="card p-8 sm:p-12 text-center max-w-lg">
        <h1 className="page-title text-foreground mb-3">{t("notFound.title")}</h1>
        <p className="text-muted-foreground mb-6">{t("notFound.text")}</p>
        <Button asChild >
          <Link href="/fahrzeuge">{t("backToOverview")}</Link>
        </Button>
      </div>
    </div>
  );
}
