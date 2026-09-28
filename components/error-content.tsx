"use client";

import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ErrorTexts = {
  title: string;
  description: string;
  retry: string;
  backHome: string;
};

/**
 * Styled error screen, same card as the 404 (components/not-found-content.tsx).
 * Takes its texts as props because app/global-error.tsx renders outside the
 * next-intl provider. "Home" is a plain link: a full reload is what we want
 * after an error.
 */
export function ErrorContent({
  texts,
  homeHref,
  onRetry,
}: {
  texts: ErrorTexts;
  homeHref: string;
  onRetry: () => void;
}) {
  return (
    <div className="bg-muted min-h-screen flex items-center justify-center px-4 py-16">
      <div className="card max-w-xl w-full p-8 sm:p-12 text-center">
        <div className="mx-auto mb-6 inline-flex w-16 h-16 items-center justify-center rounded-full bg-info-subtle text-primary">
          <AlertTriangle className="w-8 h-8" aria-hidden="true" />
        </div>
        <h1 className="page-title text-foreground mb-3">{texts.title}</h1>
        <p className="text-muted-foreground mb-8">{texts.description}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" onClick={onRetry}>
            <RotateCcw className="mr-2 w-5 h-5" aria-hidden="true" />
            {texts.retry}
          </Button>
          <Button asChild size="lg" variant="outline-primary">
            <a href={homeHref}>
              <Home className="mr-2 w-5 h-5" aria-hidden="true" />
              {texts.backHome}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
