import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { VehicleListing } from "@/components/vehicle-listing";
import { COMPANY } from "@/lib/company";
import { getPublicFilterOptions, searchPublicVehicles } from "@/lib/public-vehicles";
import { parseVehicleSearch } from "@/lib/vehicle-search";

// The filters come from the URL (searchParams), so the page renders per request.
// The vehicle queries still go through the cookie-less anon client, whose fetches
// are cached for REVALIDATE_SECONDS (lib/public-vehicles.ts).

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "pages.fahrzeuge" });
  return {
    title: t("metaTitle", { name: COMPANY.name }),
    description: t("metaDescription", { name: COMPANY.name }),
  };
}

export default async function FahrzeugeListingPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  setRequestLocale(locale);
  const t = await getTranslations("pages.fahrzeuge");
  // Invalid or unknown params are ignored (see parseVehicleSearch).
  const filters = parseVehicleSearch(searchParams);
  const [vehicles, filterOptions] = await Promise.all([
    searchPublicVehicles("verkauf", filters),
    getPublicFilterOptions("verkauf"),
  ]);

  return (
    <VehicleListing
      vehicles={vehicles}
      filterOptions={filterOptions}
      variant="sale"
      heading={t("heroTitle")}
      subheading={t("heroSubtitle")}
      emptyTitle={t("emptyTitle")}
      emptyHint={t("emptyHint")}
    />
  );
}
