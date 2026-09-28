"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";
import { ArrowRight } from "lucide-react";
import { CONCEPT_ICONS } from "@/lib/concept-icons";
import { SITE_IMAGES, type SiteImageKey } from "@/lib/site-images";

interface Service {
  id: string;
  icon: React.ReactNode;
  /** Site photo (lib/site-images); its alt text is siteImages.<key>. */
  image: SiteImageKey;
  color: string;
  href: string;
}

const SERVICES: Service[] = [
  {
    id: "buy",
    href: "/fahrzeuge",
    icon: <CONCEPT_ICONS.purchase className="w-8 h-8" aria-hidden="true" />,
    image: "services",
    color: "from-info-subtle/50 to-info-subtle",
  },
  {
    id: "sell",
    href: "/dashboard/fahrzeug-anbieten",
    icon: <CONCEPT_ICONS.directSale className="w-8 h-8" aria-hidden="true" />,
    image: "sellCar",
    color: "from-success-subtle/50 to-success-subtle",
  },
  {
    id: "consignment",
    href: "/dashboard/fahrzeug-anbieten",
    icon: <CONCEPT_ICONS.consignment className="w-8 h-8" aria-hidden="true" />,
    image: "contact",
    color: "from-warning-subtle/50 to-warning-subtle",
  },
  {
    id: "trade-in",
    href: "/dashboard/inzahlungnahme",
    icon: <CONCEPT_ICONS.tradeIn className="w-8 h-8" aria-hidden="true" />,
    image: "hero",
    color: "from-highlight-subtle/50 to-highlight-subtle",
  },
  {
    id: "export",
    href: "/fahrzeuge/export",
    icon: <CONCEPT_ICONS.export className="w-8 h-8" aria-hidden="true" />,
    image: "export",
    color: "from-muted to-secondary",
  },
];

export function ServicesGrid() {
  const t = useTranslations("pages.home");
  const tImg = useTranslations("siteImages");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {SERVICES.map((service) => (
        <div
          key={service.id}
          className="group card hover:shadow-xl transition-all overflow-hidden"
        >
          <div className="grid grid-cols-1 sm:grid-cols-5 h-full">
            {/* Image - Hidden on mobile, shown on larger screens */}
            <div className="hidden sm:block sm:col-span-2 relative overflow-hidden bg-border">
              <Image
                src={SITE_IMAGES[service.image]}
                alt={tImg(service.image)}
                fill
                sizes="(max-width: 768px) 40vw, 20vw"
                placeholder="blur"
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>

            {/* Content */}
            <div className={`sm:col-span-3 bg-gradient-to-br ${service.color} p-8 flex flex-col justify-between`}>
              {/* Icon & Title */}
              <div>
                <div className="inline-block p-3 bg-primary text-primary-foreground rounded-lg mb-4 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="section-title mb-3">
                  {t(`services.${service.id}.title`)}
                </h3>
                <p className="text-foreground mb-6">
                  {t(`services.${service.id}.description`)}
                </p>
              </div>

              {/* CTA */}
              <Button asChild className="w-full">
                <Link href={service.href}>
                  {t(`services.${service.id}.cta`)}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
