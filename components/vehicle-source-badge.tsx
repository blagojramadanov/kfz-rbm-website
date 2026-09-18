"use client";

import { Badge } from "@/components/ui/badge";

interface VehicleSourceBadgeProps {
  sourceType: string;
  className?: string;
}

export function VehicleSourceBadge({ sourceType, className = "" }: VehicleSourceBadgeProps) {
  if (sourceType === "rbm") {
    return (
      <Badge className={`bg-blue-100 text-blue-800 hover:bg-blue-100 ${className}`}>
        RBM Fahrzeug
      </Badge>
    );
  }

  if (sourceType === "customer") {
    return (
      <Badge className={`bg-green-100 text-green-800 hover:bg-green-100 ${className}`}>
        Kundenfahrzeug
      </Badge>
    );
  }

  return (
    <Badge className={`bg-gray-100 text-gray-800 hover:bg-gray-100 ${className}`}>
      Unbekannt
    </Badge>
  );
}
