import { getDashboardMetadata } from "@/lib/dashboard-metadata";

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return getDashboardMetadata(locale, "wizard");
}

export default function SubmitVehicleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
