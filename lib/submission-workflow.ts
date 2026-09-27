/**
 * Customer submission workflow (`submitted_vehicles.status`), shared by the admin
 * actions (authoritative) and the admin pages (which buttons to show).
 *
 *   eingereicht -> (admin sendOffer) -> angebot_gesendet -> (customer accepts) -> akzeptiert
 *                                                        -> (customer rejects) -> eingereicht
 *                                                           (offer_rejected_at set, offered_price kept)
 *   eingereicht / in_bearbeitung -> (admin rejects, with reason) -> abgelehnt
 *   akzeptiert -> (admin publishSubmittedVehicle, once) -> vehicle_id set, vehicle in `vehicles`
 *                 (draft or available, as the admin chooses; photos copied)
 */

/** Statuses in which an admin may send (or correct) a price offer. */
export const OFFERABLE_SUBMISSION_STATUSES = ["eingereicht", "in_bearbeitung", "angebot_gesendet"] as const;

/** Statuses in which an admin may still reject a submission. */
export const REJECTABLE_SUBMISSION_STATUSES = ["eingereicht", "in_bearbeitung"] as const;

export function canSendOffer(status: string): boolean {
  return (OFFERABLE_SUBMISSION_STATUSES as readonly string[]).includes(status);
}

export function canRejectSubmission(status: string): boolean {
  return (REJECTABLE_SUBMISSION_STATUSES as readonly string[]).includes(status);
}

/** An accepted offer can be published into the inventory once (vehicle_id is set on publish). */
export function canPublishSubmission(submission: { status: string; vehicle_id?: string | null }): boolean {
  return submission.status === "akzeptiert" && !submission.vehicle_id;
}

/**
 * `vehicles.source_type` for a published submission, from its `sales_type`.
 * Direct sale and trade-in: RBM buys the car ("rbm"). Consignment: the car still
 * belongs to the customer ("customer"). An empty value is the DB default (direct
 * sale). Any other value returns null, so the caller refuses to guess the owner.
 */
const RBM_SALES_TYPES = ["direct", "tradeIn", "Direktverkauf", "Direktverkauf an KFZ RBM", "Inzahlungnahme"];
const CUSTOMER_SALES_TYPES = ["consignment", "Verkauf im Kundenauftrag"];

export function getSourceTypeForSalesType(salesType: string | null | undefined): "rbm" | "customer" | null {
  const value = salesType?.trim() ?? "";
  if (value === "" || RBM_SALES_TYPES.includes(value)) return "rbm";
  if (CUSTOMER_SALES_TYPES.includes(value)) return "customer";
  return null;
}

/**
 * The price of the offer the customer declined, while the submission is back in the
 * admin's queue. rejectOffer keeps offered_price and sets offer_rejected_at; the next
 * sendOffer overwrites the price and moves the status on, so no extra column is needed.
 */
export function getDeclinedOfferPrice(submission: {
  status: string;
  offered_price?: number | string | null;
  offered_at?: string | null;
  offer_rejected_at?: string | null;
}): number | null {
  if (!(REJECTABLE_SUBMISSION_STATUSES as readonly string[]).includes(submission.status)) return null;
  if (!submission.offer_rejected_at) return null;
  if (submission.offered_at && Date.parse(submission.offered_at) > Date.parse(submission.offer_rejected_at)) return null;
  const price = Number(submission.offered_price);
  return price > 0 ? price : null;
}
