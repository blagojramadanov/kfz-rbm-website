"use server";

import { z } from "zod";
import { ActionError, runAction, toErrorCode, type ActionErrorCode, type ActionResult } from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth-guards";
import { vehicleFieldsSchema, vehicleUpdateSchema } from "@/lib/vehicle-schema";
import {
  OFFERABLE_SUBMISSION_STATUSES,
  REJECTABLE_SUBMISSION_STATUSES,
  canPublishSubmission,
  getSourceTypeForSalesType,
} from "@/lib/submission-workflow";
import { copySubmissionPhotos } from "@/lib/submission-photos";
import { revalidateVehiclePages } from "@/lib/revalidate-vehicles";

// Helper function to log detailed error information for debugging
function logAdminError(operation: string, error: unknown, context?: Record<string, any>) {
  const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
  const errorCode = error instanceof Error && "code" in error ? (error as any).code : "unknown";
  const errorDetails = error instanceof Error && "details" in error ? (error as any).details : null;

  console.error(`[ADMIN_ERROR] ${operation}`, {
    message: errorMessage,
    code: errorCode,
    details: errorDetails,
    context,
    fullError: error,
  });

  return errorMessage;
}

// ============================================================================
// VEHICLE MANAGEMENT
// ============================================================================

/** Session + admin check that returns an error code instead of throwing. */
async function adminSession(): Promise<
  { ok: true; supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"] } | { ok: false; error: ActionErrorCode }
> {
  try {
    const { supabase } = await requireAdmin();
    return { ok: true, supabase };
  } catch (error) {
    return { ok: false, error: toErrorCode(error, "UNAUTHORIZED") };
  }
}

/** Removes every file of a vehicle from the public bucket. Best effort; returns false if something is left. */
async function removeVehicleFiles(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  vehicleId: string
): Promise<boolean> {
  const { data: files, error } = await supabase.storage.from("vehicle-images").list(vehicleId, { limit: 1000 });
  if (error) {
    console.error("[removeVehicleFiles] list:", error.message);
    return false;
  }
  if (!files?.length) return true;
  const { error: removeError } = await supabase.storage
    .from("vehicle-images")
    .remove(files.map((file) => `${vehicleId}/${file.name}`));
  if (removeError) console.error("[removeVehicleFiles] remove:", removeError.message);
  return !removeError;
}

/**
 * Creates a vehicle as **draft** (never public). The form uploads the photos with
 * uploadVehicleImage() and then calls publishVehicle(); if an upload fails it calls
 * discardDraftVehicle(), so no half-created vehicle goes live.
 */
export async function createVehicle(vehicleData: unknown): Promise<ActionResult<{ vehicleId: string }>> {
  const session = await adminSession();
  if (!session.ok) return session;
  const parsed = vehicleFieldsSchema.safeParse(vehicleData);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  const data = parsed.data;

  // role `authenticated` has no INSERT grant on vehicles, so the insert itself uses the
  // service-role client - only after the admin check above, with an explicit column list.
  const { getSupabaseAdminClient } = await import("@/lib/supabase-admin");
  const supabase = getSupabaseAdminClient();

  const { data: existingVehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("vin", data.vin)
    .maybeSingle();
  if (existingVehicle) return { ok: false, error: "DUPLICATE_VIN" };

  const { data: created, error } = await supabase
    .from("vehicles")
    .insert({
      vin: data.vin,
      brand: data.brand,
      model: data.model,
      year: data.year,
      mileage: data.mileage,
      price: data.price,
      transmission: data.transmission,
      fuel_type: data.fuel_type,
      body_type: data.body_type,
      color_exterior: data.color_exterior,
      color_interior: data.color_interior,
      engine_cc: data.engine_cc,
      power_hp: data.power_hp,
      description: data.description,
      status: "draft",
      source_type: "rbm",
      submitted_vehicle_id: null,
      listing_type: data.listing_type || "verkauf",
      zustand: data.zustand,
      zielland: data.zielland,
      export_notes: data.export_notes,
    })
    .select("id")
    .single();

  if (error || !created) {
    logAdminError("createVehicle", error);
    return { ok: false, error: "CREATE_FAILED" };
  }
  return { ok: true, vehicleId: created.id as string };
}

/** draft -> available, once all photos are uploaded. */
export async function publishVehicle(vehicleId: string): Promise<ActionResult> {
  const session = await adminSession();
  if (!session.ok) return session;
  if (!z.guid().safeParse(vehicleId).success) return { ok: false, error: "INVALID_INPUT" };

  const { data, error } = await session.supabase
    .from("vehicles")
    .update({ status: "available", updated_at: new Date().toISOString() })
    .eq("id", vehicleId)
    .eq("status", "draft")
    .select("id, brand, model");
  if (error) {
    logAdminError("publishVehicle", error, { vehicleId });
    return { ok: false, error: "UPDATE_FAILED" };
  }
  if (data?.length !== 1) return { ok: false, error: "INVALID_STATE" };
  revalidateVehiclePages(data[0]);
  return { ok: true };
}

/**
 * Rollback for a failed create: deletes a vehicle that is still a draft, together
 * with its photo rows and files. Refuses anything that is not a draft.
 */
export async function discardDraftVehicle(vehicleId: string): Promise<ActionResult> {
  const session = await adminSession();
  if (!session.ok) return session;
  if (!z.guid().safeParse(vehicleId).success) return { ok: false, error: "INVALID_INPUT" };

  const { data: vehicle } = await session.supabase
    .from("vehicles")
    .select("id, status")
    .eq("id", vehicleId)
    .maybeSingle();
  if (!vehicle) return { ok: false, error: "NOT_FOUND" };
  if (vehicle.status !== "draft") return { ok: false, error: "INVALID_STATE" };

  const filesRemoved = await removeVehicleFiles(session.supabase, vehicleId);
  const { data, error } = await session.supabase
    .from("vehicles")
    .delete()
    .eq("id", vehicleId)
    .eq("status", "draft")
    .select("id");
  if (error || data?.length !== 1) {
    logAdminError("discardDraftVehicle", error, { vehicleId });
    return { ok: false, error: "DELETE_FAILED" };
  }
  if (!filesRemoved) console.error("[discardDraftVehicle] vehicle deleted but files may remain under", vehicleId);
  return { ok: true };
}

export async function updateVehicle(vehicleId: string, updates: unknown): Promise<ActionResult> {
  const session = await adminSession();
  if (!session.ok) return session;
  const parsed = vehicleUpdateSchema.safeParse(updates);
  if (!z.guid().safeParse(vehicleId).success || !parsed.success) return { ok: false, error: "INVALID_INPUT" };

  // Old brand/model: a changed name changes the slug, and the old detail page must go too.
  const { data: before } = await session.supabase
    .from("vehicles")
    .select("id, brand, model")
    .eq("id", vehicleId)
    .maybeSingle();

  const { data, error } = await session.supabase
    .from("vehicles")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", vehicleId)
    .select("id, brand, model");

  if (error) {
    logAdminError("updateVehicle", error, { vehicleId });
    return { ok: false, error: error.code === "23505" ? "DUPLICATE_VIN" : "UPDATE_FAILED" };
  }
  if (data?.length !== 1) return { ok: false, error: "NOT_FOUND" };
  revalidateVehiclePages(before, data[0]);
  return { ok: true };
}

/** Deletes a vehicle, its image rows (FK cascade) and its files in the public bucket. */
export async function deleteVehicle(vehicleId: string): Promise<ActionResult> {
  const session = await adminSession();
  if (!session.ok) return session;
  if (!z.guid().safeParse(vehicleId).success) return { ok: false, error: "INVALID_INPUT" };

  const { data, error } = await session.supabase
    .from("vehicles")
    .delete()
    .eq("id", vehicleId)
    .select("id, brand, model");
  if (error) {
    logAdminError("deleteVehicle", error, { vehicleId });
    return { ok: false, error: "DELETE_FAILED" };
  }
  if (data?.length !== 1) return { ok: false, error: "NOT_FOUND" };
  revalidateVehiclePages(data[0]);

  // Row is gone; files are only cleanup (a leftover file is not visible anywhere).
  if (!(await removeVehicleFiles(session.supabase, vehicleId))) {
    console.error("[deleteVehicle] vehicle deleted but files may remain under", vehicleId);
  }
  return { ok: true };
}

/** Removes PostgREST filter syntax from a free-text search (used inside .or()). */
function searchTerm(value: string | undefined): string | null {
  const cleaned = (value ?? "").replace(/[,()*%\\]/g, " ").trim().slice(0, 100);
  return cleaned || null;
}

const guid = z.guid();

/** Value of an embedded `relation(count)` select: `[{ count: n }]`. */
function embeddedCount(value: unknown): number {
  const first = Array.isArray(value) ? value[0] : value;
  const count = first && typeof first === "object" ? (first as { count?: unknown }).count : 0;
  return typeof count === "number" ? count : 0;
}
const listFilterSchema = z
  .object({ status: z.string().max(40).optional(), search: z.string().max(200).optional() })
  .optional();

export async function getVehicles(filters?: { status?: string; search?: string }) {
  return runAction("getVehicles", "LOAD_FAILED", async () => {
    const { supabase } = await requireAdmin();
    const f = listFilterSchema.parse(filters);

    // favorites(count): admins read all favorites (RLS "Admins can view all favorites", migration 029).
    let query = supabase
      .from("vehicles")
      .select("*, favorites(count)")
      .order("created_at", { ascending: false });
    if (f?.status) query = query.eq("status", f.status);
    const term = searchTerm(f?.search);
    if (term) query = query.or(`brand.ilike.%${term}%,model.ilike.%${term}%,vin.ilike.%${term}%`);

    const { data, error } = await query;
    if (error) throw error;
    const vehicles = (data || []).map(({ favorites, ...vehicle }) => ({
      ...vehicle,
      favoriteCount: embeddedCount(favorites),
    }));
    return { vehicles };
  });
}

export async function getVehicleById(vehicleId: string) {
  return runAction("getVehicleById", "LOAD_FAILED", async () => {
    const { supabase } = await requireAdmin();
    if (!guid.safeParse(vehicleId).success) throw new ActionError("INVALID_INPUT");

    const { data: vehicle, error } = await supabase.from("vehicles").select("*").eq("id", vehicleId).maybeSingle();
    if (error) throw error;
    if (!vehicle) throw new ActionError("NOT_FOUND");

    const { data: images } = await supabase
      .from("vehicle_images")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("sort_order");

    // Separate from `vehicle`, which the edit form sends back as its update.
    const { count: favoriteCount, error: favoritesError } = await supabase
      .from("favorites")
      .select("id", { count: "exact", head: true })
      .eq("vehicle_id", vehicleId);
    if (favoritesError) logAdminError("getVehicleById favorites", favoritesError, { vehicleId });

    return { vehicle, images: images || [], favoriteCount: favoritesError ? null : favoriteCount ?? 0 };
  });
}

// ============================================================================
// SUBMITTED VEHICLES MANAGEMENT
// ============================================================================

export async function getSubmittedVehicles(filters?: { status?: string; search?: string }) {
  return runAction("getSubmittedVehicles", "LOAD_FAILED", async () => {
    const { supabase } = await requireAdmin();
    const f = listFilterSchema.parse(filters);

    let query = supabase
      .from("submitted_vehicles")
      .select(
        `
        id,
        user_id,
        brand,
        model,
        year,
        mileage,
        price,
        transmission,
        fuel_type,
        body_type,
        color,
        power_hp,
        description,
        status,
        status_reason,
        rejection_reason,
        sales_type,
        commission,
        offered_price,
        offer_terms,
        offered_at,
        offer_accepted_at,
        offer_rejected_at,
        created_at,
        updated_at,
        vehicle_id,
        approved_at,
        approved_by,
        approver_name,
        approval_notes,
        user:user_id (id, email, full_name, phone)
      `
      )
      .order("created_at", { ascending: false });

    if (f?.status) query = query.eq("status", f.status);
    const term = searchTerm(f?.search);
    if (term) query = query.or(`brand.ilike.%${term}%,model.ilike.%${term}%`);

    const { data, error } = await query;
    if (error) throw error;

    const vehicles = await Promise.all(
      (data || []).map(async (vehicle) => {
        const { data: images } = await supabase
          .from("submitted_vehicle_images")
          .select("image_url")
          .eq("submitted_vehicle_id", vehicle.id)
          .order("sort_order", { ascending: true });
        return { ...vehicle, images: images?.map((img) => img.image_url) || [] };
      })
    );
    return { vehicles };
  });
}

/**
 * Sends (or corrects) a price offer: sets offered_price/offer_terms and the status
 * "angebot_gesendet". The customer answers with acceptOffer/rejectOffer
 * (app/actions/vehicles.ts). Workflow: lib/submission-workflow.ts.
 */
export async function sendOffer(vehicleId: string, offeredPrice: number, offerTerms?: string) {
  return runAction("sendOffer", "UPDATE_FAILED", async () => {
    const { supabase } = await requireAdmin();
    const input = z
      .object({
        id: z.guid(),
        // The customer page only offers accept/reject for a positive price.
        price: z.number().positive().max(100_000_000),
        terms: z.string().trim().max(5000).optional(),
      })
      .safeParse({ id: vehicleId, price: offeredPrice, terms: offerTerms });
    if (!input.success) throw new ActionError("INVALID_INPUT");

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("submitted_vehicles")
      .update({
        status: "angebot_gesendet",
        offered_price: input.data.price,
        offered_at: now,
        offer_terms: input.data.terms || null,
        updated_at: now,
      })
      .eq("id", input.data.id)
      .in("status", [...OFFERABLE_SUBMISSION_STATUSES])
      .select("id");
    if (error) throw error;
    if (data?.length !== 1) throw new ActionError("INVALID_STATE");
    return {};
  });
}

export async function rejectSubmittedVehicle(vehicleId: string, reason: string) {
  return runAction("rejectSubmittedVehicle", "UPDATE_FAILED", async () => {
    const { supabase } = await requireAdmin();
    const input = z
      .object({ id: z.guid(), reason: z.string().trim().min(1).max(2000) })
      .safeParse({ id: vehicleId, reason });
    if (!input.success) throw new ActionError("INVALID_INPUT");

    const { data, error } = await supabase
      .from("submitted_vehicles")
      .update({ status: "abgelehnt", rejection_reason: input.data.reason, updated_at: new Date().toISOString() })
      .eq("id", input.data.id)
      .in("status", [...REJECTABLE_SUBMISSION_STATUSES])
      .select("id");
    if (error) throw error;
    if (data?.length !== 1) throw new ActionError("INVALID_STATE");
    return {};
  });
}

// ============================================================================
// INQUIRIES MANAGEMENT
// ============================================================================

const INQUIRY_STATUSES = ["new", "read", "responded", "closed"] as const;

/** "vehicle" = asked from a vehicle page (general, test_drive, part_exchange), "contact" = /contact form. */
const INQUIRY_CATEGORIES = ["vehicle", "contact"] as const;
export type InquiryCategory = (typeof INQUIRY_CATEGORIES)[number];

const inquiryFilterSchema = z
  .object({ status: z.enum(INQUIRY_STATUSES).optional(), category: z.enum(INQUIRY_CATEGORIES).optional() })
  .optional();

export async function getInquiries(filters?: { status?: string; category?: InquiryCategory }) {
  return runAction("getInquiries", "LOAD_FAILED", async () => {
    const { supabase } = await requireAdmin();
    const parsed = inquiryFilterSchema.safeParse(filters);
    if (!parsed.success) throw new ActionError("INVALID_INPUT");
    const f = parsed.data;

    let query = supabase
      .from("customer_inquiries")
      .select(
        `
        *,
        vehicle:vehicle_id (id, brand, model, year, price)
      `
      )
      .order("created_at", { ascending: false });
    if (f?.status) query = query.eq("status", f.status);
    if (f?.category === "contact") query = query.eq("inquiry_type", "contact");
    if (f?.category === "vehicle") query = query.neq("inquiry_type", "contact");

    const { data, error } = await query;
    if (error) throw error;
    return { inquiries: data || [] };
  });
}

export async function updateInquiryStatus(inquiryId: string, status: string) {
  return runAction("updateInquiryStatus", "UPDATE_FAILED", async () => {
    const { supabase } = await requireAdmin();
    const input = z.object({ id: z.guid(), status: z.enum(INQUIRY_STATUSES) }).safeParse({ id: inquiryId, status });
    if (!input.success) throw new ActionError("INVALID_INPUT");

    const { error } = await supabase
      .from("customer_inquiries")
      .update({ status: input.data.status, updated_at: new Date().toISOString() })
      .eq("id", input.data.id);
    if (error) throw error;
    return {};
  });
}

// ============================================================================
// TRADE-IN REQUESTS MANAGEMENT
// ============================================================================

const TRADE_IN_STATUSES = ["new", "reviewing", "contact_made", "completed", "cancelled"] as const;

export async function getTradeInRequests(filters?: { status?: string }) {
  return runAction("getTradeInRequests", "LOAD_FAILED", async () => {
    const { supabase } = await requireAdmin();
    const f = listFilterSchema.parse(filters);

    let query = supabase
      .from("trade_in_requests")
      .select(
        `
        *,
        user:user_id (id, email, full_name),
        desired_vehicle:desired_vehicle_id (id, brand, model, year, mileage, price, transmission, fuel_type, body_type, color_exterior, description)
      `
      )
      .order("created_at", { ascending: false });
    if (f?.status) query = query.eq("status", f.status);

    const { data, error } = await query;
    if (error) throw error;
    return { requests: data || [] };
  });
}

export async function updateTradeInRequest(requestId: string, updates: { status?: string; admin_notes?: string }) {
  return runAction("updateTradeInRequest", "UPDATE_FAILED", async () => {
    const { supabase } = await requireAdmin();
    const input = z
      .object({
        id: z.guid(),
        status: z.enum(TRADE_IN_STATUSES).optional(),
        admin_notes: z.string().max(5000).optional(),
      })
      .safeParse({ id: requestId, ...updates });
    if (!input.success) throw new ActionError("INVALID_INPUT");
    const { id, ...fields } = input.data;

    const { error } = await supabase
      .from("trade_in_requests")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    return {};
  });
}

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================

export async function getDashboardStats() {
  return runAction("getDashboardStats", "LOAD_FAILED", async () => {
    const { supabase } = await requireAdmin();

    const countBy = async (table: string, statuses: readonly string[]) => {
      const counts: Record<string, number> = {};
      for (const status of statuses) {
        const { count } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true })
          .eq("status", status);
        counts[status] = count || 0;
      }
      return counts;
    };

    const vehicleCounts = await countBy("vehicles", ["draft", "available", "reserved", "sold"]);
    const submittedCounts = await countBy("submitted_vehicles", ["eingereicht", "in_bearbeitung", "angebot_gesendet", "akzeptiert", "abgelehnt"]);
    const inquiryCounts = await countBy("customer_inquiries", INQUIRY_STATUSES);
    const tradeInCounts = await countBy("trade_in_requests", TRADE_IN_STATUSES);

    const { count: totalCustomers } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "CUSTOMER");

    const { data: availablePrices } = await supabase.from("vehicles").select("price").eq("status", "available");
    const prices = (availablePrices || []).map((row) => Number(row.price)).filter((price) => price > 0);
    const avgVehiclePrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

    const sum = (counts: Record<string, number>) => Object.values(counts).reduce((a, b) => a + b, 0);
    return {
      stats: {
        total_vehicles: sum(vehicleCounts),
        vehicles_draft: vehicleCounts.draft,
        vehicles_available: vehicleCounts.available,
        vehicles_reserved: vehicleCounts.reserved,
        vehicles_sold: vehicleCounts.sold,
        total_submitted_vehicles: sum(submittedCounts),
        submitted_vehicles_eingereicht: submittedCounts.eingereicht,
        submitted_vehicles_in_bearbeitung: submittedCounts.in_bearbeitung,
        submitted_vehicles_angebot_gesendet: submittedCounts.angebot_gesendet,
        submitted_vehicles_akzeptiert: submittedCounts.akzeptiert,
        submitted_vehicles_abgelehnt: submittedCounts.abgelehnt,
        inquiries_new: inquiryCounts.new,
        inquiries_read: inquiryCounts.read,
        inquiries_responded: inquiryCounts.responded,
        inquiries_closed: inquiryCounts.closed,
        trade_in_requests_new: tradeInCounts.new,
        trade_in_requests_reviewing: tradeInCounts.reviewing,
        trade_in_requests_contact_made: tradeInCounts.contact_made,
        trade_in_requests_completed: tradeInCounts.completed,
        trade_in_requests_cancelled: tradeInCounts.cancelled,
        total_customers: totalCustomers || 0,
        avg_vehicle_price: avgVehiclePrice,
      },
    };
  });
}

