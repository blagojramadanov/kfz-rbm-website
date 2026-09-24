'use client';

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { COMPANY, getFormattedAddress } from "@/lib/company";
import { BusinessHours } from "@/components/business-hours";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const locale = useLocale();
  const t = useTranslations();
  const tCompany = useTranslations("company");

  return (
    <footer className="bg-kfz-blue-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4">{COMPANY.name}</h3>
            <p className="text-blue-100 text-sm">
              {t("footer.description")}
            </p>
            <p className="text-blue-200 text-xs mt-3 italic">
              {t("footer.demoDisclaimer")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t("footer.quickLinks")}</h4>
            <ul className="space-y-2 text-blue-100">
              <li>
                <Link href={`/${locale}/fahrzeuge`} className="hover:text-white transition-colors">
                  {t("navigation.vehicles")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/about`} className="hover:text-white transition-colors">
                  {t("navigation.about")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/services`} className="hover:text-white transition-colors">
                  {t("navigation.services")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="hover:text-white transition-colors">
                  {t("navigation.contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t("footer.contactInfo")}</h4>
            <ul className="space-y-2 text-blue-100 text-sm">
              <li>{t("contact.phone")}: {COMPANY.phone}</li>
              <li>{t("contact.email")}: {COMPANY.email}</li>
              <li>{t("contact.address")}: {getFormattedAddress(tCompany)}</li>
              <li>
                {t("contact.hours")}:
                <BusinessHours className="mt-1 space-y-0.5" />
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t("footer.followUs")}</h4>
            <div className="flex gap-4">
              <a
                href={COMPANY.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-100 hover:text-white transition-colors"
              >
                <Facebook className="w-6 h-6" />
              </a>
              <a
                href={COMPANY.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-100 hover:text-white transition-colors"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a
                href={COMPANY.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-100 hover:text-white transition-colors"
              >
                <Linkedin className="w-6 h-6" />
              </a>
              <a
                href={COMPANY.social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-100 hover:text-white transition-colors"
              >
                <Twitter className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-blue-700 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm text-blue-100">
            <Link href={`/${locale}/privacy`} className="hover:text-white transition-colors">
              {t("footer.privacyPolicy")}
            </Link>
            <Link href={`/${locale}/terms`} className="hover:text-white transition-colors">
              {t("footer.termsConditions")}
            </Link>
            <Link href={`/${locale}/impressum`} className="hover:text-white transition-colors">
              {t("footer.impressum")}
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-center text-blue-100 text-sm">
            <p>
              © {currentYear} {COMPANY.name}. {t("footer.allRightsReserved")} | {t("footer.premiumCars")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
