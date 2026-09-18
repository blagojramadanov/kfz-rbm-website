"use client";

import { useState, useEffect } from "react";
import { VehicleGallery } from "@/components/vehicle-gallery";
import { ListingTypeBadge } from "@/components/listing-type-badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { MOCK_VEHICLES } from "@/lib/vehicle-data";
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface VehicleDetailPageProps {
  params: {
    slug: string;
  };
}

export default function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        // Try to find vehicle by ID or slug in database
        const { data, error } = await supabase
          .from("vehicles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (error || !data) {
          console.error("Error fetching vehicles:", error);
          // Fallback to mock data
          const mockVehicle = MOCK_VEHICLES.find((v) => v.slug === params.slug);
          setVehicle(mockVehicle);
          setLoading(false);
          return;
        }

        // Find vehicle by matching slug pattern (brand-model)
        const foundVehicle = data.find((v) => {
          const slug = `${v.brand}-${v.model}`.toLowerCase().replace(/\s+/g, '-');
          return slug === params.slug;
        });

        if (!foundVehicle) {
          // Fallback to mock data
          const mockVehicle = MOCK_VEHICLES.find((v) => v.slug === params.slug);
          setVehicle(mockVehicle);
          setLoading(false);
          return;
        }

        // Fetch images for the vehicle
        const { data: images, error: imagesError } = await supabase
          .from("vehicle_images")
          .select("image_url")
          .eq("vehicle_id", foundVehicle.id)
          .order("sort_order", { ascending: true });

        const vehicleWithImages = {
          ...foundVehicle,
          images: images?.map((img) => img.image_url) || [],
        };

        setVehicle(vehicleWithImages);
      } catch (err) {
        console.error("Error loading vehicle:", err);
        // Fallback to mock data
        const mockVehicle = MOCK_VEHICLES.find((v) => v.slug === params.slug);
        setVehicle(mockVehicle);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Fahrzeugdetails werden geladen...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/fahrzeuge"
            className="inline-flex items-center gap-2 text-kfz-blue hover:text-kfz-blue-dark transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Zurück zur Übersicht
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Gallery and Main Info */}
          <div className="lg:col-span-2">
            {/* Gallery */}
            <VehicleGallery
              images={vehicle.images}
              title={`${vehicle.brand} ${vehicle.model}`}
            />

            {/* Title and Key Stats */}
            <div className="mt-12">
              {/* Listing Type Badge */}
              {vehicle.listing_type === "export" && (
                <div className="mb-4">
                  <ListingTypeBadge type={vehicle.listing_type} />
                </div>
              )}

              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {vehicle.brand} {vehicle.model}
                  </h1>
                  <p className="text-gray-600 text-lg">
                    {vehicle.year}
                    {vehicle.firstRegistration ? ` • ${vehicle.firstRegistration}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-kfz-blue mb-2">
                    €{vehicle.price?.toLocaleString("de-DE") || "—"}
                  </div>
                  <p className="text-gray-600">
                    {vehicle.listing_type === "export" ? "Exportpreis (netto)" : "Netto-Verkaufspreis"}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 pb-12 border-b">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Kilometer</p>
                  <p className="text-xl font-bold text-gray-900">
                    {vehicle.mileage ? (vehicle.mileage / 1000).toFixed(0) + "k km" : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Leistung</p>
                  <p className="text-xl font-bold text-gray-900">
                    {vehicle.power_hp || vehicle.powerHp || "—"} PS
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Getriebe</p>
                  <p className="text-xl font-bold text-gray-900">{vehicle.transmission || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Kraftstoff</p>
                  <p className="text-xl font-bold text-gray-900">{vehicle.fuel_type || vehicle.fuelType || "—"}</p>
                </div>
              </div>

              {/* Export-Specific Fields */}
              {vehicle.listing_type === "export" && (
                <div className="mb-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">🌍 Exportinformationen</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {vehicle.zustand && (
                      <div>
                        <p className="text-gray-600 text-sm mb-1">Zustand</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {vehicle.zustand === "fahrbereit" && "Fahrbereit"}
                          {vehicle.zustand === "nicht_fahrbereit" && "Nicht fahrbereit"}
                          {vehicle.zustand === "unfallwagen" && "Unfallwagen"}
                        </p>
                      </div>
                    )}
                    {vehicle.zielland && (
                      <div>
                        <p className="text-gray-600 text-sm mb-1">Zielland</p>
                        <p className="text-lg font-semibold text-gray-900">{vehicle.zielland}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Preistyp</p>
                      <p className="text-lg font-semibold text-gray-900">Netto (§25a)</p>
                    </div>
                  </div>
                  {vehicle.export_notes && (
                    <div className="mt-6 pt-6 border-t border-blue-200">
                      <p className="text-gray-600 text-sm mb-2">Exportnoten</p>
                      <p className="text-gray-700">{vehicle.export_notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Beschreibung</h2>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {vehicle.description || "Keine Beschreibung verfügbar"}
                </p>
              </div>

              {/* Detailed Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12 pb-12 border-b">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Fahrzeugdetails
                  </h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-gray-600 text-sm">Fahrzeugart</dt>
                      <dd className="text-gray-900 font-semibold">{vehicle.body_type || vehicle.bodyType || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600 text-sm">Farbe (Außen)</dt>
                      <dd className="text-gray-900 font-semibold">{vehicle.color_exterior || vehicle.color || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600 text-sm">Erstzulassung</dt>
                      <dd className="text-gray-900 font-semibold">{vehicle.firstRegistration || vehicle.year || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600 text-sm">Hubraum</dt>
                      <dd className="text-gray-900 font-semibold">{vehicle.engine_cc || "Auf Anfrage"}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Inspektionen & Zertifikate
                  </h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-gray-600 text-sm">HU (TÜV)</dt>
                      <dd className="text-gray-900 font-semibold">{vehicle.tu}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600 text-sm">AU</dt>
                      <dd className="text-gray-900 font-semibold">{vehicle.au}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600 text-sm">Unfallhistorie</dt>
                      <dd className="flex items-center gap-2 text-gray-900 font-semibold">
                        {vehicle.damageHistory === "Unfallfrei" ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Unfallfrei
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                            Mit Schaden
                          </>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-600 text-sm">MwSt. ausweisbar</dt>
                      <dd className="text-gray-900 font-semibold">{vehicle.taxable}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Features */}
              {vehicle.features && vehicle.features.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Ausstattung & Features
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {vehicle.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg"
                      >
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-900">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Contact & CTA */}
          <div className="lg:col-span-1">
            {/* CTA Card */}
            <div className="sticky top-24 bg-white rounded-lg shadow-lg p-8 space-y-6">
              {/* Price Summary */}
              <div className="border-b pb-6">
                <p className="text-gray-600 text-sm mb-2">Verkaufspreis</p>
                <p className="text-3xl font-bold text-kfz-blue mb-4">
                  €{vehicle.price.toLocaleString("de-DE")}
                </p>
                {vehicle.taxable === "Ja" && (
                  <p className="text-sm text-gray-600">
                    zzgl. MwSt. ausweisbar
                  </p>
                )}
              </div>

              {/* Quick Contact */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900">Interessiert?</h3>
                <p className="text-sm text-gray-600">
                  Kontaktieren Sie uns für weitere Informationen und eine Probefahrt.
                </p>

                <Button className="w-full bg-kfz-blue hover:bg-kfz-blue-dark text-white py-3 text-lg font-semibold">
                  Anfrage senden
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-kfz-blue text-kfz-blue hover:bg-kfz-blue hover:text-white py-3 text-lg font-semibold"
                >
                  Probefahrt vereinbaren
                </Button>
              </div>

              {/* Contact Info */}
              <div className="border-t pt-6 space-y-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Telefon</p>
                  <a
                    href="tel:+49123456789"
                    className="text-kfz-blue hover:text-kfz-blue-dark font-semibold"
                  >
                    +49 123 456789
                  </a>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">E-Mail</p>
                  <a
                    href="mailto:info@kfz-rbm.de"
                    className="text-kfz-blue hover:text-kfz-blue-dark font-semibold break-all"
                  >
                    info@kfz-rbm.de
                  </a>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Öffnungszeiten</p>
                  <p className="text-gray-900">
                    Mo-Fr: 9:00 - 18:00 Uhr
                    <br />
                    Sa: 10:00 - 16:00 Uhr
                  </p>
                </div>
              </div>

              {/* Share & Favorite */}
              <div className="border-t pt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                >
                  Teilen
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                >
                  Merken
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Vehicles */}
      <div className="bg-white py-16 px-4 sm:px-6 lg:px-8 border-t">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Ähnliche Fahrzeuge
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MOCK_VEHICLES.filter(
              (v) =>
                v.brand === vehicle.brand &&
                v.id !== vehicle.id
            )
              .slice(0, 4)
              .map((relatedVehicle) => (
                <Link
                  key={relatedVehicle.id}
                  href={`/fahrzeuge/${relatedVehicle.slug}`}
                  className="group"
                >
                  <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition">
                    <div className="relative h-40 bg-gray-200">
                      <img
                        src={relatedVehicle.images[0]}
                        alt={`${relatedVehicle.brand} ${relatedVehicle.model}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-gray-900 group-hover:text-kfz-blue">
                        {relatedVehicle.brand} {relatedVehicle.model}
                      </h4>
                      <p className="text-kfz-blue font-bold mt-2">
                        €{relatedVehicle.price.toLocaleString("de-DE")}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {relatedVehicle.year} • {(relatedVehicle.mileage / 1000).toFixed(0)}k km
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
