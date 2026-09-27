"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock, CheckCircle } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { COMPANY, getFormattedAddress } from "@/lib/company";
import { BusinessHours } from "@/components/business-hours";
import { HoneypotField } from "@/components/honeypot-field";
import { useAuth } from "@/lib/auth-context";
import { useErrorMessage } from "@/lib/use-error-message";

const EMPTY_FORM = { name: "", email: "", phone: "", message: "", website: "" };

export default function ContactPage() {
  const t = useTranslations();
  const tCompany = useTranslations("company");
  const errorMessage = useErrorMessage();
  const { profile } = useAuth();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  // Logged-in customers get their name, email and phone prefilled (the profile loads after the page).
  useEffect(() => {
    if (!profile) return;
    setFormData((prev) => ({
      ...prev,
      name: prev.name || profile.full_name || "",
      email: prev.email || profile.email || "",
      phone: prev.phone || profile.phone || "",
    }));
  }, [profile]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const { sendContactMessage } = await import("@/app/actions/inquiries");
      const result = await sendContactMessage(formData);
      if (!result.ok) {
        setError(errorMessage(result));
        return;
      }
      setSent(true);
      setFormData((prev) => ({ ...prev, message: "" }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
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
                    {getFormattedAddress(tCompany)}
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

            {sent ? (
              <div className="text-center py-8" role="status">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" aria-hidden="true" />
                <p className="text-lg font-semibold text-gray-900 mb-2">{t("contact.messageSent")}</p>
                <p className="text-gray-600">{t("contact.messageSentText")}</p>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="relative space-y-6">
              <HoneypotField
                label={t("inquiryForm.honeypot")}
                value={formData.website}
                onChange={(value) => setFormData({ ...formData, website: value })}
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("forms.fullName")}
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
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
                  maxLength={100}
                  autoComplete="email"
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
                  {t("inquiryForm.phoneOptional")}
                </label>
                <input
                  type="tel"
                  maxLength={30}
                  autoComplete="tel"
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
                  maxLength={2000}
                  rows={5}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-kfz-accent focus:border-transparent outline-none resize-none"
                  placeholder={t("forms.message")}
                />
              </div>

              {error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3" role="alert">
                  {error}
                </p>
              )}

              <p className="text-xs text-gray-500">{t("inquiryForm.privacy")}</p>

              <Button
                type="submit"
                disabled={sending}
                className="w-full bg-kfz-blue hover:bg-kfz-blue-dark text-white py-2 font-semibold"
              >
                {sending ? t("contact.sending") : t("contact.sendMessage")}
              </Button>
            </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
