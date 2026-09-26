/**
 * Customer submission workflow (`submitted_vehicles.status`), shared by the admin
 * actions (authoritative) and the admin pages (which buttons to show).
 *
 *   eingereicht -> (admin sendOffer) -> angebot_gesendet -> (customer accepts) -> akzeptiert
 *                                                        -> (customer rejects) -> eingereicht
 *   eingereicht / in_bearbeitung -> (admin rejects, with reason) -> abgelehnt
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
