"use client";

import { Link, useRouter } from "@/lib/navigation";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, LogOut, Settings, User, Heart, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useFavorites } from "@/lib/favorites-context";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { COMPANY } from "@/lib/company";
import { LanguageSwitcher } from "./language-switcher";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const locale = useLocale();
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

  const handleLogout = async () => {
    await signOut();
    setIsProfileOpen(false);
    router.push("/");
  };

  // Determine dashboard link based on user role
  const getDashboardLink = () => {
    if (!profile) return `/dashboard`;
    return profile.role === "ADMIN" ? `/admin` : `/dashboard`;
  };

  const dashboardLink = getDashboardLink();

  return (
    <nav className="bg-card shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href={"/"} className="flex items-center gap-3">
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

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href={`/fahrzeuge`}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              {t("navigation.vehicles")}
            </Link>
            <Link
              href={`/fahrzeuge/export`}
              className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-1.5"
            >
              <Globe className="w-4 h-4" aria-hidden="true" />
              <span>{t("navigation.export")}</span>
            </Link>
            <Link
              href={`/about`}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              {t("navigation.about")}
            </Link>
            <Link
              href={`/services`}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              {t("navigation.services")}
            </Link>
            <Link
              href={`/contact`}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              {t("navigation.contact")}
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            {!loading && (
              <>
                {isAuthenticated && profile ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
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
                      <span className="text-foreground font-medium">
                        {profile.full_name.split(" ")[0]}
                      </span>
                    </button>

                    {/* Profile Dropdown */}
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-card rounded-lg shadow-lg border border-border overflow-hidden z-10">
                        <Link href={dashboardLink} className="flex items-center gap-2 px-4 py-3 hover:bg-muted border-b">
                          <User className="w-4 h-4 text-primary" />
                          <span>{profile.role === "ADMIN" ? t("navigation.admin") : t("navigation.dashboard")}</span>
                        </Link>
                        <Link href="/dashboard/favoriten" className="flex items-center gap-2 px-4 py-3 hover:bg-muted border-b">
                          <Heart className="w-4 h-4 text-primary" />
                          <span>{t("navigation.favorites")}</span>
                          {favoriteBadge}
                        </Link>
                        <Link href={`/dashboard/profil`} className="flex items-center gap-2 px-4 py-3 hover:bg-muted border-b">
                          <Settings className="w-4 h-4 text-primary" />
                          <span>{t("navigation.settings")}</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted text-destructive"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t("auth.signOut")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href={`/login`}>
                    <Button>
                      {t("auth.signIn")}
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t">
            <Link
              href={`/fahrzeuge`}
              className="block px-4 py-2 text-foreground hover:bg-secondary"
            >
              {t("navigation.vehicles")}
            </Link>
            <Link
              href={`/fahrzeuge/export`}
              className="flex items-center gap-2 px-4 py-2 text-foreground hover:bg-secondary"
            >
              <Globe className="w-4 h-4" aria-hidden="true" />
              {t("navigation.export")}
            </Link>
            <Link
              href={`/about`}
              className="block px-4 py-2 text-foreground hover:bg-secondary"
            >
              {t("navigation.about")}
            </Link>
            <Link
              href={`/services`}
              className="block px-4 py-2 text-foreground hover:bg-secondary"
            >
              {t("navigation.services")}
            </Link>
            <Link
              href={`/contact`}
              className="block px-4 py-2 text-foreground hover:bg-secondary"
            >
              {t("navigation.contact")}
            </Link>
            <div className="px-4 py-2 border-t space-y-3">
              <LanguageSwitcher />
              {!loading && (
                <>
                  {isAuthenticated && profile ? (
                    <>
                      <Link href={dashboardLink} className="block w-full">
                        <Button variant="outline-primary" className="w-full">
                          {profile.role === "ADMIN" ? t("navigation.admin") : t("navigation.dashboard")}
                        </Button>
                      </Link>
                      <Link href="/dashboard/favoriten" className="block w-full">
                        <Button variant="outline" className="w-full gap-2">
                          <Heart className="w-4 h-4 text-destructive" aria-hidden="true" />
                          {t("navigation.favorites")}
                          {favoriteBadge}
                        </Button>
                      </Link>
                      <Button variant="destructive"
                        onClick={handleLogout}
                        className="w-full"
                      >
                        {t("auth.signOut")}
                      </Button>
                    </>
                  ) : (
                    <Link href={`/login`} className="block w-full">
                      <Button className="w-full">
                        {t("auth.signIn")}
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
