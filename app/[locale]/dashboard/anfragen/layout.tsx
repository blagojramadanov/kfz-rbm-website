import { getDashboardMetadata } from "@/lib/dashboard-metadata";

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return getDashboardMetadata(locale, "dashboard.inquiries");
}

export default function InquiriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