// ============================================================================
// CUSTOMER MANAGEMENT
// ============================================================================

export async function getCustomers() {
  return runAction("getCustomers", "LOAD_FAILED", async () => {
    const { supabase } = await requireAdmin();
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("role", "CUSTOMER")
      .order("created_at", { ascending: false });
    if (error) throw error;

    // Per-customer counts for the list columns (same matching as getCustomerDetails).
    const [{ data: vehicles }, { data: inquiries }, { data: tradeIns }] = await Promise.all([
      supabase.from("submitted_vehicles").select("user_id"),
      supabase.from("customer_inquiries").select("user_id, customer_email"),
      supabase.from("trade_in_requests").select("user_id"),
    ]);
    const tally = (values: (string | null)[]) => {
      const counts = new Map<string, number>();
      for (const value of values) if (value) counts.set(value, (counts.get(value) || 0) + 1);
      return counts;
    };
    const vehicleCounts = tally((vehicles || []).map((row) => row.user_id));
    // An inquiry belongs to a customer by user_id (sent while logged in) or, for guest
    // inquiries, by the same email address (compared case-insensitively).
    const inquiryCounts = tally((inquiries || []).map((row) => row.user_id));
    const guestInquiryCounts = tally(
      (inquiries || []).filter((row) => !row.user_id).map((row) => row.customer_email?.toLowerCase() ?? null)
    );
    const tradeInCounts = tally((tradeIns || []).map((row) => row.user_id));

    return {
      customers: (data || []).map((customer) => ({
        ...customer,
        submitted_vehicles_count: vehicleCounts.get(customer.id) || 0,
        inquiries_count:
          (inquiryCounts.get(customer.id) || 0) + (guestInquiryCounts.get(customer.email?.toLowerCase()) || 0),
        trade_in_requests_count: tradeInCounts.get(customer.id) || 0,
      })),
    };
  });
}

