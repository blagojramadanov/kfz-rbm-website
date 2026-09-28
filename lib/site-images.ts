import type { StaticImageData } from "next/image";
import hero from "@/public/images/site/hero.jpg";
import about from "@/public/images/site/about.jpg";
import services from "@/public/images/site/services.jpg";
import sellCar from "@/public/images/site/sell-car.jpg";
import contact from "@/public/images/site/contact.jpg";
import exportImage from "@/public/images/site/export.webp";

/**
 * Decorative site photos (public/images/site). Alt texts live in the
 * `siteImages` message namespace under the same key.
 */
export const SITE_IMAGES = {
  hero,
  about,
  services,
  sellCar,
  contact,
  export: exportImage,
} satisfies Record<string, StaticImageData>;

export type SiteImageKey = keyof typeof SITE_IMAGES;
