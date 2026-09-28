import type { LucideIcon } from "lucide-react";
import { CONCEPT_ICONS } from "@/lib/concept-icons";

/**
 * The services RBM offers, in display order. Texts live in `pages.services.items.<id>`
 * (title, text, short, cta); used by the Dienstleistungen and Über uns pages.
 */
export const SERVICES: { id: string; icon: LucideIcon; href: string }[] = [
  { id: "directSale", icon: CONCEPT_ICONS.directSale, href: "/dashboard/fahrzeug-anbieten" },
  { id: "consignment", icon: CONCEPT_ICONS.consignment, href: "/dashboard/fahrzeug-anbieten" },
  { id: "tradeIn", icon: CONCEPT_ICONS.tradeIn, href: "/dashboard/inzahlungnahme" },
  { id: "export", icon: CONCEPT_ICONS.export, href: "/fahrzeuge/export" },
  { id: "purchase", icon: CONCEPT_ICONS.purchase, href: "/fahrzeuge" },
];
