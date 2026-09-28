"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X, Mail, Phone } from "lucide-react";
import { useErrorMessage } from "@/lib/use-error-message";
import { useLocaleFormatter } from "@/lib/use-locale-formatter";
import { formatPrice } from "@/lib/format-vehicle";
import { canRejectSubmission, canSendOffer, getDeclinedOfferPrice } from "@/lib/submission-workflow";

/**
 * Admin building blocks shared by the submissions list and the submission detail page
 * (app/[locale]/admin/fahrzeuge/eingereicht). The server actions stay authoritative;
 * these only decide which controls to show.
 */

export interface SubmissionActionTarget {
  id: string;
  status: string;
  price?: number | null;
  offered_price?: number | null;
  offer_terms?: string | null;
}

/** Fields changed by an action, for the caller's local state. */
export interface SubmissionPatch {
  status: string;
  offered_price?: number;
  offer_terms?: string | null;
  offered_at?: string;
  rejection_reason?: string;
}

/** Angebot senden / Angebot ändern / Ablehnen, with their inline forms. */
export function SubmissionActions({
  vehicle,
  onChange,
}: {
  vehicle: SubmissionActionTarget;
  onChange: (patch: SubmissionPatch) => void;
}) {
  const t = useTranslations("admin.submissions");
  const tCommon = useTranslations("common");
  const tButtons = useTranslations("buttons");
  const errorMessage = useErrorMessage();
  const [mode, setMode] = useState<"offer" | "reject" | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerTerms, setOfferTerms] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const offerable = canSendOffer(vehicle.status);
  const rejectable = canRejectSubmission(vehicle.status);
  if (!offerable && !rejectable) return null;

  const toggleOffer = () => {
    setError("");
    if (mode === "offer") {
      setMode(null);
      return;
    }
    // Prefill with the current offer, else the customer's asking price.
    const prefill = vehicle.offered_price ?? vehicle.price;
    setOfferPrice(prefill != null && Number(prefill) > 0 ? String(prefill) : "");
    setOfferTerms(vehicle.offer_terms ?? "");
    setMode("offer");
  };

  const toggleReject = () => {
    setError("");
    setMode(mode === "reject" ? null : "reject");
  };

  const handleSendOffer = async () => {
    const price = Number(offerPrice);
    if (!offerPrice.trim() || !Number.isFinite(price) || price <= 0) {
      setError(t("offerPriceRequired"));
      return;
    }
    try {
      setBusy(true);
      const { sendOffer } = await import("@/app/actions/admin");
      const terms = offerTerms.trim() || null;
      const result = await sendOffer(vehicle.id, price, terms ?? undefined);
      if (!result.ok) {
        setError(errorMessage(result));
        return;
      }
      setMode(null);
      setError("");
      onChange({ status: "angebot_gesendet", offered_price: price, offer_terms: terms, offered_at: new Date().toISOString() });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    const reason = rejectReason.trim();
    if (!reason) {
      setError(t("rejectReasonRequired"));
      return;
    }
    try {
      setBusy(true);
      const { rejectSubmittedVehicle } = await import("@/app/actions/admin");
      const result = await rejectSubmittedVehicle(vehicle.id, reason);
      if (!result.ok) {
        setError(errorMessage(result));
        return;
      }
      setMode(null);
      setRejectReason("");
      setError("");
      onChange({ status: "abgelehnt", rejection_reason: reason });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {offerable && (
          <button
            onClick={toggleOffer}
            disabled={busy}
            className="min-h-11 flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-success hover:bg-success-hover text-primary-foreground rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            {vehicle.status === "angebot_gesendet" ? t("updateOffer") : t("sendOffer")}
          </button>
        )}
        {rejectable && (
          <button
            onClick={toggleReject}
            disabled={busy}
            className="min-h-11 flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-destructive-border text-destructive hover:bg-destructive-subtle/50 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
            {t("reject")}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {mode === "offer" && (
        <div className="pt-3 border-t border-border space-y-2">
          <label className="block text-xs font-medium text-foreground">
            {t("offerPriceLabel")}
            <input
              type="number"
              min="1"
              step="1"
              inputMode="decimal"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              className="field mt-1 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-foreground">
            {t("offerTermsLabel")}
            <textarea
              value={offerTerms}
              onChange={(e) => setOfferTerms(e.target.value)}
              placeholder={t("offerTermsPlaceholder")}
              rows={2}
              maxLength={5000}
              className="field mt-1 text-sm resize-none"
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleSendOffer}
              disabled={busy || !offerPrice.trim()}
              className="min-h-11 flex-1 px-3 py-2 bg-success hover:bg-success-hover text-primary-foreground rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "..." : t("confirmOffer")}
            </button>
            <button
              onClick={() => setMode(null)}
              className="min-h-11 flex-1 px-3 py-2 border border-input text-foreground hover:bg-muted rounded-lg font-medium text-sm transition-colors"
            >
              {tButtons("cancel")}
            </button>
          </div>
        </div>
      )}

      {mode === "reject" && (
        <div className="pt-3 border-t border-border">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t("rejectReasonPlaceholder")}
            rows={2}
            maxLength={2000}
            className="field text-sm resize-none"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleReject}
              disabled={busy || !rejectReason.trim()}
              className="min-h-11 flex-1 px-3 py-2 bg-destructive hover:bg-destructive-hover text-primary-foreground rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tCommon("confirm")}
            </button>
            <button
              onClick={() => {
                setMode(null);
                setRejectReason("");
              }}
              className="min-h-11 flex-1 px-3 py-2 border border-input text-foreground hover:bg-muted rounded-lg font-medium text-sm transition-colors"
            >
              {tButtons("cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** "Kunde hat Angebot über X € abgelehnt" while a declined submission is back in the queue. */
export function DeclinedOfferBadge({
  vehicle,
}: {
  vehicle: { status: string; offered_price?: number | null; offered_at?: string | null; offer_rejected_at?: string | null };
}) {
  const t = useTranslations("admin.submissions");
  const format = useLocaleFormatter();
  const declinedPrice = getDeclinedOfferPrice(vehicle);
  if (declinedPrice == null || !vehicle.offer_rejected_at) return null;
  return (
    <div className="inline-flex flex-col rounded-md border border-warning-border bg-warning-subtle/50 px-3 py-2 text-xs text-warning-subtle-foreground">
      <span className="font-semibold">{t("customerDeclinedOffer", { price: formatPrice(format, declinedPrice) })}</span>
      <span>
        {t("customerDeclinedOn", {
          date: format.dateTime(new Date(vehicle.offer_rejected_at), { day: "2-digit", month: "2-digit", year: "numeric" }),
        })}
      </span>
    </div>
  );
}

/** Customer name, email and phone as links. */
export function SubmissionCustomer({
  user,
}: {
  user?: { full_name?: string | null; email?: string | null; phone?: string | null } | null;
}) {
  if (!user) return null;
  return (
    <div className="space-y-0.5">
      {user.full_name && <p className="font-medium text-foreground">{user.full_name}</p>}
      {user.email && (
        <a href={`mailto:${user.email}`} className="flex items-center gap-1.5 hover:text-primary break-all">
          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
          {user.email}
        </a>
      )}
      {user.phone && (
        <a href={`tel:${user.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-1.5 hover:text-primary">
          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
          {user.phone}
        </a>
      )}
    </div>
  );
}
