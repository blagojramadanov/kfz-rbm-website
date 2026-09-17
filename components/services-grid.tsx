"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Car, TrendingUp, Truck, Globe, Handshake } from "lucide-react";

interface Service {
  id: string;
  titleDe: string;
  descriptionDe: string;
  icon: React.ReactNode;
  image: string;
  color: string;
  ctaText: string;
}

const SERVICES: Service[] = [
  {
    id: "buy",
    titleDe: "Gebrauchtwagen kaufen",
    descriptionDe:
      "Breite Auswahl an geprüften Premium-Fahrzeugen mit Garantie und voller Transparenz. Einfache und sichere Abwicklung.",
    icon: <Car className="w-8 h-8" />,
    image: "https://picsum.photos/seed/kfzrbm-10/500/400",
    color: "from-blue-50 to-blue-100",
    ctaText: "Fahrzeuge erkunden",
  },
  {
    id: "sell",
    titleDe: "Auto verkaufen",
    descriptionDe:
      "Verkaufen Sie Ihr Fahrzeug schnell und zu fairen Preisen. Kostenlose Bewertung und schnelle Abwicklung ohne Umstände.",
    icon: <TrendingUp className="w-8 h-8" />,
    image: "https://picsum.photos/seed/kfzrbm-11/500/400",
    color: "from-green-50 to-green-100",
    ctaText: "Auto bewerten",
  },
  {
    id: "consignment",
    titleDe: "Verkauf im Kundenauftrag",
    descriptionDe:
      "Verkaufen Sie Ihr Fahrzeug in unserem Namen auf Provisionsbasis. Wir kümmern uns um Marketing, Besichtigungen und Verkaufsabwicklung.",
    icon: <Handshake className="w-8 h-8" />,
    image: "https://picsum.photos/seed/kfzrbm-12/500/400",
    color: "from-orange-50 to-orange-100",
    ctaText: "Angebot anfragen",
  },
  {
    id: "trade-in",
    titleDe: "Inzahlungnahme",
    descriptionDe:
      "Tauschen Sie Ihr altes Fahrzeug beim Kauf eines neuen ein. Wir kümmern uns um den gesamten Prozess.",
    icon: <Truck className="w-8 h-8" />,
    image: "https://picsum.photos/seed/kfzrbm-13/500/400",
    color: "from-purple-50 to-purple-100",
    ctaText: "Mehr erfahren",
  },
  {
    id: "export",
    titleDe: "Export",
    descriptionDe:
      "Internationale Fahrzeugexporte mit vollständiger Dokumentation und Logistikunterstützung weltweit.",
    icon: <Globe className="w-8 h-8" />,
    image: "https://picsum.photos/seed/kfzrbm-14/500/400",
    color: "from-yellow-50 to-yellow-100",
    ctaText: "Export anfragen",
  },
];

export function ServicesGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {SERVICES.map((service) => (
        <div
          key={service.id}
          className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden"
        >
          <div className="grid grid-cols-1 sm:grid-cols-5 h-full">
            {/* Image - Hidden on mobile, shown on larger screens */}
            <div className="hidden sm:block sm:col-span-2 relative overflow-hidden bg-gray-200">
              <Image
                src={service.image}
                alt={service.titleDe}
                fill
                sizes="(max-width: 768px) 100%, 40vw"
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>

            {/* Content */}
            <div className={`sm:col-span-3 bg-gradient-to-br ${service.color} p-8 flex flex-col justify-between`}>
              {/* Icon & Title */}
              <div>
                <div className="inline-block p-3 bg-kfz-blue text-white rounded-lg mb-4 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {service.titleDe}
                </h3>
                <p className="text-gray-700 mb-6">
                  {service.descriptionDe}
                </p>
              </div>

              {/* CTA */}
              <Button className="w-full bg-kfz-blue hover:bg-kfz-blue-dark text-white font-semibold">
                {service.ctaText}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
