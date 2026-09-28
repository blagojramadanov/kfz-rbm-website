import { getSalesTypeIcon } from "@/lib/concept-icons";
import { cn } from "@/lib/utils";

/** Sales type with its shared icon. Pass the translated label (getSalesTypeLabel). */
export function SalesTypeLabel({
  salesType,
  children,
  className,
}: {
  salesType: string | null | undefined;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = getSalesTypeIcon(salesType);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}
