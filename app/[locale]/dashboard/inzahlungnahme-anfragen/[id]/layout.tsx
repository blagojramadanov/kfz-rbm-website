import { getDashboardMetadata } from "@/lib/dashboard-metadata";

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return getDashboardMetadata(locale, "dashboard.tradeInRequestDetail");
}

export default function TradeInRequestDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
