import { useTranslations } from "next-intl";

/** Sale/export badge. Works in server and client components. */
export function ListingTypeBadge({ type = "verkauf" }: { type?: "verkauf" | "export" }) {
  const t = useTranslations("common.listingTypes");

  if (type === "export") {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
        <span aria-hidden="true">🌍</span>
        {t("export")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
      <span aria-hidden="true">🏪</span>
      {t("verkauf")}
    </span>
  );
}
