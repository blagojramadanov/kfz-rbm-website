import type { Metadata } from "next";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Car } from "lucide-react";
import { BusinessHours } from "@/components/business-hours";
import { ListingTypeBadge } from "@/components/listing-type-badge";
import { VehicleGallery } from "@/components/vehicle-gallery";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/company";
import { formatMileage, formatPrice } from "@/lib/format-vehicle";
import { Link } from "@/lib/navigation";
import {
  findSlugByLegacySlug,
  getRelatedVehicles,
  getVehicleBySlug,
} from "@/lib/public-vehicles";
import { decodeSlugParam } from "@/lib/vehicle-slug";
import {
  getBodyTypeLabel,
  getColorLabel,
  getFuelTypeLabel,
  getTransmissionLabel,
  getVehicleConditionLabel,
} from "@/lib/vehicle-labels";

// ISR: the vehicle is read with the cookie-less anon client (lib/public-vehicles.ts)
// and rendered on first request, then refreshed at most once a minute.
// Must be a literal for Next to read it; keep in sync with REVALIDATE_SECONDS in that file.
export const revalidate = 60;

// No vehicle is prerendered at build time, but returning an (empty) list opts this
// dynamic route into on-demand ISR: each slug is rendered once, cached, then refreshed.
export function generateStaticParams() {
  return [];
}

interface VehicleDetailPageProps {
  params: {
    locale: string;
    slug: string;
  };
}

export async function generateMetadata({
  params: { locale, slug },
}: VehicleDetailPageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "pages.fahrzeugDetail" });
  const vehicle = await getVehicleBySlug(decodeSlugParam(slug));
  if (!vehicle) return { title: t("notFound.title") };

  const format = await getFormatter({ locale });
  const image = vehicle.images[0];
  return {
    title: t("metaTitle", {
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      name: COMPANY.name,
    }),
    description: t("metaDescription", {
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      mileage: formatMileage(format, vehicle.mileage),
      price: formatPrice(format, vehicle.price),
      name: COMPANY.name,
    }),
    openGraph: image ? { images: [image] } : undefined,
  };
}