/** Escapes LIKE wildcards so ilike() compares the whole value, case-insensitively. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export async function getCustomerDetails(customerId: string) {
  return runAction("getCustomerDetails", "LOAD_FAILED", async () => {
    const { supabase } = await requireAdmin();
    if (!guid.safeParse(customerId).success) throw new ActionError("INVALID_INPUT");

    const { data: customer, error } = await supabase.from("user_profiles").select("*").eq("id", customerId).maybeSingle();
    if (error) throw error;
    if (!customer) throw new ActionError("NOT_FOUND");

    const { data: vehicles } = await supabase.from("submitted_vehicles").select("*").eq("user_id", customerId);
    // Same matching as getCustomers(): by user_id, or guest inquiries with the same email.
    const [{ data: ownInquiries }, { data: guestInquiries }] = await Promise.all([
      supabase.from("customer_inquiries").select("*").eq("user_id", customerId),
      supabase.from("customer_inquiries").select("*").is("user_id", null).ilike("customer_email", escapeLike(customer.email)),
    ]);
    const inquiries = [...(ownInquiries || []), ...(guestInquiries || [])].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
    const { data: tradeIns } = await supabase.from("trade_in_requests").select("*").eq("user_id", customerId);

    return { customer, vehicles: vehicles || [], inquiries: inquiries || [], tradeIns: tradeIns || [] };
  });
}

export async function getSubmittedVehicleById(submittedVehicleId: string) {
  return runAction("getSubmittedVehicleById", "LOAD_FAILED", async () => {
    const { supabase } = await requireAdmin();
    if (!guid.safeParse(submittedVehicleId).success) throw new ActionError("INVALID_INPUT");

    const { data: vehicle, error } = await supabase
      .from("submitted_vehicles")
      .select("*, user:user_id (id, email, full_name, phone)")
      .eq("id", submittedVehicleId)
      .maybeSingle();
    if (error) throw error;
    if (!vehicle) throw new ActionError("NOT_FOUND");

    const { data: images } = await supabase
      .from("submitted_vehicle_images")
      .select("image_url")
      .eq("submitted_vehicle_id", submittedVehicleId)
      .order("sort_order", { ascending: true });

    return { vehicle: { ...vehicle, images: images?.map((img) => img.image_url) || [] } };
  });
}

const publishSubmissionSchema = z.object({
  id: z.guid(),
  options: z.object({
    // Required and entered by the admin; never taken from the customer's asking price.
    price: z.number().positive().max(99_999_999),
    description: z.string().max(10_000).optional(),
    featured: z.boolean().optional(),
    // "draft": not public yet; "available": listed right away.
    status: z.enum(["draft", "available"]).default("draft"),
  }),
});

/**
 * Copies an accepted customer submission into `vehicles`, including its photos and
 * wizard details. The source follows the sale type (consignment = customer vehicle,
 * direct sale / trade-in = RBM vehicle). The vehicle is created as draft and only
 * switched to "available" (if requested) once all photos are copied; if a photo
 * fails, the vehicle and its copied files are removed again and nothing is linked.
 */
