"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTranslations } from "next-intl";
import {
  Car,
  Users,
  MessageSquare,
  BarChart3,
  ArrowLeftRight,
  LogOut,
  ChevronDown,
  Menu
} from "lucide-react";
import { useState } from "react";
import { COMPANY } from "@/lib/company";

const getAdminNavigation = (t: ReturnType<typeof useTranslations>, locale: string) => [
  {
    label: t("admin.sidebar.overview"),
    href: `/admin`,
    icon: BarChart3,
  },
  {
    label: t("admin.sidebar.vehicles"),
    href: `/admin/fahrzeuge`,
    icon: Car,
    submenu: [
      { label: t("admin.sidebar.allVehicles"), href: `/admin/fahrzeuge` },
      { label: t("admin.sidebar.newVehicle"), href: `/admin/fahrzeuge/neu` },
      { label: t("admin.sidebar.submittedVehicles"), href: `/admin/fahrzeuge/eingereicht` },
    ],
  },
  {
    label: t("admin.sidebar.inquiries"),
    href: `/admin/anfragen`,
    icon: MessageSquare,
  },
  {
    label: t("admin.sidebar.tradeIns"),
    href: `/admin/inzahlungnahmen`,
    icon: ArrowLeftRight,
  },
  {
    label: t("admin.sidebar.customers"),
    href: `/admin/kunden`,
    icon: Users,
  },
  {
    label: t("admin.sidebar.statistics"),
    href: `/admin/statistik`,
    icon: BarChart3,
  },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'de';
  const t = useTranslations();
  const { loading, isAdmin, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const adminNavigation = getAdminNavigation(t, locale);

  useEffect(() => {
    if (!loading && !isAdmin) {
      // Redirect non-admins to dashboard
      router.push(`/dashboard`);
    }
  }, [loading, isAdmin, router, locale]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="flex h-screen bg-secondary">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-inverse text-inverse-foreground">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold">{COMPANY.name}</h1>
          <p className="text-sm text-inverse-foreground/70">{t("admin.sidebar.adminPanel")}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {adminNavigation.map((item) => (
              <div key={item.href}>
                <Link href={item.href}>
                  <button
                    onClick={() =>
                      item.submenu && setExpandedMenu(expandedMenu === item.label ? null : item.label)
                    }
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {item.submenu && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expandedMenu === item.label ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>
                </Link>

                {/* Submenu */}
                {item.submenu && expandedMenu === item.label && (
                  <div className="ml-4 mt-2 space-y-1">
                    {item.submenu.map((subitem) => (
                      <Link key={subitem.href} href={subitem.href}>
                        <div className="px-4 py-2 rounded-lg text-sm text-inverse-foreground/85 hover:bg-white/10 transition-colors">
                          {subitem.label}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="px-4 py-3 rounded-lg bg-white/10 mb-4">
            <p className="text-sm text-inverse-foreground/85">{profile?.full_name}</p>
            <p className="text-xs text-inverse-foreground/70">{profile?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive-hover transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            {t("auth.signOut")}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-secondary rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold">{t("admin.sidebar.adminDashboard")}</h2>
          </div>
          <div className="text-sm text-muted-foreground">{profile?.full_name}</div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-muted p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="bg-inverse text-inverse-foreground w-64 h-screen overflow-y-auto p-4">
            <nav className="space-y-2">
              {adminNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              ))}
            </nav>
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
