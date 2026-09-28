"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

interface VehicleSourceBadgeProps {
  sourceType: string;
  className?: string;
}

export function VehicleSourceBadge({ sourceType, className = "" }: VehicleSourceBadgeProps) {
  const t = useTranslations("vehicles.source");

  if (sourceType === "rbm") {
    return (
      <Badge variant="info" className={className}>
        {t("rbm")}
      </Badge>
    );
  }

  if (sourceType === "customer") {
    return (
      <Badge variant="success" className={className}>
        {t("customer")}
      </Badge>
    );
  }

  return (
    <Badge variant="neutral" className={className}>
      {t("unknown")}
    </Badge>
  );
}
