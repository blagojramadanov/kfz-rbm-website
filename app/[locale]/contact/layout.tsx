import { getPageMetadata } from "@/lib/seo";

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return getPageMetadata(locale, "contact", "/contact");
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
