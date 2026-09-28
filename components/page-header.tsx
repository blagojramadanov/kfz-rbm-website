import Image, { type StaticImageData } from "next/image";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Back link above the title (e.g. to the dashboard). */
  backHref?: string;
  backLabel?: React.ReactNode;
  /** Buttons on the right (stack below the title on mobile). */
  actions?: React.ReactNode;
  /** Extra content inside the header, below the description (e.g. the wizard step indicator). */
  children?: React.ReactNode;
  /** "brand": navy band for public and customer pages. "plain": title inside the admin shell. */
  variant?: "brand" | "plain";
  /** Container width, matching the page body (page-container / page-container-narrow). */
  width?: "wide" | "narrow";
  /** Background photo behind the brand band (lib/site-images), under a navy overlay. */
  image?: StaticImageData;
  /** Translated alt text of the photo (siteImages namespace). */
  imageAlt?: string;
}

/** One page header for public, dashboard and admin pages: same type scale and spacing everywhere. */
export function PageHeader({
  title,
  description,
  backHref,
  backLabel,
  actions,
  children,
  variant = "brand",
  width = "wide",
  image,
  imageAlt,
}: PageHeaderProps) {
  const brand = variant === "brand";

  const content = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className={cn(
              "mb-2 inline-flex items-center gap-1.5 text-sm font-medium",
              brand
                ? "text-primary-foreground/80 hover:text-primary-foreground"
                : "text-primary hover:underline",
            )}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {backLabel}
          </Link>
        )}
        <h1 className={cn("page-title break-words", brand ? "text-primary-foreground" : "text-foreground")}>
          {title}
        </h1>
        {description && (
          <p className={cn("mt-2 max-w-2xl", brand ? "text-primary-foreground/80" : "text-muted-foreground")}>
            {description}
          </p>
        )}
        {children}
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );

  if (!brand) {
    return <div className="mb-8">{content}</div>;
  }

  return (
    <div className="relative isolate overflow-hidden bg-gradient-to-r from-kfz-blue to-kfz-blue-dark text-primary-foreground">
      {image && (
        <>
          <Image
            src={image}
            alt={imageAlt ?? ""}
            fill
            sizes="100vw"
            placeholder="blur"
            className="-z-20 object-cover"
          />
          {/* Navy overlay: text (left 60%, description max-w-2xl) stays above AA on every pixel of the site photos */}
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-r from-kfz-blue-dark/90 via-kfz-blue-dark/80 via-60% to-kfz-blue-dark/50"
            aria-hidden="true"
          />
        </>
      )}
      <div
        className={cn(
          "mx-auto px-4 sm:px-6 lg:px-8",
          image ? "py-10 sm:py-16" : "py-8 sm:py-10",
          width === "narrow" ? "max-w-4xl" : "max-w-7xl",
        )}
      >
        {content}
      </div>
    </div>
  );
}
