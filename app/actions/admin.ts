"use server";

import { z } from "zod";
import { toErrorCode, type ActionErrorCode, type ActionResult } from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth-guards";
import { getSupabaseServerClient } from "@/lib/supabase-server";

// Verifies (server-side, from the session + user_profiles.role) that the caller is an admin.
// Every action in this file must call it first: server actions are public endpoints.
async function verifyAdminRole() {
  await requireAdmin();
  return true;
}

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

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();
const optionalInt = (max: number) => z.number().int().min(0).max(max).optional().nullable();

// Columns an admin may set from the vehicle forms. Anything else (id, source_type,
// submitted_vehicle_id, created_at, ...) is stripped.
const vehicleFieldsSchema = z.object({
  vin: z.string().trim().min(1).max(17),
  brand: z.string().trim().min(1).max(50),
  model: z.string().trim().min(1).max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  mileage: z.number().int().min(0).max(5_000_000),
  price: z.number().min(0).max(100_000_000),
  transmission: optionalText(20),
  fuel_type: optionalText(20),
  body_type: optionalText(30),
  color_exterior: optionalText(50),
  color_interior: optionalText(50),
  engine_cc: optionalInt(20_000),
  power_hp: optionalInt(5_000),
  description: optionalText(10_000),
  listing_type: z.enum(["verkauf", "export"]).optional(),
  zustand: optionalText(30),
  zielland: optionalText(100),
  export_notes: optionalText(5_000),
});
const vehicleUpdateSchema = vehicleFieldsSchema.partial().extend({
  status: z.enum(["draft", "available", "sold", "reserved"]).optional(),
  featured: z.boolean().optional(),
});

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
    .select("id");
  if (error) {
    logAdminError("publishVehicle", error, { vehicleId });
    return { ok: false, error: "UPDATE_FAILED" };
  }
  return data?.length === 1 ? { ok: true } : { ok: false, error: "INVALID_STATE" };
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

  const { data, error } = await session.supabase
    .from("vehicles")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", vehicleId)
    .select("id");

  if (error) {
    logAdminError("updateVehicle", error, { vehicleId });
    return { ok: false, error: error.code === "23505" ? "DUPLICATE_VIN" : "UPDATE_FAILED" };
  }
  return data?.length === 1 ? { ok: true } : { ok: false, error: "NOT_FOUND" };
}

/** Deletes a vehicle, its image rows (FK cascade) and its files in the public bucket. */
export async function deleteVehicle(vehicleId: string): Promise<ActionResult> {
  const session = await adminSession();
  if (!session.ok) return session;
  if (!z.guid().safeParse(vehicleId).success) return { ok: false, error: "INVALID_INPUT" };

  const { data, error } = await session.supabase.from("vehicles").delete().eq("id", vehicleId).select("id");
  if (error) {
    logAdminError("deleteVehicle", error, { vehicleId });
    return { ok: false, error: "DELETE_FAILED" };
  }
  if (data?.length !== 1) return { ok: false, error: "NOT_FOUND" };

  // Row is gone; files are only cleanup (a leftover file is not visible anywhere).
  if (!(await removeVehicleFiles(session.supabase, vehicleId))) {
    console.error("[deleteVehicle] vehicle deleted but files may remain under", vehicleId);
  }
  return { ok: true };
}

