import { getPageMetadata } from "@/lib/seo";

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return getPageMetadata(locale, "login", "/login", { noindex: true });
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
