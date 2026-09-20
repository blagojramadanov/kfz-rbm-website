import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import { COMPANY, getFormattedAddress } from "@/lib/company";

export function Footer() {
  const currentYear = new Date().getFullYear();

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
                <Link href="/fahrzeuge" className="hover:text-white transition-colors">
                  Browse Vehicles
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
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
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/impressum" className="hover:text-white transition-colors">
              Impressum
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-center text-blue-100 text-sm">
            <p>
              © {currentYear} {COMPANY.name}. All rights reserved. | Premium Used Cars
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
