"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Car, ChevronLeft, ChevronRight } from "lucide-react";

interface VehicleGalleryProps {
  images: string[];
  title: string;
}

export function VehicleGallery({ images, title }: VehicleGalleryProps) {
  const t = useTranslations("vehicles.gallery");
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative h-96 sm:h-[500px] bg-secondary rounded-lg flex flex-col items-center justify-center gap-3 text-muted-foreground/70">
        <Car className="w-16 h-16" aria-hidden="true" />
        <p>{t("noImages")}</p>
      </div>
    );
  }

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative h-96 sm:h-[500px] bg-secondary rounded-lg overflow-hidden group">
        <Image
          src={images[selectedIndex]}
          alt={t("imageAlt", { title, index: selectedIndex + 1, total: images.length })}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 70vw"
          className="object-cover"
          priority
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-card bg-opacity-90 hover:bg-opacity-100 text-foreground rounded-full p-2 transition-all z-10"
              aria-label={t("previous")}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-card bg-opacity-90 hover:bg-opacity-100 text-foreground rounded-full p-2 transition-all z-10"
              aria-label={t("next")}
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-primary-foreground px-3 py-1 rounded text-sm font-semibold">
              {t("counter", { current: selectedIndex + 1, total: images.length })}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              aria-label={t("showImage", { index: index + 1 })}
              aria-current={index === selectedIndex}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedIndex
                  ? "border-primary"
                  : "border-border hover:border-primary"
              }`}
            >
              <Image
                src={image}
                alt={t("thumbnailAlt", { title, index: index + 1 })}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
