'use client';

import Link from "next/link";
import { useLocale } from "next-intl";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { COMPANY, getFormattedAddress } from "@/lib/company";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const locale = useLocale();

  // Fallback translations if context is not available
  const footerText = {
    de: { allRightsReserved: "Alle Rechte vorbehalten", vehicles: "Fahrzeuge", about: "Über uns", services: "Dienstleistungen", contact: "Kontakt" },
    en: { allRightsReserved: "All rights reserved", vehicles: "Vehicles", about: "About", services: "Services", contact: "Contact" },
    mk: { allRightsReserved: "Сите права се задржани", vehicles: "Возила", about: "За нас", services: "Услуги", contact: "Контакт" }
  };

  const current = footerText[locale as keyof typeof footerText] || footerText.de;

  return (
    <footer className="bg-kfz-blue-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4">{COMPANY.name}</h3>
            <p className="text-blue-100 text-sm">
              Premium used-car dealership offering quality vehicles, expert service, and transparent pricing.
            </p>
            <p className="text-blue-200 text-xs mt-3 italic">
              {COMPANY.demoNotice.en}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-blue-100">
              <li>
                <Link href={`/${locale}/fahrzeuge`} className="hover:text-white transition-colors">
                  {current.vehicles}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/about`} className="hover:text-white transition-colors">
                  {current.about}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/services`} className="hover:text-white transition-colors">
                  {current.services}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="hover:text-white transition-colors">
                  {current.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <ul className="space-y-2 text-blue-100 text-sm">
              <li>Phone: {COMPANY.phone}</li>
              <li>Email: {COMPANY.email}</li>
              <li>Address: {getFormattedAddress()}</li>
              <li>Hours: Mon-Fri 9am-6pm</li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
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
              Privacy Policy
            </Link>
            <Link href={`/${locale}/terms`} className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>
            <Link href={`/${locale}/impressum`} className="hover:text-white transition-colors">
              Impressum
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-center text-blue-100 text-sm">
            <p>
              © {currentYear} {COMPANY.name}. {current.allRightsReserved} | Premium Used Cars
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
