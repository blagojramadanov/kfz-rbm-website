import {
  ArrowLeftRight,
  ClipboardList,
  Globe,
  Handshake,
  Lock,
  Store,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * One icon per business concept, used in customer and admin views alike.
 * Sizes: w-4 h-4 inline with text, w-5 h-5 in headings and cards.
 */
export const CONCEPT_ICONS = {
  /** Direktverkauf an RBM */
  directSale: Handshake,
  /** Verkauf im Kundenauftrag */
  consignment: ClipboardList,
  /** Inzahlungnahme */
  tradeIn: ArrowLeftRight,
  /** Export listings */
  export: Globe,
  /** Regular sale listings */
  sale: Store,
  /** Offered/accepted price */
  offerPrice: Wallet,
  /** Admin-only information */
  internal: Lock,
} satisfies Record<string, LucideIcon>;

// submitted_vehicles.sales_type: current values and older German ones.
const SALES_TYPE_ICONS: Record<string, LucideIcon> = {
  direct: CONCEPT_ICONS.directSale,
  Direktverkauf: CONCEPT_ICONS.directSale,
  "Direktverkauf an KFZ RBM": CONCEPT_ICONS.directSale,
  consignment: CONCEPT_ICONS.consignment,
  "Verkauf im Kundenauftrag": CONCEPT_ICONS.consignment,
  tradeIn: CONCEPT_ICONS.tradeIn,
  Inzahlungnahme: CONCEPT_ICONS.tradeIn,
};

/** Icon for a sales type; null for unknown values (the label is shown without an icon). */
export function getSalesTypeIcon(salesType: string | null | undefined): LucideIcon | null {
  return (salesType && SALES_TYPE_ICONS[salesType.trim()]) || null;
}
