import { getPageMetadata } from "@/lib/seo";

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return getPageMetadata(locale, "forgotPassword", "/forgot-password", { noindex: true });
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
