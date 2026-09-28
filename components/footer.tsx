'use client';

import { Link } from "@/lib/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { COMPANY, EMAIL_HREF, PHONE_HREF, getFormattedAddress } from "@/lib/company";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const locale = useLocale();
  const t = useTranslations();
  const tCompany = useTranslations("company");

  return (
    <footer className="bg-inverse text-inverse-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4">{COMPANY.name}</h3>
            <p className="text-primary-foreground/80 text-sm">
              {t("footer.description")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t("footer.quickLinks")}</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>
                <Link href={`/fahrzeuge`} className="hover:text-primary-foreground transition-colors">
                  {t("navigation.vehicles")}
                </Link>
              </li>
              <li>
                <Link href={`/about`} className="hover:text-primary-foreground transition-colors">
                  {t("navigation.about")}
                </Link>
              </li>
              <li>
                <Link href={`/services`} className="hover:text-primary-foreground transition-colors">
                  {t("navigation.services")}
                </Link>
              </li>
              <li>
                <Link href={`/contact`} className="hover:text-primary-foreground transition-colors">
                  {t("navigation.contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">{t("footer.contactInfo")}</h4>
            <ul className="space-y-3 text-primary-foreground/80 text-sm">
              <li className="flex gap-2">
                <Phone className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                <a href={PHONE_HREF} className="hover:text-primary-foreground transition-colors">
                  <span className="sr-only">{t("contact.phone")}: </span>
                  {COMPANY.phone}
                </a>
              </li>
              <li className="flex gap-2">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                <a href={EMAIL_HREF} className="hover:text-primary-foreground transition-colors break-all">
                  <span className="sr-only">{t("contact.email")}: </span>
                  {COMPANY.email}
                </a>
              </li>
              <li className="flex gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <span className="sr-only">{t("contact.address")}: </span>
                  {getFormattedAddress(tCompany)}
                </span>
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
                aria-label={t("footer.social.facebook")}
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                <Facebook className="w-6 h-6" aria-hidden="true" />
              </a>
              <a
                href={COMPANY.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("footer.social.instagram")}
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                <Instagram className="w-6 h-6" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/15 pt-8">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-4 text-sm text-primary-foreground/80">
            <Link href={`/privacy`} className="hover:text-primary-foreground transition-colors">
              {t("footer.privacyPolicy")}
            </Link>
            <Link href={`/impressum`} className="hover:text-primary-foreground transition-colors">
              {t("footer.impressum")}
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-center text-primary-foreground/80 text-sm">
            <p>
              © {currentYear} {COMPANY.legalName}. {t("footer.allRightsReserved")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
