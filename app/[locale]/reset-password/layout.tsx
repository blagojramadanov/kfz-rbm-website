import { getPageMetadata } from "@/lib/seo";

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return getPageMetadata(locale, "resetPassword", "/reset-password", { noindex: true });
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
