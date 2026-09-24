"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { FormEvent, useState } from "react";
import { COMPANY, getFormattedAddress } from "@/lib/company";
import { BusinessHours } from "@/components/business-hours";

export default function ContactPage() {
  const t = useTranslations();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t("contact.title")}</h1>
        <p className="text-lg text-gray-600 mb-12">
          {t("contact.getInTouch")}
        </p>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t("footer.contactInfo")}
            </h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Phone className="w-6 h-6 text-kfz-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t("contact.phone")}</h3>
                  <p className="text-gray-600">{COMPANY.phone}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Mail className="w-6 h-6 text-kfz-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t("contact.email")}</h3>
                  <p className="text-gray-600">{COMPANY.email}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <MapPin className="w-6 h-6 text-kfz-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t("contact.address")}</h3>
                  <p className="text-gray-600">
                    {getFormattedAddress()}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Clock className="w-6 h-6 text-kfz-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t("contact.hours")}</h3>
                  <BusinessHours className="text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t("contact.sendMessage")}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("forms.fullName")}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-accent focus:border-transparent outline-none"
                  placeholder={t("forms.fullName")}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("forms.email")}
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-accent focus:border-transparent outline-none"
                  placeholder={t("forms.email")}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("forms.phone")}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-accent focus:border-transparent outline-none"
                  placeholder={t("forms.phone")}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("forms.message")}
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-accent focus:border-transparent outline-none resize-none"
                  placeholder={t("forms.message")}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-kfz-blue hover:bg-kfz-blue-dark text-white py-2 font-semibold"
              >
                {t("contact.sendMessage")}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