export async function getVehicles(
  filters?: {
    status?: string;
    search?: string;
  }
) {
  try {
    await verifyAdminRole();
    const { supabase } = await getSupabaseServerClient();

    let query = supabase.from("vehicles").select("*").order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.search) {
      query = query.or(
        `brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,vin.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    throw new Error(error instanceof Error ? error.message : "Fehler beim Abrufen der Fahrzeuge");
  }
}

export async function getVehicleById(vehicleId: string) {
  try {
    await verifyAdminRole();
    const { supabase } = await getSupabaseServerClient();

    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", vehicleId)
      .single();

    if (vehicleError) throw vehicleError;

    const { data: images } = await supabase
      .from("vehicle_images")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("sort_order");

    return { vehicle, images: images || [] };
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    throw new Error(error instanceof Error ? error.message : "Fahrzeug nicht gefunden");
  }
}

// ============================================================================
// SUBMITTED VEHICLES MANAGEMENT
// ============================================================================

export async function getSubmittedVehicles(
  filters?: {
    status?: string;
    search?: string;
  }
) {
  try {
    await verifyAdminRole();
    const { supabase } = await getSupabaseServerClient();

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
        created_at,
        updated_at,
        vehicle_id,
        approved_at,
        approved_by,
        approver_name,
        approval_notes,
        user:user_id (id, email, full_name)
      `
      )
      .order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.search) {
      query = query.or(
        `brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching submitted vehicles:", error);
      throw error;
    }

    // Fetch images for each vehicle
    const vehiclesWithImages = await Promise.all(
      (data || []).map(async (vehicle) => {
        const { data: images } = await supabase
          .from("submitted_vehicle_images")
          .select("image_url")
          .eq("submitted_vehicle_id", vehicle.id)
          .order("sort_order", { ascending: true });

        return {
          ...vehicle,
          images: images?.map((img) => img.image_url) || [],
        };
      })
    );

    return vehiclesWithImages;
  } catch (error) {
    const msg = logAdminError("getSubmittedVehicles", error, { statusFilter: filters?.status });
    throw new Error(`Fehler beim Abrufen der Fahrzeuge: ${msg}`);
  }
}

export async function approveSubmittedVehicle(submittedVehicleId: string) {
  try {
    await verifyAdminRole();
    const { user } = await getSupabaseServerClient();
    const { getSupabaseAdminClient } = await import("@/lib/supabase-admin");
    const supabase = getSupabaseAdminClient();

    if (!user) {
      throw new Error("User session required");
    }

    // Get the submitted vehicle
    const { data: submittedVehicle, error: fetchError } = await supabase
      .from("submitted_vehicles")
      .select("*")
      .eq("id", submittedVehicleId)
      .single();

    if (fetchError || !submittedVehicle) {
      throw new Error("Eingereichte Fahrzeug nicht gefunden");
    }

    // Update the submitted vehicle status to angebot_gesendet (offer sent)
    // Note: Vehicle creation is done separately by admin when needed
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("submitted_vehicles")
      .update({
        status: "angebot_gesendet",
        updated_at: now,
      })
      .eq("id", submittedVehicleId);

    if (updateError) {
      throw new Error(`Fehler beim Aktualisieren der eingereichten Fahrzeug: ${updateError.message}`);
    }

    return {
      success: true,
      message: "Angebot wurde gesendet. Der Kunde wird über den Status benachrichtigt.",
    };
  } catch (error) {
    const msg = logAdminError("approveSubmittedVehicle", error, { submittedVehicleId });
    throw new Error(msg || "Fehler beim Genehmigen des Fahrzeugs");
  }
}

export async function sendOffer(vehicleId: string, offeredPrice: number, offerTerms?: string) {
  try {
    await verifyAdminRole();
    const { supabase } = await getSupabaseServerClient();

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("submitted_vehicles")
      .update({
        status: "angebot_gesendet",
        offered_price: offeredPrice,
        offered_at: now,
        offer_terms: offerTerms || null,
        updated_at: now,
      })
      .eq("id", vehicleId);

    if (error) throw error;

    return {
      success: true,
      message: "Angebot wurde gesendet. Kunde wird benachrichtigt."
    };
  } catch (error) {
    console.error("Error sending offer:", error);
    throw new Error(error instanceof Error ? error.message : "Fehler beim Senden des Angebots");
  }
}

export async function rejectSubmittedVehicle(vehicleId: string, reason: string) {
  try {
    await verifyAdminRole();
    const { supabase } = await getSupabaseServerClient();

    const { error } = await supabase
      .from("submitted_vehicles")
      .update({
        status: "abgelehnt",
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vehicleId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error rejecting vehicle:", error);
    throw new Error(error instanceof Error ? error.message : "Fehler beim Ablehnen des Fahrzeugs");
  }
}

// ============================================================================
// INQUIRIES MANAGEMENT
// ============================================================================

export async function getInquiries(
  filters?: {
    status?: string;
  }
) {
  try {
    await verifyAdminRole();
    const { supabase } = await getSupabaseServerClient();

    let query = supabase
      .from("customer_inquiries")
      .select(
        `
        *,
        vehicle:vehicle_id (id, brand, model, year, price)
      `
      )
      .order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    throw new Error(error instanceof Error ? error.message : "Fehler beim Abrufen der Anfragen");
  }
}

export async function updateInquiryStatus(inquiryId: string, status: string) {
  try {
    await verifyAdminRole();
    const { supabase } = await getSupabaseServerClient();

    const { error } = await supabase
      .from("customer_inquiries")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inquiryId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error updating inquiry:", error);
    throw new Error(error instanceof Error ? error.message : "Fehler beim Aktualisieren der Anfrage");
  }
}

// ============================================================================
// TRADE-IN REQUESTS MANAGEMENT
// ============================================================================

export async function getTradeInRequests(
  filters?: {
    status?: string;
  }
) {
  try {
    await verifyAdminRole();
    const { supabase } = await getSupabaseServerClient();

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

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    const msg = logAdminError("getTradeInRequests", error, { statusFilter: filters?.status });
    throw new Error(`Fehler beim Abrufen der Anfragen: ${msg}`);
  }
}

export async function updateTradeInRequest(
  requestId: string,
  updates: {
    status?: string;
    admin_notes?: string;
  }
) {
  try {
    await verifyAdminRole();
    const { supabase } = await getSupabaseServerClient();

    const { error } = await supabase
      .from("trade_in_requests")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error updating trade-in request:", error);
    throw new Error(error instanceof Error ? error.message : "Fehler beim Aktualisieren der Anfrage");
  }
}

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================

export async function getDashboardStats() {
  try {
    await verifyAdminRole();
    const { supabase } = await getSupabaseServerClient();

    // Count vehicles by status
    const statuses = ["draft", "available", "reserved", "sold"];
    const vehicleCounts: Record<string, number> = {};
    for (const status of statuses) {
      const { count } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .eq("status", status);
      vehicleCounts[status] = count || 0;
    }

    // Count submitted vehicles by status
    const submittedStatuses = ["eingereicht", "in_bearbeitung", "angebot_gesendet", "abgelehnt"];
    const submittedCounts: Record<string, number> = {};
    for (const status of submittedStatuses) {
      const { count } = await supabase
        .from("submitted_vehicles")
        .select("*", { count: "exact", head: true })
        .eq("status", status);
      submittedCounts[status] = count || 0;
    }

    // Count inquiries by status
    const inquiryStatuses = ["new", "read", "responded", "closed"];
    const inquiryCounts: Record<string, number> = {};
    for (const status of inquiryStatuses) {
      const { count } = await supabase
        .from("customer_inquiries")
        .select("*", { count: "exact", head: true })
        .eq("status", status);
      inquiryCounts[status] = count || 0;
    }

    // Count trade-in requests by status
    const tradeInStatuses = ["new", "reviewing", "contact_made", "completed", "cancelled"];
    const tradeInCounts: Record<string, number> = {};
    for (const status of tradeInStatuses) {
      const { count } = await supabase
        .from("trade_in_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", status);
      tradeInCounts[status] = count || 0;
    }

    // Count customers
    const { count: totalCustomers } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "CUSTOMER");

    return {
      total_vehicles: Object.values(vehicleCounts).reduce((a, b) => a + b, 0),
      vehicles_draft: vehicleCounts.draft || 0,
      vehicles_available: vehicleCounts.available || 0,
      vehicles_reserved: vehicleCounts.reserved || 0,
      vehicles_sold: vehicleCounts.sold || 0,
      total_submitted_vehicles: Object.values(submittedCounts).reduce((a, b) => a + b, 0),
      submitted_vehicles_eingereicht: submittedCounts.eingereicht || 0,
      submitted_vehicles_in_bearbeitung: submittedCounts.in_bearbeitung || 0,
      submitted_vehicles_angebot_gesendet: submittedCounts.angebot_gesendet || 0,
      submitted_vehicles_abgelehnt: submittedCounts.abgelehnt || 0,
      inquiries_new: inquiryCounts.new || 0,
      inquiries_read: inquiryCounts.read || 0,
      inquiries_responded: inquiryCounts.responded || 0,
      inquiries_closed: inquiryCounts.closed || 0,
      trade_in_requests_new: tradeInCounts.new || 0,
      trade_in_requests_reviewing: tradeInCounts.reviewing || 0,
      trade_in_requests_contact_made: tradeInCounts.contact_made || 0,
      trade_in_requests_completed: tradeInCounts.completed || 0,
      trade_in_requests_cancelled: tradeInCounts.cancelled || 0,
      total_customers: totalCustomers || 0,
      avg_vehicle_price: 0,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw new Error(error instanceof Error ? error.message : "Fehler beim Abrufen der Statistiken");
  }
}

// ============================================================================
// CUSTOMER MANAGEMENT
// ============================================================================

export async function getCustomers() {
  try {
    await verifyAdminRole();
    const { supabase } = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("role", "CUSTOMER")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw new Error(error instanceof Error ? error.message : "Fehler beim Abrufen der Kunden");
  }
}

export async function getCustomerDetails(customerId: string) {
  try {
    await verifyAdminRole();
    const { supabase } = await getSupabaseServerClient();

    const { data: customer, error: customerError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", customerId)
      .single();

    if (customerError) throw customerError;

    // Get customer's submitted vehicles
    const { data: vehicles } = await supabase
      .from("submitted_vehicles")
      .select("*")
      .eq("user_id", customerId);

    // Get customer's inquiries
    const { data: inquiries } = await supabase
      .from("customer_inquiries")
      .select("*")
      .eq("customer_email", customer.email);

    // Get customer's trade-in requests
    const { data: tradeIns } = await supabase
      .from("trade_in_requests")
      .select("*")
      .eq("user_id", customerId);

    return {
      customer,
      vehicles: vehicles || [],
      inquiries: inquiries || [],
      tradeIns: tradeIns || [],
    };
  } catch (error) {
    console.error("Error fetching customer details:", error);
    throw new Error(error instanceof Error ? error.message : "Kunde nicht gefunden");
  }
}

export async function getSubmittedVehicleById(submittedVehicleId: string) {
  try {
    await verifyAdminRole();
    const { supabase } = await getSupabaseServerClient();

    const { data: vehicle, error: vehicleError } = await supabase
      .from("submitted_vehicles")
      .select("*")
      .eq("id", submittedVehicleId)
      .single();

    if (vehicleError || !vehicle) {
      throw new Error("Eingereichte Fahrzeug nicht gefunden");
    }

    const { data: images } = await supabase
      .from("submitted_vehicle_images")
      .select("image_url")
      .eq("submitted_vehicle_id", submittedVehicleId)
      .order("sort_order", { ascending: true });

    return {
      ...vehicle,
      images: images?.map((img) => img.image_url) || [],
    };
  } catch (error) {
    const msg = logAdminError("getSubmittedVehicleById", error, { submittedVehicleId });
    throw new Error(msg || "Fehler beim Abrufen des Fahrzeugs");
  }
}

export async function publishSubmittedVehicle(
  submittedVehicleId: string,
  overrides?: {
    price?: number;
    description?: string;
    featured?: boolean;
  }
) {
  try {
    await verifyAdminRole();
    const { user } = await getSupabaseServerClient();
    const { getSupabaseAdminClient } = await import("@/lib/supabase-admin");
    const supabase = getSupabaseAdminClient();

    if (!user) {
      throw new Error("User session required");
    }

    const { data: submittedVehicle, error: fetchError } = await supabase
      .from("submitted_vehicles")
      .select("*")
      .eq("id", submittedVehicleId)
      .single();

    if (fetchError || !submittedVehicle) {
      throw new Error("Eingereichte Fahrzeug nicht gefunden");
    }

    const generatedVin = `VIN-${submittedVehicle.brand.toUpperCase()}-${submittedVehicle.model.toUpperCase()}-${Date.now()}`;

    const { data: newVehicle, error: createError } = await supabase
      .from("vehicles")
      .insert({
        vin: generatedVin,
        brand: submittedVehicle.brand,
        model: submittedVehicle.model,
        year: submittedVehicle.year,
        mileage: submittedVehicle.mileage,
        price: overrides?.price ?? submittedVehicle.price,
        fuel_type: submittedVehicle.fuel_type,
        transmission: submittedVehicle.transmission,
        color_exterior: submittedVehicle.color,
        description: overrides?.description ?? submittedVehicle.description,
        body_type: submittedVehicle.body_type,
        power_hp: submittedVehicle.power,
        status: "draft",
        featured: overrides?.featured ?? false,
      })
      .select()
      .single();

    if (createError || !newVehicle) {
      throw new Error(`Fehler beim Erstellen der Fahrzeugangebot: ${createError?.message}`);
    }

    // Copy images from private customer-submitted-photos bucket to public vehicle-images bucket
    const { data: submittedImages } = await supabase
      .from("submitted_vehicle_images")
      .select("image_url, sort_order, is_main")
      .eq("submitted_vehicle_id", submittedVehicleId)
      .order("sort_order", { ascending: true });

    if (submittedImages && submittedImages.length > 0) {
      for (const submittedImage of submittedImages) {
        try {
          // Download from private bucket
          const { data: fileData, error: downloadError } = await supabase.storage
            .from("customer-submitted-photos")
            .download(submittedImage.image_url);

          if (downloadError || !fileData) {
            console.error(`Failed to download image ${submittedImage.image_url}:`, downloadError);
            continue;
          }

          // Upload to public bucket with new path
          const fileName = submittedImage.image_url.split("/").pop() || `image-${Date.now()}.jpg`;
          const publicPath = `${newVehicle.id}/${fileName}`;
          const { error: uploadError } = await supabase.storage
            .from("vehicle-images")
            .upload(publicPath, fileData, { upsert: false });

          if (uploadError) {
            console.error(`Failed to upload image to public bucket:`, uploadError);
            continue;
          }

          // Get public URL
          const { data: publicUrl } = supabase.storage
            .from("vehicle-images")
            .getPublicUrl(publicPath);

          // Store public URL in vehicle_images table
          const { error: insertError } = await supabase
            .from("vehicle_images")
            .insert({
              vehicle_id: newVehicle.id,
              image_url: publicUrl.publicUrl,
              sort_order: submittedImage.sort_order,
              is_main: submittedImage.is_main,
            });

          if (insertError) {
            console.error(`Failed to insert image record:`, insertError);
            continue;
          }
        } catch (imgError) {
          console.error(`Error processing image ${submittedImage.image_url}:`, imgError);
          continue;
        }
      }
    }

    const now = new Date().toISOString();
    await supabase
      .from("submitted_vehicles")
      .update({
        status: "akzeptiert",
        updated_at: now,
      })
      .eq("id", submittedVehicleId);

    return {
      success: true,
      vehicleId: newVehicle.id,
      message: "Fahrzeug erfolgreich in Fahrzeuge-Liste veröffentlicht",
    };
  } catch (error) {
    const msg = logAdminError("publishSubmittedVehicle", error, { submittedVehicleId });
    throw new Error(msg || "Fehler beim Veröffentlichen des Fahrzeugs");
  }
}
