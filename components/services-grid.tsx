"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ArrowRight, Car, TrendingUp, Truck, Globe, Handshake } from "lucide-react";

interface Service {
  id: string;
  icon: React.ReactNode;
  image: string;
  color: string;
}

const SERVICES: Service[] = [
  {
    id: "buy",
    icon: <Car className="w-8 h-8" />,
    image: "https://picsum.photos/seed/kfzrbm-10/500/400",
    color: "from-blue-50 to-blue-100",
  },
  {
    id: "sell",
    icon: <TrendingUp className="w-8 h-8" />,
    image: "https://picsum.photos/seed/kfzrbm-11/500/400",
    color: "from-green-50 to-green-100",
  },
  {
    id: "consignment",
    icon: <Handshake className="w-8 h-8" />,
    image: "https://picsum.photos/seed/kfzrbm-12/500/400",
    color: "from-orange-50 to-orange-100",
  },
  {
    id: "trade-in",
    icon: <Truck className="w-8 h-8" />,
    image: "https://picsum.photos/seed/kfzrbm-13/500/400",
    color: "from-purple-50 to-purple-100",
  },
  {
    id: "export",
    icon: <Globe className="w-8 h-8" />,
    image: "https://picsum.photos/seed/kfzrbm-14/500/400",
    color: "from-yellow-50 to-yellow-100",
  },
];

export function ServicesGrid() {
  const t = useTranslations("pages.home");
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
                alt={t(`services.${service.id}.title`)}
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
                  {t(`services.${service.id}.title`)}
                </h3>
                <p className="text-gray-700 mb-6">
                  {t(`services.${service.id}.description`)}
                </p>
              </div>

              {/* CTA */}
              <Button className="w-full bg-kfz-blue hover:bg-kfz-blue-dark text-white font-semibold">
                {t(`services.${service.id}.cta`)}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
