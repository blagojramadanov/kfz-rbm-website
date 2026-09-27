import { getDashboardMetadata } from "@/lib/dashboard-metadata";

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return getDashboardMetadata(locale, "dashboard.vehicles");
}

export default function VehiclesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
