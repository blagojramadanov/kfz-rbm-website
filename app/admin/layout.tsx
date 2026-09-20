"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Car,
  Users,
  MessageSquare,
  BarChart3,
  Repeat2,
  LogOut,
  ChevronDown,
  Menu
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { COMPANY } from "@/lib/company";

const ADMIN_NAVIGATION = [
  {
    label: "Übersicht",
    href: "/admin",
    icon: BarChart3,
  },
  {
    label: "Fahrzeuge",
    href: "/admin/fahrzeuge",
    icon: Car,
    submenu: [
      { label: "Alle Fahrzeuge", href: "/admin/fahrzeuge" },
      { label: "Neues Fahrzeug", href: "/admin/fahrzeuge/neu" },
      { label: "Eingereichte Fahrzeuge", href: "/admin/fahrzeuge/eingereicht" },
    ],
  },
  {
    label: "Anfragen",
    href: "/admin/anfragen",
    icon: MessageSquare,
  },
  {
    label: "Inzahlungnahmen",
    href: "/admin/inzahlungnahmen",
    icon: Repeat2,
  },
  {
    label: "Kunden",
    href: "/admin/kunden",
    icon: Users,
  },
  {
    label: "Statistiken",
    href: "/admin/statistik",
    icon: BarChart3,
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, isAdmin, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      // Redirect non-admins to dashboard
      router.push("/dashboard");
    }
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kfz-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Wird geladen...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold">{COMPANY.name}</h1>
          <p className="text-sm text-gray-400">Admin Panel</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {ADMIN_NAVIGATION.map((item) => (
              <div key={item.href}>
                <Link href={item.href}>
                  <button
                    onClick={() =>
                      item.submenu && setExpandedMenu(expandedMenu === item.label ? null : item.label)
                    }
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors text-left"
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
                        <div className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-700 transition-colors">
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
        <div className="p-4 border-t border-gray-700">
          <div className="px-4 py-3 rounded-lg bg-gray-700 mb-4">
            <p className="text-sm text-gray-300">{profile?.full_name}</p>
            <p className="text-xs text-gray-400">{profile?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
          </div>
          <div className="text-sm text-gray-600">{profile?.full_name}</div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="bg-gray-900 text-white w-64 h-screen overflow-y-auto p-4">
            <nav className="space-y-2">
              {ADMIN_NAVIGATION.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors">
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
