"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, Car, Home, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";

/** Styled 404 for unknown URLs (locale routes and the root not-found). */
export function NotFoundContent() {
  const t = useTranslations("pages.notFound");

  return (
    <div className="bg-muted min-h-screen flex items-center justify-center px-4 py-16">
      <div className="card max-w-xl w-full p-8 sm:p-12 text-center">
        <div className="mx-auto mb-6 inline-flex w-16 h-16 items-center justify-center rounded-full bg-info-subtle text-primary">
          <SearchX className="w-8 h-8" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold tracking-widest text-muted-foreground mb-2">404</p>
        <h1 className="page-title text-foreground mb-3">{t("title")}</h1>
        <p className="text-muted-foreground mb-8">{t("description")}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="mr-2 w-5 h-5" aria-hidden="true" />
              {t("backHome")}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline-primary">
            <Link href="/fahrzeuge">
              <Car className="mr-2 w-5 h-5" aria-hidden="true" />
              {t("vehicles")}
              <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
