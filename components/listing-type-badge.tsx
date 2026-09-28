import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

/** Sale/export badge. Works in server and client components. */
export function ListingTypeBadge({ type = "verkauf" }: { type?: "verkauf" | "export" }) {
  const t = useTranslations("common.listingTypes");

  if (type === "export") {
    return (
      <Badge variant="info" className="text-sm">
        <span aria-hidden="true">🌍</span>
        {t("export")}
      </Badge>
    );
  }

  return (
    <Badge variant="success" className="text-sm">
      <span aria-hidden="true">🏪</span>
      {t("verkauf")}
    </Badge>
  );
}
