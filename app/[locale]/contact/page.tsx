"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, CheckCircle } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { COMPANY, EMAIL_HREF, PHONE_HREF, getFormattedAddress } from "@/lib/company";
import { HoneypotField } from "@/components/honeypot-field";
import { useAuth } from "@/lib/auth-context";
import { useErrorMessage } from "@/lib/use-error-message";
import { PageHeader } from "@/components/page-header";
import { PrivacyNotice } from "@/components/privacy-notice";
import { SITE_IMAGES } from "@/lib/site-images";

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
    <div className="min-h-screen bg-muted">
      <PageHeader
        title={t("contact.title")}
        description={t("contact.getInTouch")}
        image={SITE_IMAGES.contact}
        imageAlt={t("siteImages.contact")}
      />
      <div className="page-container">

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Contact Info */}
          <div>
            <h2 className="section-title mb-6">
              {t("footer.contactInfo")}
            </h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{t("contact.phone")}</h3>
                  <a href={PHONE_HREF} className="text-primary hover:text-primary-hover font-medium">{COMPANY.phone}</a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{t("contact.email")}</h3>
                  <a href={EMAIL_HREF} className="text-primary hover:text-primary-hover font-medium break-all">{COMPANY.email}</a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{t("contact.address")}</h3>
                  <p className="text-muted-foreground">
                    {getFormattedAddress(tCompany)}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Contact Form */}
          <div className="card p-6 sm:p-8">
            <h2 className="section-title mb-6">
              {t("contact.sendMessage")}
            </h2>

            {sent ? (
              <div className="text-center py-8" role="status">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" aria-hidden="true" />
                <p className="text-lg font-semibold text-foreground mb-2">{t("contact.messageSent")}</p>
                <p className="text-muted-foreground">{t("contact.messageSentText")}</p>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="relative space-y-6">
              <HoneypotField
                label={t("inquiryForm.honeypot")}
                value={formData.website}
                onChange={(value) => setFormData({ ...formData, website: value })}
              />

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
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
                  className="field"
                  placeholder={t("forms.fullName")}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
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
                  className="field"
                  placeholder={t("forms.email")}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
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
                  className="field"
                  placeholder={t("forms.phone")}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
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
                  className="field resize-none"
                  placeholder={t("forms.message")}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive-subtle/50 border border-destructive-border rounded-lg p-3" role="alert">
                  {error}
                </p>
              )}

              <PrivacyNotice variant="inquiry" />

              <Button
                type="submit"
                disabled={sending}
                className="w-full py-2"
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
