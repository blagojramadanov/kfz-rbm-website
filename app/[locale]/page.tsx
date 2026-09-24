import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { FeaturedVehicles } from "@/components/featured-vehicles";
import { SearchBar } from "@/components/search-bar";
import { LatestVehicles } from "@/components/latest-vehicles";
import { ServicesGrid } from "@/components/services-grid";
import { ArrowRight, CheckCircle, Users, Award, Shield, Zap } from "lucide-react";
import { COMPANY } from "@/lib/company";

export default async function Home() {
  const t = await getTranslations("pages.home");
  return (
    <div className="w-full">
      {/* Hero Section with Background Image */}
      <section className="relative h-screen bg-gradient-to-br from-kfz-blue via-kfz-blue-light to-kfz-blue-dark text-white overflow-hidden flex items-center">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-10 w-96 h-96 rounded-full border-2 border-white"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full border-2 border-white"></div>
        </div>

        {/* Background automotive image overlay */}
        <div className="absolute inset-0 opacity-20">
          <Image
            src="https://picsum.photos/seed/kfzrbm-hero/1920/1080"
            alt={t("hero.backgroundAlt")}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Logo */}
            <div className="mb-12 flex items-center gap-4">
              <div className="relative w-16 h-16 bg-white rounded-lg p-2">
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
                <p className="text-blue-100">{t("hero.tagline")}</p>
              </div>
            </div>

            {/* Main Headline */}
            <div className="mb-8">
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                {t("hero.headline1")}<br />
                {t("hero.headline2")}<br />
                {t("hero.headline3")}
              </h2>
              <p className="text-xl sm:text-2xl text-blue-100 max-w-3xl">
                {t("hero.subheadline")}
              </p>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button
                size="lg"
                className="bg-kfz-accent hover:bg-kfz-accent-light text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg transition-all hover:shadow-xl"
              >
                {t("hero.discoverVehicles")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-kfz-blue px-8 py-6 text-lg font-semibold rounded-lg"
              >
                {t("hero.offerVehicle")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex items-center justify-center">
            <div className="w-1 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-100 relative -mt-20 z-20">
        <div className="max-w-6xl mx-auto">
          <SearchBar />
        </div>
      </section>

      {/* Latest Vehicles Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-4xl font-bold text-gray-900">
                {t("latest.title")}
              </h2>
              <Button
                variant="ghost"
                className="text-kfz-accent hover:text-kfz-blue"
              >
                {t("latest.viewAll")} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
            <p className="text-lg text-gray-600">
              {t("latest.description")}
            </p>
          </div>

          <LatestVehicles />
        </div>
      </section>

      {/* Featured Vehicles Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t("featured.title")}
            </h2>
            <p className="text-lg text-gray-600">
              {t("featured.description")}
            </p>
          </div>

          <FeaturedVehicles />

          <div className="text-center mt-12">
            <Button
              variant="outline"
              size="lg"
              className="border-kfz-blue text-kfz-blue hover:bg-kfz-blue hover:text-white px-8 py-6 text-lg font-semibold"
            >
              {t("featured.viewAll")}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t("services.title")}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("services.description")}
            </p>
          </div>

          <ServicesGrid />
        </div>
      </section>

      {/* Trust & Quality Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t("trustSection.title")}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("trustSection.description")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Quality Guarantee */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-br from-kfz-blue to-kfz-blue-light text-white w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {t("qualityGuarantee.title")}
              </h3>
              <p className="text-gray-700 mb-4">
                {t("qualityGuarantee.description")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  {t("qualityGuarantee.item1")}
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  {t("qualityGuarantee.item2")}
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  {t("qualityGuarantee.item3")}
                </li>
              </ul>
            </div>

            {/* Expert Team */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-br from-kfz-blue to-kfz-blue-light text-white w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {t("expertTeam.title")}
              </h3>
              <p className="text-gray-700 mb-4">
                {t("expertTeam.description")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  {t("expertTeam.item1")}
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  {t("expertTeam.item2")}
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  {t("expertTeam.item3")}
                </li>
              </ul>
            </div>

            {/* Transparent Pricing */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-br from-kfz-blue to-kfz-blue-light text-white w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {t("transparentPricing.title")}
              </h3>
              <p className="text-gray-700 mb-4">
                {t("transparentPricing.description")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  {t("transparentPricing.item1")}
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  {t("transparentPricing.item2")}
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  {t("transparentPricing.item3")}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Image */}
            <div className="relative h-96 rounded-lg overflow-hidden shadow-lg">
              <Image
                src="https://picsum.photos/seed/kfzrbm-about/600/400"
                alt={t("aboutSection.imageAlt")}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* Right: Content */}
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                {t("aboutSection.title")}
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                {t("aboutSection.paragraph1")}
              </p>
              <p className="text-lg text-gray-600 mb-6">
                {t("aboutSection.paragraph2")}
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-kfz-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t("aboutSection.quickProcess")}</h3>
                    <p className="text-gray-600">{t("aboutSection.quickProcessDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-kfz-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t("aboutSection.fairPrices")}</h3>
                    <p className="text-gray-600">{t("aboutSection.fairPricesDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-kfz-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t("aboutSection.completeSolution")}</h3>
                    <p className="text-gray-600">{t("aboutSection.completeSolutionDesc")}</p>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="bg-kfz-blue hover:bg-kfz-blue-dark text-white px-8 py-6 text-lg font-semibold"
              >
                {t("aboutSection.learnMore")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-kfz-blue to-kfz-blue-dark text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            {t("contact.title")}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {t("contact.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-kfz-accent hover:bg-kfz-accent-light text-white px-8 py-6 text-lg font-semibold"
            >
              {t("contact.contactCta")}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-kfz-blue px-8 py-6 text-lg font-semibold"
            >
              {t("contact.callCta", { phone: COMPANY.phone })}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
