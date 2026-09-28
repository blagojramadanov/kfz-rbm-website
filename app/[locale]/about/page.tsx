import type { Metadata } from "next";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, BadgeCheck, Globe, Handshake, MapPin, ShieldCheck, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ContactCta } from "@/components/contact-cta";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/navigation";
import { COMPANY } from "@/lib/company";
import { SERVICES } from "@/lib/services";
import { SITE_IMAGES } from "@/lib/site-images";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "pages.about" });
  return pageMetadata({
    locale,
    path: "/about",
    title: `${t("title", { name: COMPANY.name })} – ${COMPANY.name}`,
    description: t("subtitle", { name: COMPANY.name, owner: COMPANY.owner, city: COMPANY.address.city }),
  });
}

// Only facts from lib/company.ts and the services the site really offers:
// no invented numbers, years, reviews, awards or team members.
const VALUES: { id: string; icon: LucideIcon }[] = [
  { id: "transparent", icon: ShieldCheck },
  { id: "personal", icon: Handshake },
  { id: "international", icon: Globe },
  { id: "simple", icon: BadgeCheck },
];

export default function AboutPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = useTranslations("pages.about");
  const tServices = useTranslations("pages.services");
  const tImg = useTranslations("siteImages");
  const values = {
    name: COMPANY.name,
    owner: COMPANY.owner,
    city: COMPANY.address.city,
    district: COMPANY.address.district,
  };

  return (
    <div className="min-h-screen bg-muted">
      <PageHeader
        title={t("title", values)}
        description={t("subtitle", values)}
        image={SITE_IMAGES.about}
        imageAlt={tImg("about")}
      >
        <Button asChild variant="accent" size="lg" className="mt-6">
          <Link href="/contact">
            {t("headerCta")}
            <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
          </Link>
        </Button>
      </PageHeader>

      <div className="page-container space-y-12">
        {/* Who we are */}
        <section className="card overflow-hidden grid lg:grid-cols-2">
          <div className="p-6 sm:p-10 space-y-4">
            <h2 className="section-title">{t("intro.title")}</h2>
            <p className="text-foreground/90 leading-relaxed">{t("intro.p1", values)}</p>
            <p className="text-foreground/90 leading-relaxed">{t("intro.p2", values)}</p>
            <p className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              {t("intro.location", values)}
            </p>
          </div>
          {/* Whole photo at its own proportions (no cropping); never wider than the 763px source */}
          <div className="flex items-center justify-center bg-inverse">
            <Image
              src={SITE_IMAGES.about}
              alt={tImg("about")}
              sizes="(max-width: 1024px) 100vw, 50vw"
              // Served as the original file (no re-compression); the source is only 763px wide
              unoptimized
              placeholder="blur"
              className="w-full max-w-[763px] h-auto"
            />
          </div>
        </section>

        {/* What we offer */}
        <section>
          <h2 className="section-title mb-2">{t("offer.title")}</h2>
          <p className="text-muted-foreground mb-6">{t("offer.text", values)}</p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map(({ id, icon: Icon, href }) => (
              <li key={id}>
                <Link
                  href={href}
                  className="card p-5 flex gap-4 h-full hover:shadow-lg transition-shadow group"
                >
                  <Icon className="w-6 h-6 shrink-0 text-primary mt-0.5" aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-foreground group-hover:text-primary">
                      {tServices(`items.${id}.title`)}
                    </span>
                    <span className="block text-sm text-muted-foreground mt-1">{tServices(`items.${id}.short`)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Why RBM */}
        <section>
          <h2 className="section-title mb-6">{t("values.title", values)}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ id, icon: Icon }) => (
              <div key={id} className="card p-6">
                <div className="inline-flex w-12 h-12 items-center justify-center rounded-lg bg-info-subtle text-primary mb-4">
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="card-title mb-2">{t(`values.${id}.title`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`values.${id}.text`, values)}</p>
              </div>
            ))}
          </div>
        </section>

        <ContactCta
          title={t("contactCta.title")}
          text={t("contactCta.text")}
          contactLabel={t("headerCta")}
          callLabel={tServices("contactCta.call", { phone: COMPANY.phone })}
        />
      </div>
    </div>
  );
}
