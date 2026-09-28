import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { CONCEPT_ICONS } from "@/lib/concept-icons";

/** Sale/export badge. Works in server and client components. */
export function ListingTypeBadge({ type = "verkauf" }: { type?: "verkauf" | "export" }) {
  const t = useTranslations("common.listingTypes");

  if (type === "export") {
    return (
      <Badge variant="info" className="text-sm">
        <CONCEPT_ICONS.export className="w-4 h-4" aria-hidden="true" />
        {t("export")}
      </Badge>
    );
  }

  return (
    <Badge variant="success" className="text-sm">
      <CONCEPT_ICONS.sale className="w-4 h-4" aria-hidden="true" />
      {t("verkauf")}
    </Badge>
  );
}
