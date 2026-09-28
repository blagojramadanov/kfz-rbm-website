"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ErrorContent } from "@/components/error-content";

// Runtime errors inside a page: rendered within the [locale] layout (header, footer,
// language switcher). Errors in the layout itself go to app/global-error.tsx.
export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("pages.error");
  const locale = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorContent
      texts={{ title: t("title"), description: t("description"), retry: t("retry"), backHome: t("backHome") }}
      homeHref={`/${locale}`}
      onRetry={reset}
    />
  );
}
