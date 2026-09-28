import { Badge } from "@/components/ui/badge";
import { getStatusTone, type StatusKind } from "@/lib/status-styles";
import { cn } from "@/lib/utils";

/** Status pill with the shared color mapping. Pass the already translated label. */
export function StatusBadge({
  kind,
  status,
  children,
  className,
}: {
  kind: StatusKind;
  status: string | null | undefined;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge variant={getStatusTone(kind, status)} className={cn("shrink-0", className)}>
      {children}
    </Badge>
  );
}
