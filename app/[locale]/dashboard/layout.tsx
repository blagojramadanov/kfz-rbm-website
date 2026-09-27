import { getDashboardMetadata } from "@/lib/dashboard-metadata";

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return getDashboardMetadata(locale, "dashboard");
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
