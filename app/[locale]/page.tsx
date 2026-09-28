import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { FeaturedVehicles } from "@/components/featured-vehicles";
import { SearchBar } from "@/components/search-bar";
import { LatestVehicles } from "@/components/latest-vehicles";
import { ServicesGrid } from "@/components/services-grid";
import { SITE_IMAGES } from "@/lib/site-images";
import { ArrowRight, CheckCircle, Users, Award, Shield, Zap } from "lucide-react";
import { COMPANY, PHONE_HREF } from "@/lib/company";
import { Link } from "@/lib/navigation";
import { getFeaturedVehicles, getLatestVehicles, getPublicFilterOptions } from "@/lib/public-vehicles";

// ISR: the latest/featured lists are read with the cookie-less anon client
// (lib/public-vehicles.ts) and the page is regenerated at most once a minute.
// Must be a literal for Next to read it; keep in sync with REVALIDATE_SECONDS in that file.
export const revalidate = 60;

export default async function Home({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("pages.home");
  const tImg = await getTranslations("siteImages");
  const [latestVehicles, featuredVehicles, searchOptions] = await Promise.all([
    getLatestVehicles(4),
    getFeaturedVehicles(6),
    // The search opens /fahrzeuge (sale listings), so it offers their brands/models.
    getPublicFilterOptions("verkauf"),
  ]);
  return (
    <div className="w-full">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[calc(100svh-5rem)] py-12 sm:py-20 bg-gradient-to-br from-kfz-blue via-kfz-blue-light to-kfz-blue-dark text-primary-foreground overflow-hidden flex items-center">
        {/* Background photo under a navy overlay (text stays above AA contrast) */}
        <Image
          src={SITE_IMAGES.hero}
          alt={tImg("hero")}
          fill
          sizes="100vw"
          placeholder="blur"
          className="object-cover"
          priority
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-kfz-blue-dark/90 via-kfz-blue-dark/80 via-60% to-kfz-blue-dark/50"
          aria-hidden="true"
        />

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-96 h-96 rounded-full border-2 border-primary-foreground"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full border-2 border-primary-foreground"></div>
        </div>

        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Logo */}
            <div className="mb-8 sm:mb-12 flex items-center gap-4">
              <div className="relative w-16 h-16 bg-card rounded-lg p-2">
                <Image
                  src="/assets/logo.png"
                  alt={t("hero.logoAlt", { name: COMPANY.name })}
                  width={64}
                  height={64}
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold">{COMPANY.name}</h1>
                <p className="text-primary-foreground/80">{t("hero.tagline")}</p>
              </div>
            </div>

            {/* Main Headline */}
            <div className="mb-8">
              <h2 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                {t("hero.headline1")}<br />
                {t("hero.headline2")}<br />
                {t("hero.headline3")}
              </h2>
              <p className="text-lg sm:text-2xl text-primary-foreground/80 max-w-3xl">
                {t("hero.subheadline")}
              </p>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 sm:mb-12">
              <Button variant="accent"
                asChild
                size="lg"
                className="h-auto min-h-12 whitespace-normal text-center px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg shadow-lg hover:shadow-xl"
              >
                <Link href="/fahrzeuge">
                  {t("hero.discoverVehicles")}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline-inverse"
                className="h-auto min-h-12 whitespace-normal text-center px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg"
              >
                <Link href="/dashboard/fahrzeug-anbieten">
                  {t("hero.offerVehicle")}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hidden sm:block absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary-foreground rounded-full flex items-center justify-center">
            <div className="w-1 h-2 bg-card rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-secondary relative -mt-20 z-20">
        <div className="max-w-6xl mx-auto">
          <SearchBar filterOptions={searchOptions} />
        </div>
      </section>

      {/* Latest Vehicles Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="display-section">
                {t("latest.title")}
              </h2>
              <Button
                asChild
                variant="ghost"
                className="text-kfz-accent hover:text-primary"
              >
                <Link href="/fahrzeuge">
                  {t("latest.viewAll")} <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
            <p className="text-lg text-muted-foreground">
              {t("latest.description")}
            </p>
          </div>

          <LatestVehicles vehicles={latestVehicles} />
        </div>
      </section>

      {/* Featured Vehicles Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="display-section mb-4">
              {t("featured.title")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("featured.description")}
            </p>
          </div>

          <FeaturedVehicles vehicles={featuredVehicles} />

          <div className="text-center mt-12">
            <Button
              asChild
              variant="outline-primary"
              size="lg"
              className="h-auto min-h-12 whitespace-normal text-center px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg"
            >
              <Link href="/fahrzeuge">
                {t("featured.viewAll")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="display-section mb-4">
              {t("services.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("services.description")}
            </p>
          </div>

          <ServicesGrid />
        </div>
      </section>

      {/* Trust & Quality Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="display-section mb-4">
              {t("trustSection.title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("trustSection.description")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Quality Guarantee */}
            <div className="bg-card p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-br from-kfz-blue to-kfz-blue-light text-primary-foreground w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="section-title mb-3">
                {t("qualityGuarantee.title")}
              </h3>
              <p className="text-foreground mb-4">
                {t("qualityGuarantee.description")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-foreground">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  {t("qualityGuarantee.item1")}
                </li>
                <li className="flex items-center text-foreground">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  {t("qualityGuarantee.item2")}
                </li>
                <li className="flex items-center text-foreground">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  {t("qualityGuarantee.item3")}
                </li>
              </ul>
            </div>

            {/* Expert Team */}
            <div className="bg-card p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-br from-kfz-blue to-kfz-blue-light text-primary-foreground w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="section-title mb-3">
                {t("expertTeam.title")}
              </h3>
              <p className="text-foreground mb-4">
                {t("expertTeam.description")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-foreground">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  {t("expertTeam.item1")}
                </li>
                <li className="flex items-center text-foreground">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  {t("expertTeam.item2")}
                </li>
                <li className="flex items-center text-foreground">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  {t("expertTeam.item3")}
                </li>
              </ul>
            </div>

            {/* Transparent Pricing */}
            <div className="bg-card p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-br from-kfz-blue to-kfz-blue-light text-primary-foreground w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="section-title mb-3">
                {t("transparentPricing.title")}
              </h3>
              <p className="text-foreground mb-4">
                {t("transparentPricing.description")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-foreground">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  {t("transparentPricing.item1")}
                </li>
                <li className="flex items-center text-foreground">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  {t("transparentPricing.item2")}
                </li>
                <li className="flex items-center text-foreground">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  {t("transparentPricing.item3")}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Image */}
            <div className="relative h-96 rounded-lg overflow-hidden shadow-lg">
              <Image
                src={SITE_IMAGES.about}
                alt={tImg("about")}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                placeholder="blur"
                className="object-cover"
              />
            </div>

            {/* Right: Content */}
            <div>
              <h2 className="display-section mb-6">
                {t("aboutSection.title")}
              </h2>
              <p className="text-lg text-muted-foreground mb-4">
                {t("aboutSection.paragraph1")}
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                {t("aboutSection.paragraph2")}
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-kfz-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground">{t("aboutSection.quickProcess")}</h3>
                    <p className="text-muted-foreground">{t("aboutSection.quickProcessDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-kfz-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground">{t("aboutSection.fairPrices")}</h3>
                    <p className="text-muted-foreground">{t("aboutSection.fairPricesDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-kfz-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground">{t("aboutSection.completeSolution")}</h3>
                    <p className="text-muted-foreground">{t("aboutSection.completeSolutionDesc")}</p>
                  </div>
                </div>
              </div>

              <Button
                asChild
                size="lg"
                className="h-auto min-h-12 whitespace-normal text-center px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg"
              >
                <Link href="/about">
                  {t("aboutSection.learnMore")}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-kfz-blue to-kfz-blue-dark text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="display-section mb-4">
            {t("contact.title")}
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            {t("contact.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="accent"
              asChild
              size="lg"
              className="h-auto min-h-12 whitespace-normal text-center px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg"
            >
              <Link href="/contact">
                {t("contact.contactCta")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline-inverse"
              className="h-auto min-h-12 whitespace-normal text-center px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg"
            >
              <a href={PHONE_HREF}>
                {t("contact.callCta", { phone: COMPANY.phone })}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
