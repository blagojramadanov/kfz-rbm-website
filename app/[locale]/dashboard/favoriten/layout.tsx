import { getDashboardMetadata } from "@/lib/dashboard-metadata";

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return getDashboardMetadata(locale, "dashboard.favorites");
}

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
