import { getDashboardMetadata } from "@/lib/dashboard-metadata";

export function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  return getDashboardMetadata(locale, "dashboard.tradeIn");
}

export default function TradeInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
