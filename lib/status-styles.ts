import { CheckCircle2, Hourglass, Inbox, Send, XCircle, type LucideIcon } from "lucide-react";

/**
 * One status-to-color mapping for customer and admin views. Every DB status maps
 * to a tone; the tone picks the Badge variant and the text color of counters.
 * Labels come from the helpers in lib/vehicle-labels.ts; this file only picks colors.
 */
export type StatusTone = "neutral" | "info" | "warning" | "success" | "destructive" | "highlight";

export type StatusKind = "submission" | "vehicle" | "tradeIn" | "inquiry" | "inquiryType";

const TONES: Record<StatusKind, Record<string, StatusTone>> = {
  // submitted_vehicles.status
  submission: {
    eingereicht: "info",
    in_bearbeitung: "warning",
    angebot_gesendet: "highlight",
    akzeptiert: "success",
    abgelehnt: "destructive",
  },
  // vehicles.status
  vehicle: {
    draft: "neutral",
    available: "success",
    reserved: "info",
    sold: "destructive",
  },
  // trade_in_requests.status
  tradeIn: {
    new: "info",
    reviewing: "warning",
    contact_made: "highlight",
    completed: "success",
    cancelled: "destructive",
  },
  // inquiries.status
  inquiry: {
    new: "info",
    read: "warning",
    responded: "success",
    closed: "neutral",
  },
  // inquiries.inquiry_type
  inquiryType: {
    test_drive: "highlight",
    contact: "neutral",
  },
};

export function getStatusTone(kind: StatusKind, status: string | null | undefined): StatusTone {
  return (status && TONES[kind][status]) || "neutral";
}

/** Text color for a counter or value in the status's tone (stat cards, offer amounts). */
export const TONE_TEXT: Record<StatusTone, string> = {
  neutral: "text-foreground",
  info: "text-info",
  warning: "text-warning",
  success: "text-success",
  destructive: "text-destructive",
  highlight: "text-highlight",
};

/** Subtle panel (background + border + text) in the status's tone. */
export const TONE_PANEL: Record<StatusTone, string> = {
  neutral: "bg-secondary border-border text-foreground",
  info: "bg-info-subtle/50 border-info-border text-info-subtle-foreground",
  warning: "bg-warning-subtle/50 border-warning-border text-warning-subtle-foreground",
  success: "bg-success-subtle/50 border-success-border text-success-subtle-foreground",
  destructive: "bg-destructive-subtle/50 border-destructive-border text-destructive-subtle-foreground",
  highlight: "bg-highlight-subtle/50 border-highlight-border text-highlight-subtle-foreground",
};

/** Icons for submission statuses (customer list, admin queue tabs and cards). */
const SUBMISSION_STATUS_ICONS: Record<string, LucideIcon> = {
  eingereicht: Inbox,
  in_bearbeitung: Hourglass,
  angebot_gesendet: Send,
  akzeptiert: CheckCircle2,
  abgelehnt: XCircle,
};

export function getStatusIcon(kind: StatusKind, status: string | null | undefined): LucideIcon | null {
  if (kind !== "submission" || !status) return null;
  return SUBMISSION_STATUS_ICONS[status] ?? null;
}
