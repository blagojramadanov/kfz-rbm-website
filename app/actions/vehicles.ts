"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/auth-guards";
import {
  MAX_IMAGES_PER_REQUEST,
  decodeImageDataUrl,
  imageDataUrlSchema,
  imageListSchema,
} from "@/lib/image-upload";
import type { SubmittedVehicle } from "@/lib/supabase";

/**
 * Customer-facing vehicle actions.
 *
 * Rules (server actions are public endpoints, see lib/auth-guards.ts):
 *  - the user id always comes from the session, never from the arguments;
 *  - every input is validated with zod; unknown fields are stripped, so the client
 *    cannot set status, user_id, offered_price, admin notes, ...;
 *  - RLS-bound session clients are used wherever the policies allow it. The
 *    service-role client is used only where RLS forbids the write for customers
 *    (status changes), and only after the session + ownership + state checks.
 * Errors are stable codes: UNAUTHORIZED, FORBIDDEN, NOT_FOUND, INVALID_INPUT, ...
 */

const id = z.guid();
const optionalText = (max: number) => z.string().trim().max(max).optional();

const submittedVehicleSchema = z.object({
  brand: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  mileage: z.number().int().min(0).max(5_000_000),
  price: z.number().min(0).max(100_000_000).optional(),
  transmission: optionalText(50),
  fuel_type: optionalText(50),
  body_type: optionalText(50),
  color: optionalText(50),
  power_hp: z.number().int().min(0).max(5000).optional(),
  description: optionalText(5000),
  sales_type: optionalText(100),
  commission: z.number().min(0).max(100).nullable().optional(),
});

/** Statuses in which the owner may still add photos to a submission. */
const PHOTO_UPLOAD_STATUSES = ["draft", "eingereicht"];

function parseOrThrow<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error("INVALID_INPUT");
  return result.data;
}

export async function getSubmittedVehicleById(vehicleId: string) {
  const { supabase, user } = await requireUser();
  const submissionId = parseOrThrow(id, vehicleId);

  const { data: vehicle, error: vehicleError } = await supabase
    .from("submitted_vehicles")
    .select("*")
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .single();

  if (vehicleError || !vehicle) throw new Error("NOT_FOUND");

  const { data: images } = await supabase
    .from("submitted_vehicle_images")
    .select("*")
    .eq("submitted_vehicle_id", submissionId)
    .order("sort_order", { ascending: true });

  return { vehicle, images: images || [] };
}

