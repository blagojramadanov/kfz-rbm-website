import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FeaturedVehicles } from "@/components/featured-vehicles";
import { SearchBar } from "@/components/search-bar";
import { LatestVehicles } from "@/components/latest-vehicles";
import { ServicesGrid } from "@/components/services-grid";
import { ArrowRight, CheckCircle, Users, Award, Shield, Zap } from "lucide-react";
import { COMPANY } from "@/lib/company";

export default function Home() {
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
            alt="Luxury automotive background"
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
                  alt={`${COMPANY.name} Logo`}
                  width={64}
                  height={64}
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-4xl font-bold">{COMPANY.name}</h1>
                <p className="text-blue-100">{COMPANY.tagline}</p>
              </div>
            </div>

            {/* Main Headline */}
            <div className="mb-8">
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Gebrauchtwagen kaufen.<br />
                Verkaufen.<br />
                Inzahlungnahme. Export.
              </h2>
              <p className="text-xl sm:text-2xl text-blue-100 max-w-3xl">
                Deutschlands führender Autohändler für Premium-Gebrauchtwagen mit 20+ Jahren Erfahrung
              </p>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button
                size="lg"
                className="bg-kfz-accent hover:bg-kfz-accent-light text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg transition-all hover:shadow-xl"
              >
                Fahrzeuge entdecken
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-kfz-blue px-8 py-6 text-lg font-semibold rounded-lg"
              >
                Mein Auto anbieten
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
                Neu hinzugefügte Fahrzeuge
              </h2>
              <Button
                variant="ghost"
                className="text-kfz-accent hover:text-kfz-blue"
              >
                Alle anzeigen <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
            <p className="text-lg text-gray-600">
              Die neuesten Premium-Gebrauchtwagen aus unserem Bestand
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
              Ausgewählte Fahrzeuge
            </h2>
            <p className="text-lg text-gray-600">
              Unsere handverlesenen Premium-Gebrauchtwagen
            </p>
          </div>

          <FeaturedVehicles />

          <div className="text-center mt-12">
            <Button
              variant="outline"
              size="lg"
              className="border-kfz-blue text-kfz-blue hover:bg-kfz-blue hover:text-white px-8 py-6 text-lg font-semibold"
            >
              Alle Fahrzeuge ansehen
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
              Unsere Dienstleistungen
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Umfassende Lösungen für den Kauf und Verkauf von Gebrauchtwagen
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
              Why Choose Us?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Mit über 20 Jahren Erfahrung haben wir uns einen Namen für Qualität, Transparenz und Kundenzufriedenheit gemacht.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Quality Guarantee */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-br from-kfz-blue to-kfz-blue-light text-white w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Qualitätsgarantie
              </h3>
              <p className="text-gray-700 mb-4">
                Jedes Fahrzeug wird gründlich inspiziert und zertifiziert. Vollständige Transparenz über die Fahrzeughistorie.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  Vollständige Inspektion
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  Mehrpunkt-Überprüfung
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  Gewährleistung inbegriffen
                </li>
              </ul>
            </div>

            {/* Expert Team */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-br from-kfz-blue to-kfz-blue-light text-white w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Expertenteam
              </h3>
              <p className="text-gray-700 mb-4">
                Unser erfahrenes Team hilft Ihnen, das perfekte Fahrzeug für Ihre Bedürfnisse zu finden.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  20+ Jahre Erfahrung
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  Fachberatungen
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  Persönlicher Service
                </li>
              </ul>
            </div>

            {/* Transparent Pricing */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-br from-kfz-blue to-kfz-blue-light text-white w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Transparente Preise
              </h3>
              <p className="text-gray-700 mb-4">
                Keine versteckten Gebühren. Was Sie sehen, ist das, was Sie zahlen.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  Keine versteckten Kosten
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  Flexible Finanzierung
                </li>
                <li className="flex items-center text-gray-700">
                  <CheckCircle className="w-5 h-5 text-kfz-accent mr-2 flex-shrink-0" />
                  Inzahlungnahme möglich
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
                alt="Premium Showroom"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* Right: Content */}
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                About Our Company
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                Wir sind Ihr vertrauenswürdiger Partner für Premium-Gebrauchtwagen. Wir haben es uns zur Aufgabe gemacht, unseren Kunden die besten Fahrzeuge mit höchster Qualität und Transparenz anzubieten.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Unser erfahrenes Team wählt jedes Fahrzeug sorgfältig aus und inspiziert es gründlich, um sicherzustellen, dass Sie ein Auto erhalten, das Ihren Erwartungen entspricht.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-kfz-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Schnelle Abwicklung</h3>
                    <p className="text-gray-600">Unbürokratische und schnelle Abwicklung aller Formalitäten</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-kfz-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Faire Preise</h3>
                    <p className="text-gray-600">Marktgerechte Preise für Kauf und Verkauf</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-kfz-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Gesamtlösung</h3>
                    <p className="text-gray-600">Alles aus einer Hand - Kauf, Verkauf, Inzahlungnahme</p>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="bg-kfz-blue hover:bg-kfz-blue-dark text-white px-8 py-6 text-lg font-semibold"
              >
                Mehr erfahren
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
            Bereit für Ihr Traumauto?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Kontaktieren Sie uns noch heute für eine Probefahrt oder um über Ihre Anforderungen zu sprechen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-kfz-accent hover:bg-kfz-accent-light text-white px-8 py-6 text-lg font-semibold"
            >
              Kontakt aufnehmen
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-kfz-blue px-8 py-6 text-lg font-semibold"
            >
              Anrufen: +49 123 456789
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
