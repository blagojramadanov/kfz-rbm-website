import { getDashboardMetadata } from "@/lib/dashboard-metadata";

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return getDashboardMetadata(locale, "dashboard.tradeInRequests");
}

export default function TradeInRequestsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
