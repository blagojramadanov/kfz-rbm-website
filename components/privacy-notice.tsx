"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Short privacy notice under a form, linking to the Datenschutz page (no consent
 * checkbox: the data is processed to handle the request / the account). The link
 * opens a new tab so a half-filled form is not lost.
 */
export function PrivacyNotice({
  variant,
  className,
}: {
  variant: "inquiry" | "register" | "submission" | "tradeIn";
  className?: string;
}) {
  const t = useTranslations("privacyNotice");

  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      {t.rich(variant, {
        link: (chunks) => (
          <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:no-underline">
            {chunks}
          </Link>
        ),
      })}
    </p>
  );
}
