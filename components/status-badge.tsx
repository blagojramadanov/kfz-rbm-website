import { Badge } from "@/components/ui/badge";
import { getStatusIcon, getStatusTone, type StatusKind } from "@/lib/status-styles";
import { cn } from "@/lib/utils";

/** Status pill with the shared color mapping. Pass the already translated label. */
export function StatusBadge({
  kind,
  status,
  children,
  className,
  withIcon = false,
}: {
  kind: StatusKind;
  status: string | null | undefined;
  children: React.ReactNode;
  className?: string;
  /** Show the shared status icon (submission statuses only). */
  withIcon?: boolean;
}) {
  const Icon = withIcon ? getStatusIcon(kind, status) : null;
  return (
    <Badge variant={getStatusTone(kind, status)} className={cn("shrink-0", className)}>
      {Icon && <Icon className="w-3.5 h-3.5" aria-hidden="true" />}
      {children}
    </Badge>
  );
}
