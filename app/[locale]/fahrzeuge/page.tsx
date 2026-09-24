import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { VehicleListing } from "@/components/vehicle-listing";
import { COMPANY } from "@/lib/company";
import { getPublicVehicles } from "@/lib/public-vehicles";

// ISR: vehicles come from the cookie-less anon client (lib/public-vehicles.ts).
// Must be a literal for Next to read it; keep in sync with REVALIDATE_SECONDS in that file.
export const revalidate = 60;

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
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("pages.fahrzeuge");
  const vehicles = await getPublicVehicles({ listingType: "verkauf" });

  return (
    <VehicleListing
      vehicles={vehicles}
      variant="sale"
      heading={t("heroTitle")}
      subheading={t("heroSubtitle")}
      emptyTitle={t("emptyTitle")}
      emptyHint={t("emptyHint")}
    />
  );
}
