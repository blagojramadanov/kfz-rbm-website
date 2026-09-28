import { getPageMetadata } from "@/lib/seo";

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return getPageMetadata(locale, "register", "/register", { noindex: true });
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
