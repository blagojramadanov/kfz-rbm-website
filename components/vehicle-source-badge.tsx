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
      <Badge className={`bg-blue-100 text-blue-800 hover:bg-blue-100 ${className}`}>
        {t("rbm")}
      </Badge>
    );
  }

  if (sourceType === "customer") {
    return (
      <Badge className={`bg-green-100 text-green-800 hover:bg-green-100 ${className}`}>
        {t("customer")}
      </Badge>
    );
  }

  return (
    <Badge className={`bg-gray-100 text-gray-800 hover:bg-gray-100 ${className}`}>
      {t("unknown")}
    </Badge>
  );
}
