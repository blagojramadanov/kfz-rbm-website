/**
 * Customer submission workflow (`submitted_vehicles.status`), shared by the admin
 * actions (authoritative) and the admin pages (which buttons to show).
 *
 *   eingereicht -> (admin sendOffer) -> angebot_gesendet -> (customer accepts) -> akzeptiert
 *                                                        -> (customer rejects) -> eingereicht
 *                                                           (offer_rejected_at set, offered_price kept)
 *   eingereicht / in_bearbeitung -> (admin rejects, with reason) -> abgelehnt
 *   akzeptiert -> (admin publishSubmittedVehicle, once) -> vehicle_id set, draft in `vehicles`
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
