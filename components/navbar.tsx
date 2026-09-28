"use client";

import { Link, usePathname, useRouter } from "@/lib/navigation";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Menu, X, LogOut, Settings, User, Heart, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useFavorites } from "@/lib/favorites-context";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { useBodyScrollLock, useEscapeKey } from "@/lib/use-body-scroll-lock";
import { COMPANY } from "@/lib/company";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./language-switcher";

const NAV_LINKS = [
  { href: "/fahrzeuge", key: "vehicles" },
  { href: "/fahrzeuge/export", key: "export", icon: Globe },
  { href: "/about", key: "about" },
  { href: "/services", key: "services" },
  { href: "/contact", key: "contact" },
] as const;

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const { isAuthenticated, profile, loading, signOut } = useAuth();
  const favorites = useFavorites();
  const format = useLocaleFormatter();
  const favoriteCount = favorites.ready ? favorites.count : 0;
  const favoriteBadge = favoriteCount > 0 && (
    <span className="ml-auto min-w-[1.25rem] h-5 px-1.5 rounded-full bg-destructive text-primary-foreground text-xs font-semibold flex items-center justify-center">
      {format.number(favoriteCount)}
    </span>
  );

  const closeMenu = useCallback(() => setIsOpen(false), []);

  // Close the menus after navigation (also covers the browser back button).
  useEffect(() => {
    setIsOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  useBodyScrollLock(isOpen);
  useEscapeKey(isOpen, closeMenu);

  const handleLogout = async () => {
    await signOut();
    setIsProfileOpen(false);
    setIsOpen(false);
    router.push("/");
  };

  // Determine dashboard link based on user role
  const dashboardLink = !profile ? "/dashboard" : profile.role === "ADMIN" ? "/admin" : "/dashboard";

  return (
    <nav className="bg-card shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-4">
          {/* Logo */}
          <Link href={"/"} className="flex items-center gap-3 shrink-0">
            <div className="relative w-12 h-12">
              <Image
                src="/assets/logo.png"
                alt={`${COMPANY.name} Logo`}
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-xl font-bold text-primary">{COMPANY.name}</div>
              <div className="text-xs text-muted-foreground">Premium Cars</div>
            </div>
          </Link>

          {/* Desktop Menu (lg+: five links, the language switcher and the account area need the width) */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {NAV_LINKS.map(({ href, key, ...rest }) => {
              const Icon = "icon" in rest ? rest.icon : null;
              return (
                <Link
                  key={href}
                  href={href}
                  className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-1.5 whitespace-nowrap"
                >
                  {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
                  <span>{t(`navigation.${key}`)}</span>
                </Link>
              );
            })}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <LanguageSwitcher />
            {!loading && (
              <>
                {isAuthenticated && profile ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      aria-expanded={isProfileOpen}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-kfz-blue to-kfz-accent flex items-center justify-center text-primary-foreground text-sm font-bold">
                        {profile.full_name.charAt(0).toUpperCase()}
                        {favoriteCount > 0 && (
                          <span
                            className="absolute -top-1.5 -right-1.5 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-destructive text-primary-foreground text-[10px] font-semibold flex items-center justify-center ring-2 ring-card"
                            aria-label={t("navigation.favoritesCount", { count: favoriteCount })}
                          >
                            {format.number(favoriteCount)}
                          </span>
                        )}
                      </div>
                      <span className="text-foreground font-medium max-w-[8rem] truncate">
                        {profile.full_name.split(" ")[0]}
                      </span>
                    </button>

                    {/* Profile Dropdown */}
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-card rounded-lg shadow-lg border border-border overflow-hidden z-10">
                        <Link href={dashboardLink} className="flex items-center gap-2 px-4 py-3 hover:bg-muted border-b">
                          <User className="w-4 h-4 text-primary" aria-hidden="true" />
                          <span>{profile.role === "ADMIN" ? t("navigation.admin") : t("navigation.dashboard")}</span>
                        </Link>
                        <Link href="/dashboard/favoriten" className="flex items-center gap-2 px-4 py-3 hover:bg-muted border-b">
                          <Heart className="w-4 h-4 text-primary" aria-hidden="true" />
                          <span>{t("navigation.favorites")}</span>
                          {favoriteBadge}
                        </Link>
                        <Link href={`/dashboard/profil`} className="flex items-center gap-2 px-4 py-3 hover:bg-muted border-b">
                          <Settings className="w-4 h-4 text-primary" aria-hidden="true" />
                          <span>{t("navigation.settings")}</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted text-destructive"
                        >
                          <LogOut className="w-4 h-4" aria-hidden="true" />
                          <span>{t("auth.signOut")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button asChild>
                    <Link href={`/login`}>{t("auth.signIn")}</Link>
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button (44px touch target) */}
          <button
            type="button"
            className="lg:hidden -mr-2 inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-secondary transition-colors"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? t("navigation.closeMenu") : t("navigation.openMenu")}
          >
            {isOpen ? (
              <X className="w-6 h-6 text-foreground" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu: full-height panel below the bar; page scroll is locked while open */}
      <div
        id="mobile-menu"
        className={cn(
          "lg:hidden fixed inset-x-0 top-20 bottom-0 z-40 bg-foreground/40 transition-[opacity,visibility] duration-200",
          isOpen ? "visible opacity-100" : "invisible opacity-0",
        )}
        onClick={closeMenu}
      >
        <div
          className={cn(
            "max-h-full overflow-y-auto overscroll-contain bg-card border-t shadow-lg transition-transform duration-200",
            isOpen ? "translate-y-0" : "-translate-y-2",
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
            <ul>
              {NAV_LINKS.map(({ href, key, ...rest }) => {
                const Icon = "icon" in rest ? rest.icon : null;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={closeMenu}
                      className="flex min-h-12 items-center gap-2 rounded-lg px-3 text-base font-medium text-foreground hover:bg-secondary"
                    >
                      {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
                      {t(`navigation.${key}`)}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-2 border-t pt-4 pb-4 space-y-3">
              <LanguageSwitcher size="lg" />
              {!loading && (
                <>
                  {isAuthenticated && profile ? (
                    <>
                      <Button asChild variant="outline-primary" size="lg" className="w-full">
                        <Link href={dashboardLink} onClick={closeMenu}>
                          <User className="mr-2 w-4 h-4" aria-hidden="true" />
                          {profile.role === "ADMIN" ? t("navigation.admin") : t("navigation.dashboard")}
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="w-full">
                        <Link href="/dashboard/favoriten" onClick={closeMenu} className="gap-2">
                          <Heart className="w-4 h-4 text-destructive" aria-hidden="true" />
                          {t("navigation.favorites")}
                          {favoriteBadge}
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="w-full">
                        <Link href="/dashboard/profil" onClick={closeMenu}>
                          <Settings className="mr-2 w-4 h-4" aria-hidden="true" />
                          {t("navigation.settings")}
                        </Link>
                      </Button>
                      <Button variant="destructive" size="lg" onClick={handleLogout} className="w-full">
                        <LogOut className="mr-2 w-4 h-4" aria-hidden="true" />
                        {t("auth.signOut")}
                      </Button>
                    </>
                  ) : (
                    <Button asChild size="lg" className="w-full">
                      <Link href={`/login`} onClick={closeMenu}>
                        {t("auth.signIn")}
                      </Link>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
