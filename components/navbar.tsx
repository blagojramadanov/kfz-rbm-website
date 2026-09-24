"use client";

import { Link, useRouter } from "@/lib/navigation";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, LogOut, Settings, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { COMPANY } from "@/lib/company";
import { LanguageSwitcher } from "./language-switcher";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { isAuthenticated, profile, loading, signOut } = useAuth();

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
    <nav className="bg-white shadow-md sticky top-0 z-50">
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
              <div className="text-xl font-bold text-kfz-blue">{COMPANY.name}</div>
              <div className="text-xs text-gray-600">Premium Cars</div>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href={`/fahrzeuge`}
              className="text-gray-700 hover:text-kfz-blue transition-colors font-medium"
            >
              {t("navigation.vehicles")}
            </Link>
            <Link
              href={`/fahrzeuge/export`}
              className="text-gray-700 hover:text-kfz-blue transition-colors font-medium flex items-center gap-1"
            >
              <span>🌍</span>
              <span>{t("navigation.export")}</span>
            </Link>
            <Link
              href={`/about`}
              className="text-gray-700 hover:text-kfz-blue transition-colors font-medium"
            >
              {t("navigation.about")}
            </Link>
            <Link
              href={`/services`}
              className="text-gray-700 hover:text-kfz-blue transition-colors font-medium"
            >
              {t("navigation.services")}
            </Link>
            <Link
              href={`/contact`}
              className="text-gray-700 hover:text-kfz-blue transition-colors font-medium"
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
                      className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-kfz-blue to-kfz-accent flex items-center justify-center text-white text-sm font-bold">
                        {profile.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-gray-700 font-medium">
                        {profile.full_name.split(" ")[0]}
                      </span>
                    </button>

                    {/* Profile Dropdown */}
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10">
                        <Link href={dashboardLink} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 border-b">
                          <User className="w-4 h-4 text-kfz-blue" />
                          <span>{profile.role === "ADMIN" ? t("navigation.admin") : t("navigation.dashboard")}</span>
                        </Link>
                        <Link href={`/dashboard/profil`} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 border-b">
                          <Settings className="w-4 h-4 text-kfz-blue" />
                          <span>{t("navigation.settings")}</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-red-600"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t("auth.signOut")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href={`/login`}>
                    <Button className="bg-kfz-blue hover:bg-kfz-blue-dark text-white">
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
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t">
            <Link
              href={`/fahrzeuge`}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              {t("navigation.vehicles")}
            </Link>
            <Link
              href={`/fahrzeuge/export`}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              🌍 {t("navigation.export")}
            </Link>
            <Link
              href={`/about`}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              {t("navigation.about")}
            </Link>
            <Link
              href={`/services`}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              {t("navigation.services")}
            </Link>
            <Link
              href={`/contact`}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
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
                        <Button variant="outline" className="w-full border-kfz-blue text-kfz-blue">
                          {profile.role === "ADMIN" ? t("navigation.admin") : t("navigation.dashboard")}
                        </Button>
                      </Link>
                      <Button
                        onClick={handleLogout}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        {t("auth.signOut")}
                      </Button>
                    </>
                  ) : (
                    <Link href={`/login`} className="block w-full">
                      <Button className="w-full bg-kfz-blue hover:bg-kfz-blue-dark text-white">
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
