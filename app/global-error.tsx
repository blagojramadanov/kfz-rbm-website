"use client";

import { useEffect } from "react";
import "@/app/globals.css";
import { ErrorContent, type ErrorTexts } from "@/components/error-content";
import de from "@/messages/de.json";
import en from "@/messages/en.json";
import mk from "@/messages/mk.json";

// Errors in the root/locale layout replace the whole document, outside the next-intl
// provider. Only `pages.error` is read from the message files (webpack drops the
// unused JSON properties from this bundle); the locale comes from the URL.
const TEXTS: Record<string, ErrorTexts> = {
  de: de.pages.error,
  en: en.pages.error,
  mk: mk.pages.error,
};

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const segment = typeof window === "undefined" ? "" : window.location.pathname.split("/")[1];
  const locale = segment in TEXTS ? segment : "de";

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="font-sans">
        <ErrorContent texts={TEXTS[locale]} homeHref={`/${locale}`} onRetry={reset} />
      </body>
    </html>
  );
}
