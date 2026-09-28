"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoneypotField } from "@/components/honeypot-field";
import { useAuth } from "@/lib/auth-context";
import { TEST_DRIVE_HASH } from "@/lib/inquiries";
import { Link } from "@/lib/navigation";
import { useErrorMessage } from "@/lib/use-error-message";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";

type InquiryType = "general" | "test_drive";


/** Local calendar date as YYYY-MM-DD (the value format of <input type="date">). */
function toDateInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const inputClass =
  "field";

/**
 * "Send inquiry" / "Book a test drive" buttons of the vehicle detail page and the
 * inquiry dialog they open. Saved with sendVehicleInquiry(); guests can send it too.
 */
export function VehicleInquiry({ vehicleId, vehicleLabel }: { vehicleId: string; vehicleLabel: string }) {
  const t = useTranslations("inquiryForm");
  const tCta = useTranslations("pages.fahrzeugDetail.cta");
  const tForms = useTranslations("forms");
  const errorMessage = useErrorMessage();
  const { profile, isAuthenticated } = useAuth();
  const titleId = useId();

  const [openType, setOpenType] = useState<InquiryType | null>(null);
  const [type, setType] = useState<InquiryType>("general");
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", preferredDate: "", website: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const firstFieldRef = useRef<HTMLSelectElement>(null);
  const latest = useRef({ sending });
  latest.current = { sending };

  const open = (initialType: InquiryType) => {
    setType(initialType);
    setSent(false);
    setError("");
    setOpenType(initialType);
  };

  useBodyScrollLock(openType !== null);

  // Prefill from the profile (it loads after the page) without overwriting what was typed.
  useEffect(() => {
    if (!profile) return;
    setForm((prev) => ({
      ...prev,
      name: prev.name || profile.full_name || "",
      email: prev.email || profile.email || "",
      phone: prev.phone || profile.phone || "",
    }));
  }, [profile]);
  const close = () => {
    if (!latest.current.sending) setOpenType(null);
  };

  // /fahrzeuge/<slug>#probefahrt opens the test drive request right away, also when
  // only the hash changes on an already open detail page (no remount then).
  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === `#${TEST_DRIVE_HASH}`) open("test_drive");
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!openType) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    firstFieldRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [openType]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const { sendVehicleInquiry } = await import("@/app/actions/inquiries");
      const result = await sendVehicleInquiry({
        vehicleId,
        type,
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
        preferredDate: type === "test_drive" ? form.preferredDate : undefined,
        website: form.website,
      });
      if (!result.ok) {
        setError(result.error === "NOT_FOUND" ? t("vehicleUnavailable") : errorMessage(result));
        return;
      }
      setSent(true);
      setForm((prev) => ({ ...prev, message: "", preferredDate: "" }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const today = new Date();
  const maxDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  const set = (field: keyof typeof form) => (value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <>
      <Button
        type="button"
        onClick={() => open("general")}
        className="w-full py-3 text-lg"
      >
        {tCta("inquiry")}
      </Button>
      <Button
        type="button"
        variant="outline-primary"
        onClick={() => open("test_drive")}
        className="w-full py-3 text-lg font-semibold"
      >
        {tCta("testDrive")}
      </Button>

      {openType &&
        createPortal(
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={close} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-lg max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain rounded-t-lg sm:rounded-lg bg-card p-4 sm:p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 mb-1">
              <h2 id={titleId} className="text-xl font-bold text-foreground">
                {type === "test_drive" ? t("titleTestDrive") : t("titleGeneral")}
              </h2>
              <button
                type="button"
                onClick={close}
                disabled={sending}
                className="-mr-2 -mt-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                aria-label={t("close")}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{vehicleLabel}</p>

            {sent ? (
              <div className="text-center py-6" role="status">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" aria-hidden="true" />
                <p className="text-lg font-semibold text-foreground mb-2">{t("successTitle")}</p>
                <p className="text-muted-foreground">{t("successText")}</p>
                {isAuthenticated && (
                  <p className="text-muted-foreground mt-2">
                    {t("successDashboard")}{" "}
                    <Link href="/dashboard/anfragen" className="text-primary hover:underline font-medium">
                      {t("toMyInquiries")}
                    </Link>
                  </p>
                )}
                <Button type="button" variant="outline" onClick={close} className="mt-6">
                  {t("close")}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative space-y-4">
                <HoneypotField label={t("honeypot")} value={form.website} onChange={set("website")} />

                <div>
                  <label htmlFor={`${titleId}-type`} className="block text-sm font-semibold text-foreground mb-1">
                    {t("type")}
                  </label>
                  <select
                    id={`${titleId}-type`}
                    ref={firstFieldRef}
                    value={type}
                    onChange={(e) => setType(e.target.value as InquiryType)}
                    className={inputClass}
                  >
                    <option value="general">{t("typeGeneral")}</option>
                    <option value="test_drive">{t("typeTestDrive")}</option>
                  </select>
                </div>

                {type === "test_drive" && (
                  <div>
                    <label htmlFor={`${titleId}-date`} className="block text-sm font-semibold text-foreground mb-1">
                      {t("preferredDate")}
                    </label>
                    <input
                      id={`${titleId}-date`}
                      type="date"
                      required
                      min={toDateInputValue(today)}
                      max={toDateInputValue(maxDate)}
                      value={form.preferredDate}
                      onChange={(e) => set("preferredDate")(e.target.value)}
                      className={inputClass}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{t("preferredDateHint")}</p>
                  </div>
                )}

                <div>
                  <label htmlFor={`${titleId}-name`} className="block text-sm font-semibold text-foreground mb-1">
                    {tForms("fullName")}
                  </label>
                  <input
                    id={`${titleId}-name`}
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => set("name")(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor={`${titleId}-email`} className="block text-sm font-semibold text-foreground mb-1">
                    {tForms("email")}
                  </label>
                  <input
                    id={`${titleId}-email`}
                    type="email"
                    required
                    maxLength={100}
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set("email")(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor={`${titleId}-phone`} className="block text-sm font-semibold text-foreground mb-1">
                    {t("phoneOptional")}
                  </label>
                  <input
                    id={`${titleId}-phone`}
                    type="tel"
                    maxLength={30}
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => set("phone")(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor={`${titleId}-message`} className="block text-sm font-semibold text-foreground mb-1">
                    {type === "test_drive" ? t("messageOptional") : tForms("message")}
                  </label>
                  <textarea
                    id={`${titleId}-message`}
                    required={type === "general"}
                    rows={4}
                    maxLength={2000}
                    value={form.message}
                    onChange={(e) => set("message")(e.target.value)}
                    placeholder={t("messagePlaceholder")}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive-subtle/50 border border-destructive-border rounded-lg p-3" role="alert">
                    {error}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">{t("privacy")}</p>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
                  <Button type="button" variant="outline" onClick={close} disabled={sending}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={sending} >
                    {sending ? t("sending") : t("submit")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>,
          document.body
        )}
    </>
  );
}
