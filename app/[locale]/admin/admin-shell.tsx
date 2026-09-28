"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname, Link } from "@/lib/navigation";
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
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { COMPANY } from "@/lib/company";
import { useBodyScrollLock, useEscapeKey } from "@/lib/use-body-scroll-lock";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  submenu?: { label: string; href: string }[];
}

const getAdminNavigation = (t: ReturnType<typeof useTranslations>): NavItem[] => [
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

/** Sidebar content, shared by the desktop sidebar and the mobile drawer. */
function AdminNav({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive = (href: string) => pathname === href;
  const inSection = (item: NavItem) =>
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
  const [expanded, setExpanded] = useState<string | null>(
    () => items.find((item) => item.submenu && inSection(item))?.href ?? null
  );

  return (
    <nav className="flex-1 overflow-y-auto overscroll-contain p-4">
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.href}>
            {item.submenu ? (
              <>
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === item.href ? null : item.href)}
                  aria-expanded={expanded === item.href}
                  className={cn(
                    "w-full min-h-11 flex items-center justify-between px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-left",
                    inSection(item) && "bg-white/5",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span className="font-medium">{item.label}</span>
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn("w-4 h-4 transition-transform", expanded === item.href && "rotate-180")}
                  />
                </button>
                {expanded === item.href && (
                  <ul className="ml-4 mt-1 space-y-1">
                    {item.submenu.map((subitem) => (
                      <li key={subitem.href}>
                        <Link
                          href={subitem.href}
                          onClick={onNavigate}
                          aria-current={isActive(subitem.href) ? "page" : undefined}
                          className={cn(
                            "flex min-h-11 items-center px-4 rounded-lg text-sm text-inverse-foreground/85 hover:bg-white/10 transition-colors",
                            isActive(subitem.href) && "bg-white/15 text-inverse-foreground font-semibold",
                          )}
                        >
                          {subitem.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "min-h-11 flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors",
                  inSection(item) && "bg-white/15 font-semibold",
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const { loading, isAdmin, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const adminNavigation = getAdminNavigation(t);
  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);

  useBodyScrollLock(mobileMenuOpen);
  useEscapeKey(mobileMenuOpen, closeMenu);

  // Close the drawer after navigation.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      // Redirect non-admins to dashboard
      router.push(`/dashboard`);
    }
  }, [loading, isAdmin, router]);

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

  const sidebarHeader = (
    <div className="min-w-0">
      <p className="text-2xl font-bold">{COMPANY.name}</p>
      <p className="text-sm text-inverse-foreground/70">{t("admin.sidebar.adminPanel")}</p>
    </div>
  );

  const sidebarFooter = (
    <div className="p-4 border-t border-white/10">
      <div className="px-4 py-3 rounded-lg bg-white/10 mb-4 min-w-0">
        <p className="text-sm text-inverse-foreground/85 truncate">{profile?.full_name}</p>
        <p className="text-xs text-inverse-foreground/70 break-all">{profile?.email}</p>
      </div>
      <button
        onClick={handleLogout}
        className="w-full min-h-11 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive-hover transition-colors font-medium"
      >
        <LogOut className="w-4 h-4" aria-hidden="true" />
        {t("auth.signOut")}
      </button>
    </div>
  );

  return (
    // The page scrolls as a whole (one scroll area on phones); the sidebar stays in view below the site navbar.
    <div className="flex min-h-[calc(100vh-5rem)] bg-muted">
      {/* Sidebar (md+) */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-inverse text-inverse-foreground sticky top-20 h-[calc(100vh-5rem)]">
        <div className="p-6 border-b border-white/10">{sidebarHeader}</div>
        <AdminNav items={adminNavigation} pathname={pathname} />
        {sidebarFooter}
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <div className="bg-card border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-expanded={mobileMenuOpen}
              aria-controls="admin-mobile-menu"
              aria-label={t("navigation.openMenu")}
              className="md:hidden -ml-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-secondary"
            >
              <Menu className="w-6 h-6" aria-hidden="true" />
            </button>
            <h2 className="text-lg font-semibold truncate">{t("admin.sidebar.adminDashboard")}</h2>
          </div>
          <div className="hidden sm:block text-sm text-muted-foreground truncate">{profile?.full_name}</div>
        </div>

        {/* Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Mobile drawer (above the site navbar) */}
      {mobileMenuOpen && (
        <div id="admin-mobile-menu" className="fixed inset-0 z-[60] flex md:hidden" role="dialog" aria-modal="true" aria-label={t("admin.sidebar.adminPanel")}>
          <div className="flex w-72 max-w-[85vw] flex-col bg-inverse text-inverse-foreground shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between gap-2 p-4 pl-6 border-b border-white/10">
              {sidebarHeader}
              <button
                type="button"
                onClick={closeMenu}
                aria-label={t("navigation.closeMenu")}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-white/10"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
            <AdminNav items={adminNavigation} pathname={pathname} onNavigate={closeMenu} />
            {sidebarFooter}
          </div>
          <div className="flex-1 bg-black/50 animate-in fade-in" onClick={closeMenu} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
