import { getDashboardMetadata } from "@/lib/dashboard-metadata";

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return getDashboardMetadata(locale, "dashboard.profile");
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