export default async function VehicleDetailPage({
  params: { locale, slug: rawSlug },
}: VehicleDetailPageProps) {
  setRequestLocale(locale);
  const slug = decodeSlugParam(rawSlug);

  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) {
    // Old `brand-model` URL? Send it to the vehicle's unique slug.
    const currentSlug = await findSlugByLegacySlug(slug);
    if (currentSlug) permanentRedirect(`/${locale}/fahrzeuge/${currentSlug}`);
    notFound();
  }
  // Same id, outdated or mistyped name part: use the canonical URL.
  if (slug !== vehicle.slug) permanentRedirect(`/${locale}/fahrzeuge/${vehicle.slug}`);

  const [t, tVehicles, tCommon, tContact, format, relatedVehicles] = await Promise.all([
    getTranslations("pages.fahrzeugDetail"),
    getTranslations("vehicles"),
    getTranslations("common"),
    getTranslations("contact"),
    getFormatter(),
    getRelatedVehicles(vehicle, 4),
  ]);

  const isExport = vehicle.listingType === "export";
  const vehicleLabel = `${vehicle.brand} ${vehicle.model} (${vehicle.year})`;
  const priceLabel = formatPrice(format, vehicle.price);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/fahrzeuge"
            className="inline-flex items-center gap-2 text-kfz-blue hover:text-kfz-blue-dark transition"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            {t("backToOverview")}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Gallery and Main Info */}
          <div className="lg:col-span-2">
            {/* Gallery */}
            <VehicleGallery images={vehicle.images} title={`${vehicle.brand} ${vehicle.model}`} />

            {/* Title and Key Stats */}
            <div className="mt-12">
              {/* Listing Type Badge */}
              {isExport && (
                <div className="mb-4">
                  <ListingTypeBadge type="export" />
                </div>
              )}

              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {vehicle.brand} {vehicle.model}
                  </h1>
                  <p className="text-gray-600 text-lg">{vehicle.year}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-kfz-blue mb-2">{priceLabel}</div>
                  <p className="text-gray-600">
                    {isExport ? t("price.export") : t("price.sale")}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 pb-12 border-b">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{tVehicles("mileage")}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatMileage(format, vehicle.mileage)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">{tVehicles("power")}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {vehicle.powerHp != null
                      ? tVehicles("powerValue", { value: format.number(vehicle.powerHp) })
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">{tVehicles("transmission")}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {vehicle.transmission
                      ? getTransmissionLabel(tCommon, vehicle.transmission)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">{tVehicles("fuelType")}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {vehicle.fuelType ? getFuelTypeLabel(tCommon, vehicle.fuelType) : "—"}
                  </p>
                </div>
              </div>

              {/* Export-Specific Fields */}
              {isExport && (
                <div className="mb-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    <span aria-hidden="true">🌍</span> {t("exportInfo.title")}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {vehicle.zustand && (
                      <div>
                        <p className="text-gray-600 text-sm mb-1">{tVehicles("condition")}</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {getVehicleConditionLabel(tCommon, vehicle.zustand)}
                        </p>
                      </div>
                    )}
                    {vehicle.zielland && (
                      <div>
                        <p className="text-gray-600 text-sm mb-1">{t("exportInfo.destination")}</p>
                        <p className="text-lg font-semibold text-gray-900">{vehicle.zielland}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600 text-sm mb-1">{t("exportInfo.priceType")}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {t("exportInfo.priceTypeValue")}
                      </p>
                    </div>
                  </div>
                  {vehicle.exportNotes && (
                    <div className="mt-6 pt-6 border-t border-blue-200">
                      <p className="text-gray-600 text-sm mb-2">{t("exportInfo.notes")}</p>
                      <p className="text-gray-700">{vehicle.exportNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("description.title")}</h2>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {vehicle.description || t("description.empty")}
                </p>
              </div>

              {/* Detailed Specs */}
              <div className="mb-12 pb-12 border-b">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{tVehicles("details")}</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <dt className="text-gray-600 text-sm">{tVehicles("bodyType")}</dt>
                    <dd className="text-gray-900 font-semibold">
                      {vehicle.bodyType ? getBodyTypeLabel(tCommon, vehicle.bodyType) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 text-sm">{tVehicles("colorExterior")}</dt>
                    <dd className="text-gray-900 font-semibold">
                      {vehicle.color ? getColorLabel(tCommon, vehicle.color) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 text-sm">{tVehicles("firstRegistration")}</dt>
                    <dd className="text-gray-900 font-semibold">{vehicle.year}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 text-sm">{tVehicles("engineSize")}</dt>
                    <dd className="text-gray-900 font-semibold">
                      {vehicle.engineCc
                        ? tVehicles("engineValue", { value: format.number(vehicle.engineCc) })
                        : tVehicles("onRequest")}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Right Column - Contact & CTA */}
          <div className="lg:col-span-1">
            {/* CTA Card */}
            <div className="sticky top-24 bg-white rounded-lg shadow-lg p-8 space-y-6">
              {/* Price Summary */}
              <div className="border-b pb-6">
                <p className="text-gray-600 text-sm mb-2">{t("price.summary")}</p>
                <p className="text-3xl font-bold text-kfz-blue">{priceLabel}</p>
              </div>

              {/* Quick Contact */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900">{t("cta.title")}</h3>
                <p className="text-sm text-gray-600">{t("cta.text")}</p>

                <Button
                  asChild
                  className="w-full bg-kfz-blue hover:bg-kfz-blue-dark text-white py-3 text-lg font-semibold"
                >
                  <Link href="/contact">{t("cta.inquiry")}</Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full border-kfz-blue text-kfz-blue hover:bg-kfz-blue hover:text-white py-3 text-lg font-semibold"
                >
                  <Link href={{ pathname: "/contact", query: { testDrive: vehicleLabel } }}>
                    {t("cta.testDrive")}
                  </Link>
                </Button>
              </div>

              {/* Contact Info */}
              <div className="border-t pt-6 space-y-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">{tContact("phone")}</p>
                  <a
                    href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
                    className="text-kfz-blue hover:text-kfz-blue-dark font-semibold"
                  >
                    {COMPANY.phone}
                  </a>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">{tContact("email")}</p>
                  <a
                    href={`mailto:${COMPANY.email}`}
                    className="text-kfz-blue hover:text-kfz-blue-dark font-semibold break-all"
                  >
                    {COMPANY.email}
                  </a>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">{tContact("hours")}</p>
                  <BusinessHours className="text-gray-900" />
                </div>
              </div>

              {/* Share & Favorite */}
              <div className="border-t pt-6 flex gap-3">
                <Button variant="outline" className="flex-1">
                  {t("cta.share")}
                </Button>
                <Button variant="outline" className="flex-1">
                  {t("cta.save")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Vehicles */}
      {relatedVehicles.length > 0 && (
        <div className="bg-white py-16 px-4 sm:px-6 lg:px-8 border-t">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">{t("related")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedVehicles.map((relatedVehicle) => (
                <Link
                  key={relatedVehicle.id}
                  href={`/fahrzeuge/${relatedVehicle.slug}`}
                  className="group"
                >
                  <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition">
                    <div className="relative h-40 bg-gray-200">
                      {relatedVehicle.image ? (
                        <Image
                          src={relatedVehicle.image}
                          alt={`${relatedVehicle.brand} ${relatedVehicle.model}`}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <Car className="w-10 h-10" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-gray-900 group-hover:text-kfz-blue">
                        {relatedVehicle.brand} {relatedVehicle.model}
                      </h4>
                      <p className="text-kfz-blue font-bold mt-2">
                        {formatPrice(format, relatedVehicle.price)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {relatedVehicle.year} • {formatMileage(format, relatedVehicle.mileage)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
