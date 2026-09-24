"use client";

import { useLocale, useTranslations } from "next-intl";
import { COMPANY } from "@/lib/company";

type Slot = { open: string; close: string } | null;

// 24h ("09:00") for de/mk, 12h ("9:00 AM") for en.
function formatTime(time: string, locale: string): string {
  if (locale !== "en") return time;
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Opening hours from COMPANY.hours; used by the contact page and the footer. */
export function BusinessHours({ className }: { className?: string }) {
  const t = useTranslations();
  const locale = useLocale();

  const rows: { label: string; slot: Slot }[] = [
    { label: t("hours.monFri"), slot: COMPANY.hours.weekdays },
    { label: t("hours.saturday"), slot: COMPANY.hours.saturday },
    { label: t("hours.sunday"), slot: COMPANY.hours.sunday },
  ];

  return (
    <ul className={className}>
      {rows.map(({ label, slot }) => (
        <li key={label}>
          {label}:{" "}
          {slot
            ? `${formatTime(slot.open, locale)} – ${formatTime(slot.close, locale)}`
            : t("common.closed")}
        </li>
      ))}
    </ul>
  );
}