export async function getSubmittedVehicles(): Promise<SubmittedVehicle[]> {
  const { supabase, user } = await requireUser();

  const { data: vehicles, error: vehiclesError } = await supabase
    .from("submitted_vehicles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (vehiclesError) throw new Error("LOAD_FAILED");
  if (!vehicles) return [];

  const vehiclesWithImages = await Promise.all(
    vehicles.map(async (vehicle) => {
      const { data: images } = await supabase
        .from("submitted_vehicle_images")
        .select("image_url")
        .eq("submitted_vehicle_id", vehicle.id)
        .order("sort_order", { ascending: true });

      return { ...vehicle, images: images?.map((img) => img.image_url) || [] };
    })
  );

  return vehiclesWithImages as SubmittedVehicle[];
}

/** Uploads decoded images to the private customer bucket and records them. Returns how many succeeded. */
async function storeSubmissionImages(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  submissionId: string,
  dataUrls: string[],
  firstSortOrder: number,
  firstIsMain: boolean
) {
  let uploaded = 0;
  for (let i = 0; i < dataUrls.length; i++) {
    const image = decodeImageDataUrl(dataUrls[i]);
    if (!image) continue;

    // Path layout required by the storage RLS policy: {user_id}/{submission_id}/{file}
    const storagePath = `${userId}/${submissionId}/${Date.now()}-${randomUUID()}.${image.extension}`;

    const { error: uploadError } = await supabase.storage
      .from("customer-submitted-photos")
      .upload(storagePath, image.bytes, { contentType: image.contentType, upsert: false });
    if (uploadError) continue;

    const { error: insertError } = await supabase.from("submitted_vehicle_images").insert({
      submitted_vehicle_id: submissionId,
      image_url: storagePath,
      sort_order: firstSortOrder + i,
      is_main: firstIsMain && i === 0,
    });
    if (insertError) continue;

    uploaded++;
  }
  return uploaded;
}

export async function createSubmittedVehicle(vehicleData: unknown, images: unknown) {
  const { supabase, user } = await requireUser();
  const data = parseOrThrow(submittedVehicleSchema, vehicleData);
  const imageList = parseOrThrow(imageListSchema, images ?? []);

  // Explicit field list: user_id and status are fixed here (the insert RLS check
  // also requires status = 'eingereicht' and empty admin/offer columns).
  const { data: vehicle, error: vehicleError } = await supabase
    .from("submitted_vehicles")
    .insert({
      user_id: user.id,
      brand: data.brand,
      model: data.model,
      year: data.year,
      mileage: data.mileage,
      price: data.price,
      transmission: data.transmission,
      fuel_type: data.fuel_type,
      body_type: data.body_type,
      color: data.color,
      power_hp: data.power_hp,
      description: data.description,
      sales_type: data.sales_type,
      commission: data.commission,
      status: "eingereicht",
    })
    .select()
    .single();

  if (vehicleError || !vehicle) throw new Error("CREATE_FAILED");

  const uploadedCount = await storeSubmissionImages(supabase, user.id, vehicle.id, imageList, 0, true);

  return {
    success: true,
    vehicleId: vehicle.id as string,
    uploadedCount,
    message: "Fahrzeug eingereicht",
  };
}

/**
 * Adds photos to the caller's own submission (private bucket, RLS-bound client).
 * Ownership is checked against the session user, not a client-sent id.
 */
export async function uploadSubmissionImages(submissionId: string, filesData: unknown) {
  const { supabase, user } = await requireUser();
  const targetId = parseOrThrow(id, submissionId);
  const files = parseOrThrow(
    z.array(z.object({ name: z.string().max(255).optional(), data: imageDataUrlSchema })).min(1).max(MAX_IMAGES_PER_REQUEST),
    filesData
  );

  const { data: submission, error } = await supabase
    .from("submitted_vehicles")
    .select("id, user_id, status")
    .eq("id", targetId)
    .maybeSingle();

  // RLS already hides other users' rows; the explicit check keeps this safe if a policy changes.
  if (error || !submission) throw new Error("NOT_FOUND");
  if (submission.user_id !== user.id) throw new Error("FORBIDDEN");
  if (!PHOTO_UPLOAD_STATUSES.includes(submission.status)) throw new Error("FORBIDDEN");

  const { data: existing } = await supabase
    .from("submitted_vehicle_images")
    .select("sort_order")
    .eq("submitted_vehicle_id", targetId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const { count } = await supabase
    .from("submitted_vehicle_images")
    .select("id", { count: "exact", head: true })
    .eq("submitted_vehicle_id", targetId);
  if ((count ?? 0) + files.length > MAX_IMAGES_PER_REQUEST) throw new Error("INVALID_INPUT");

  const nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;
  const uploaded = await storeSubmissionImages(
    supabase,
    user.id,
    targetId,
    files.map((f) => f.data),
    nextSortOrder,
    (count ?? 0) === 0
  );
  if (uploaded !== files.length) throw new Error("UPLOAD_FAILED");

  return { success: true, uploadedCount: uploaded };
}

/**
 * Attaches photos to a published vehicle (`vehicles` table, public bucket).
 * Admin only: the role is checked in the database from the session. Uses the
 * session client; the admin RLS policies on vehicle_images and the bucket allow it.
 */
export async function uploadVehicleImagesBase64(vehicleId: string, filesData: unknown) {
  const { supabase } = await requireAdmin();
  const targetId = parseOrThrow(id, vehicleId);
  const files = parseOrThrow(
    z.array(z.object({ name: z.string().max(255).optional(), data: imageDataUrlSchema })).min(1).max(MAX_IMAGES_PER_REQUEST),
    filesData
  );

  const { data: vehicle, error: fetchError } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", targetId)
    .maybeSingle();
  if (fetchError || !vehicle) throw new Error("NOT_FOUND");

  const { data: existing } = await supabase
    .from("vehicle_images")
    .select("sort_order")
    .eq("vehicle_id", targetId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  let failed = 0;
  for (let i = 0; i < files.length; i++) {
    const image = decodeImageDataUrl(files[i].data);
    if (!image) {
      failed++;
      continue;
    }

    // File name is generated; the client-sent name is never used in the path.
    const path = `${targetId}/${Date.now()}-${randomUUID()}.${image.extension}`;
    const { error: uploadError } = await supabase.storage
      .from("vehicle-images")
      .upload(path, image.bytes, { contentType: image.contentType, cacheControl: "3600", upsert: false });
    if (uploadError) {
      failed++;
      continue;
    }

    const { data: publicUrl } = supabase.storage.from("vehicle-images").getPublicUrl(path);
    const { error: insertError } = await supabase.from("vehicle_images").insert({
      vehicle_id: targetId,
      image_url: publicUrl.publicUrl,
      sort_order: nextSortOrder + i,
    });
    if (insertError) failed++;
  }

  if (failed > 0) throw new Error("UPLOAD_FAILED");
  return { success: true, uploadedCount: files.length };
}

/**
 * draft -> eingereicht for the caller's own submission. The user id comes from the
 * session, the state transition is fixed, nothing else can be changed.
 * (Customers cannot UPDATE under RLS, so the status write itself uses the
 * service-role client, but only after the checks above it.)
 */
export async function finalizeSubmission(vehicleId: string) {
  const { supabase, user } = await requireUser();
  const submissionId = parseOrThrow(id, vehicleId);

  const { data: vehicle, error: fetchError } = await supabase
    .from("submitted_vehicles")
    .select("id, user_id, status")
    .eq("id", submissionId)
    .maybeSingle();

  if (fetchError || !vehicle) throw new Error("NOT_FOUND");
  if (vehicle.user_id !== user.id) throw new Error("FORBIDDEN");
  if (vehicle.status !== "draft") throw new Error("INVALID_STATE");

  const { getSupabaseAdminClient } = await import("@/lib/supabase-admin");
  const { data: updated, error } = await getSupabaseAdminClient()
    .from("submitted_vehicles")
    .update({ status: "eingereicht", updated_at: new Date().toISOString() })
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .eq("status", "draft")
    .select("id");

  if (error || !updated || updated.length !== 1) throw new Error("UPDATE_FAILED");
  return { success: true, message: "Fahrzeug erfolgreich eingereicht" };
}

async function respondToOffer(vehicleId: string, decision: "akzeptiert" | "eingereicht") {
  const { supabase, user } = await requireUser();
  const submissionId = parseOrThrow(id, vehicleId);

  // RLS limits this to the caller's own rows (admins would also see others', hence the explicit check).
  const { data: vehicle, error: fetchError } = await supabase
    .from("submitted_vehicles")
    .select("id, user_id, status")
    .eq("id", submissionId)
    .maybeSingle();

  if (fetchError || !vehicle) throw new Error("NOT_FOUND");
  if (vehicle.user_id !== user.id) throw new Error("FORBIDDEN");
  if (vehicle.status !== "angebot_gesendet") throw new Error("INVALID_STATE");

  // Only status and timestamps change; the write is pinned to owner + current state.
  const now = new Date().toISOString();
  const { getSupabaseAdminClient } = await import("@/lib/supabase-admin");
  const { data: updated, error } = await getSupabaseAdminClient()
    .from("submitted_vehicles")
    .update(
      decision === "akzeptiert"
        ? { status: "akzeptiert", offer_accepted_at: now, updated_at: now }
        : { status: "eingereicht", offer_rejected_at: now, updated_at: now }
    )
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .eq("status", "angebot_gesendet")
    .select("id");

  if (error || !updated || updated.length !== 1) throw new Error("UPDATE_FAILED");
  return decision;
}

export async function acceptOffer(vehicleId: string) {
  await respondToOffer(vehicleId, "akzeptiert");
  return {
    success: true,
    message: "Angebot akzeptiert. Kontaktieren Sie uns für die nächsten Schritte.",
  };
}

export async function rejectOffer(vehicleId: string) {
  await respondToOffer(vehicleId, "eingereicht");
  return {
    success: true,
    message: "Angebot abgelehnt. Sie können andere Angebote erhalten.",
  };
}