export async function publishSubmittedVehicle(submittedVehicleId: string, options: unknown) {
  return runAction("publishSubmittedVehicle", "CREATE_FAILED", async () => {
    await requireAdmin();
    const input = publishSubmissionSchema.safeParse({ id: submittedVehicleId, options });
    if (!input.success) throw new ActionError("INVALID_INPUT");
    const { id: submissionId, options: o } = input.data;

    const { getSupabaseAdminClient } = await import("@/lib/supabase-admin");
    const supabase = getSupabaseAdminClient();

    const { data: submittedVehicle } = await supabase
      .from("submitted_vehicles")
      .select("*")
      .eq("id", submissionId)
      .maybeSingle();
    if (!submittedVehicle) throw new ActionError("NOT_FOUND");
    // Only an offer the customer accepted is published, and only once.
    if (!canPublishSubmission(submittedVehicle)) throw new ActionError("INVALID_STATE");
    const sourceType = getSourceTypeForSalesType(submittedVehicle.sales_type);
    if (!sourceType) throw new ActionError("INVALID_STATE");

    // Generate a 17-character VIN (standard VIN length) from the submitted vehicle ID.
    // Format: SUBM + first 13 alphanumeric characters of the UUID (VINs are always 17 chars)
    const vinId = submissionId.replace(/-/g, "").substring(0, 13).toUpperCase();
    const generatedVin = `SUBM${vinId}`;

    const { data: newVehicle, error: createError } = await supabase
      .from("vehicles")
      .insert({
        vin: generatedVin,
        brand: submittedVehicle.brand,
        model: submittedVehicle.model,
        year: submittedVehicle.year,
        mileage: submittedVehicle.mileage,
        price: o.price,
        fuel_type: submittedVehicle.fuel_type,
        transmission: submittedVehicle.transmission,
        color_exterior: submittedVehicle.color,
        description: o.description ?? submittedVehicle.description,
        body_type: submittedVehicle.body_type,
        power_hp: submittedVehicle.power_hp,
        variant: submittedVehicle.variant ?? null,
        previous_owners: submittedVehicle.previous_owners ?? null,
        hu_au: submittedVehicle.hu_au ?? null,
        accident_history: submittedVehicle.accident_history ?? null,
        service_book: submittedVehicle.service_book ?? null,
        // Draft until the photos are in place, so it is never public without them.
        status: "draft",
        featured: o.featured ?? false,
        source_type: sourceType,
        submitted_vehicle_id: submissionId,
      })
      .select("id")
      .single();
    if (createError || !newVehicle) throw createError ?? new ActionError("CREATE_FAILED");
    const vehicleId = newVehicle.id as string;

    const discard = async (uploadedPaths: string[]) => {
      if (uploadedPaths.length > 0) {
        const { error } = await supabase.storage.from("vehicle-images").remove(uploadedPaths);
        if (error) console.error("[publishSubmittedVehicle] cleanup files:", error.message);
      }
      const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);
      if (error) console.error("[publishSubmittedVehicle] cleanup vehicle:", error.message);
    };

    let photos: Awaited<ReturnType<typeof copySubmissionPhotos>>;
    try {
      photos = await copySubmissionPhotos(supabase, submissionId, vehicleId);
    } catch (error) {
      console.error("[publishSubmittedVehicle] photos:", error);
      await discard([]);
      throw new ActionError("UPLOAD_FAILED");
    }
    if (photos.failed.length > 0) {
      await discard(photos.uploadedPaths);
      throw new ActionError("UPLOAD_FAILED");
    }

    // Links the submission to the new vehicle, which also blocks a second publish
    // (conditional, so two admins publishing at once cannot both succeed).
    const { data: linked, error: linkError } = await supabase
      .from("submitted_vehicles")
      .update({ vehicle_id: vehicleId, updated_at: new Date().toISOString() })
      .eq("id", submissionId)
      .is("vehicle_id", null)
      .select("id");
    if (linkError || !linked || linked.length !== 1) {
      if (linkError) console.error("[publishSubmittedVehicle] link vehicle_id:", linkError);
      await discard(photos.uploadedPaths);
      throw new ActionError("INVALID_STATE");
    }

    let status: "draft" | "available" = "draft";
    if (o.status === "available") {
      const { error: statusError } = await supabase
        .from("vehicles")
        .update({ status: "available", updated_at: new Date().toISOString() })
        .eq("id", vehicleId);
      // The vehicle stays a (linked) draft; the admin can publish it from the vehicle page.
      if (statusError) console.error("[publishSubmittedVehicle] set available:", statusError);
      else status = "available";
    }
    if (status === "available") {
      revalidateVehiclePages({ id: vehicleId, brand: submittedVehicle.brand, model: submittedVehicle.model });
    }

    return { vehicleId, status };
  });
}
