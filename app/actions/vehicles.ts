"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ActionError, runAction, toErrorCode, type ActionResult } from "@/lib/action-result";
import { requireAdmin, requireUser } from "@/lib/auth-guards";
import {
  MAX_IMAGES_PER_REQUEST,
  decodeImageDataUrl,
  imageDataUrlSchema,
  imageListSchema,
} from "@/lib/image-upload";
import { revalidateVehiclePages } from "@/lib/revalidate-vehicles";
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
 * Every exported action returns ActionResult ({ ok: false, error: CODE } on failure,
 * see lib/action-result.ts); nothing here returns or throws human-readable text.
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
  // Wizard answers (option values, see migration 026).
  variant: optionalText(100),
  previous_owners: z.enum(["1", "2", "3", "4+"]).optional(),
  hu_au: z.enum(["yes", "no", "expired"]).optional(),
  accident_history: z.enum(["no", "yes", "unknown"]).optional(),
  service_book: z.enum(["yes", "no"]).optional(),
});

/** Statuses in which the owner may still add photos to a submission. */
const PHOTO_UPLOAD_STATUSES = ["draft", "eingereicht"];

function parseOrThrow<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) throw new ActionError("INVALID_INPUT");
  return result.data;
}

async function getSubmittedVehiclesImpl(): Promise<SubmittedVehicle[]> {
  const { supabase, user } = await requireUser();

  const { data: vehicles, error: vehiclesError } = await supabase
    .from("submitted_vehicles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (vehiclesError) throw new ActionError("LOAD_FAILED");
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

async function countSubmittedVehiclesImpl(): Promise<number> {
  const { supabase, user } = await requireUser();

  const { count, error } = await supabase
    .from("submitted_vehicles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) throw new ActionError("LOAD_FAILED");
  return count ?? 0;
}

/**
 * Uploads decoded images to the private customer bucket and records them.
 * A failed storage upload is retried once; if the image row cannot be written the
 * file is removed again, so no orphaned file stays behind. Returns the indexes
 * (into `dataUrls`) of the images that could not be stored.
 */
async function storeSubmissionImages(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  submissionId: string,
  dataUrls: string[],
  firstSortOrder: number,
  firstIsMain: boolean
) {
  const failedIndexes: number[] = [];
  let mainAssigned = !firstIsMain;
  for (let i = 0; i < dataUrls.length; i++) {
    const image = decodeImageDataUrl(dataUrls[i]);
    if (!image) {
      failedIndexes.push(i);
      continue;
    }

    // Path layout required by the storage RLS policy: {user_id}/{submission_id}/{file}
    const storagePath = `${userId}/${submissionId}/${Date.now()}-${randomUUID()}.${image.extension}`;
    const upload = () =>
      supabase.storage
        .from("customer-submitted-photos")
        .upload(storagePath, image.bytes, { contentType: image.contentType, upsert: false });

    let { error: uploadError } = await upload();
    if (uploadError) ({ error: uploadError } = await upload());
    if (uploadError) {
      console.error("[storeSubmissionImages] storage upload:", uploadError.message);
      failedIndexes.push(i);
      continue;
    }

    const { error: insertError } = await supabase.from("submitted_vehicle_images").insert({
      submitted_vehicle_id: submissionId,
      image_url: storagePath,
      sort_order: firstSortOrder + i,
      is_main: !mainAssigned,
    });
    if (insertError) {
      console.error("[storeSubmissionImages] image row:", insertError.message);
      // Customers have no DELETE right in the private bucket (admin-only policy), so the
      // cleanup uses the service-role client, limited to the file written just above.
      const { getSupabaseAdminClient } = await import("@/lib/supabase-admin");
      const { error: removeError } = await getSupabaseAdminClient()
        .storage.from("customer-submitted-photos")
        .remove([storagePath]);
      if (removeError) console.error("[storeSubmissionImages] orphaned file:", storagePath, removeError.message);
      failedIndexes.push(i);
      continue;
    }

    mainAssigned = true;
  }
  return { uploadedCount: dataUrls.length - failedIndexes.length, failedIndexes };
}

async function createSubmittedVehicleImpl(vehicleData: unknown, images: unknown) {
  const { supabase, user } = await requireUser();
  const data = parseOrThrow(submittedVehicleSchema, vehicleData);
  const imageList = parseOrThrow(imageListSchema, images ?? []);

  // Explicit field list: user_id and status are fixed here (the insert RLS check
  // also requires status = 'eingereicht' and empty admin/offer columns).
  const baseRow = {
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
  };
  const detailColumns = {
    variant: data.variant || null,
    previous_owners: data.previous_owners,
    hu_au: data.hu_au,
    accident_history: data.accident_history,
    service_book: data.service_book,
  };
  const { data: vehicle, error: vehicleError } = await supabase
    .from("submitted_vehicles")
    .insert({ ...baseRow, ...detailColumns })
    .select("id")
    .single();

  if (vehicleError || !vehicle) {
    if (vehicleError) console.error("[createSubmittedVehicle] insert:", vehicleError.message);
    throw new ActionError("CREATE_FAILED");
  }

  const { uploadedCount, failedIndexes } = await storeSubmissionImages(
    supabase,
    user.id,
    vehicle.id,
    imageList,
    0,
    true
  );

  return {
    vehicleId: vehicle.id as string,
    uploadedCount,
    expectedCount: imageList.length,
    failedIndexes,
  };
}

/**
 * Adds photos to the caller's own submission (private bucket, RLS-bound client).
 * Ownership is checked against the session user, not a client-sent id.
 */
async function uploadSubmissionImagesImpl(submissionId: string, filesData: unknown) {
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
  if (error || !submission) throw new ActionError("NOT_FOUND");
  if (submission.user_id !== user.id) throw new ActionError("FORBIDDEN");
  if (!PHOTO_UPLOAD_STATUSES.includes(submission.status)) throw new ActionError("FORBIDDEN");

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
  if ((count ?? 0) + files.length > MAX_IMAGES_PER_REQUEST) throw new ActionError("INVALID_INPUT");

  const nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;
  const { uploadedCount, failedIndexes } = await storeSubmissionImages(
    supabase,
    user.id,
    targetId,
    files.map((f) => f.data),
    nextSortOrder,
    (count ?? 0) === 0
  );
  if (uploadedCount === 0) throw new ActionError("UPLOAD_FAILED");

  // Partial success is reported, not thrown, so the caller knows which photos to retry.
  return { uploadedCount, failedIndexes };
}

/**
 * Attaches ONE photo to a vehicle in the `vehicles` table (public `vehicle-images` bucket).
 * Admin only: the role is checked in the database from the session. Uses the session
 * client; needs migration 025 (admin write policies on the bucket + vehicle_images grant).
 * One image per call keeps each request well below the server action / Vercel body limits.
 * Never throws: returns an error code the form translates.
 */
export async function uploadVehicleImage(
  vehicleId: string,
  dataUrl: string
): Promise<ActionResult<{ url: string }>> {
  let supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"];
  try {
    ({ supabase } = await requireAdmin());
  } catch (error) {
    return { ok: false, error: toErrorCode(error, "UNAUTHORIZED") };
  }

  const targetId = id.safeParse(vehicleId);
  const data = imageDataUrlSchema.safeParse(dataUrl);
  if (!targetId.success || !data.success) return { ok: false, error: "INVALID_INPUT" };
  const image = decodeImageDataUrl(data.data);
  if (!image) return { ok: false, error: "INVALID_INPUT" };

  const { data: vehicle, error: fetchError } = await supabase
    .from("vehicles")
    .select("id, brand, model, status")
    .eq("id", targetId.data)
    .maybeSingle();
  if (fetchError) {
    console.error("[uploadVehicleImage] load vehicle:", fetchError.message);
    return { ok: false, error: "UPLOAD_FAILED" };
  }
  if (!vehicle) return { ok: false, error: "NOT_FOUND" };

  const { data: existing, count } = await supabase
    .from("vehicle_images")
    .select("sort_order", { count: "exact" })
    .eq("vehicle_id", targetId.data)
    .order("sort_order", { ascending: false })
    .limit(1);
  if ((count ?? 0) >= MAX_IMAGES_PER_REQUEST) return { ok: false, error: "INVALID_INPUT" };
  const sortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  // File name is generated; nothing client-controlled ends up in the path.
  const path = `${targetId.data}/${Date.now()}-${randomUUID()}.${image.extension}`;
  const { error: uploadError } = await supabase.storage
    .from("vehicle-images")
    .upload(path, image.bytes, { contentType: image.contentType, cacheControl: "3600", upsert: false });
  if (uploadError) {
    // Logged so the cause (e.g. a missing storage policy) is visible in the server logs.
    console.error("[uploadVehicleImage] storage upload:", uploadError.message);
    return { ok: false, error: "UPLOAD_FAILED" };
  }

  const { data: publicUrl } = supabase.storage.from("vehicle-images").getPublicUrl(path);
  const { error: insertError } = await supabase.from("vehicle_images").insert({
    vehicle_id: targetId.data,
    image_url: publicUrl.publicUrl,
    sort_order: sortOrder,
  });
  if (insertError) {
    console.error("[uploadVehicleImage] vehicle_images insert:", insertError.message);
    // Don't leave an orphaned file behind.
    await supabase.storage.from("vehicle-images").remove([path]);
    return { ok: false, error: "UPLOAD_FAILED" };
  }

  // A draft is not public yet (publishVehicle() revalidates when it goes live).
  if (vehicle.status !== "draft") revalidateVehiclePages(vehicle);
  return { ok: true, url: publicUrl.publicUrl };
}

/**
 * draft -> eingereicht for the caller's own submission. The user id comes from the
 * session, the state transition is fixed, nothing else can be changed.
 * (Customers cannot UPDATE under RLS, so the status write itself uses the
 * service-role client, but only after the checks above it.)
 */
async function finalizeSubmissionImpl(vehicleId: string) {
  const { supabase, user } = await requireUser();
  const submissionId = parseOrThrow(id, vehicleId);

  const { data: vehicle, error: fetchError } = await supabase
    .from("submitted_vehicles")
    .select("id, user_id, status")
    .eq("id", submissionId)
    .maybeSingle();

  if (fetchError || !vehicle) throw new ActionError("NOT_FOUND");
  if (vehicle.user_id !== user.id) throw new ActionError("FORBIDDEN");
  if (vehicle.status !== "draft") throw new ActionError("INVALID_STATE");

  const { getSupabaseAdminClient } = await import("@/lib/supabase-admin");
  const { data: updated, error } = await getSupabaseAdminClient()
    .from("submitted_vehicles")
    .update({ status: "eingereicht", updated_at: new Date().toISOString() })
    .eq("id", submissionId)
    .eq("user_id", user.id)
    .eq("status", "draft")
    .select("id");

  if (error || !updated || updated.length !== 1) throw new ActionError("UPDATE_FAILED");
  return {};
}

async function respondToOffer(vehicleId: string, decision: "akzeptiert" | "eingereicht") {
  const { supabase, user } = await requireUser();
  const submissionId = parseOrThrow(id, vehicleId);

  // RLS limits this to the caller's own rows (admins would also see others', hence the explicit check).
  const { data: vehicle, error: fetchError } = await supabase
    .from("submitted_vehicles")
    .select("id, user_id, status, offered_price")
    .eq("id", submissionId)
    .maybeSingle();

  if (fetchError || !vehicle) throw new ActionError("NOT_FOUND");
  if (vehicle.user_id !== user.id) throw new ActionError("FORBIDDEN");
  if (vehicle.status !== "angebot_gesendet") throw new ActionError("INVALID_STATE");
  // Rows from the old approve path have the status but no price; there is nothing to answer.
  if (!(Number(vehicle.offered_price) > 0)) throw new ActionError("INVALID_STATE");

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

  if (error || !updated || updated.length !== 1) throw new ActionError("UPDATE_FAILED");
  return decision;
}

async function acceptOfferImpl(vehicleId: string) {
  await respondToOffer(vehicleId, "akzeptiert");
  return {};
}

async function rejectOfferImpl(vehicleId: string) {
  await respondToOffer(vehicleId, "eingereicht");
  return {};
}

// ----------------------------------------------------------------------------
// Exported actions: never throw, never return human-readable text.
// ----------------------------------------------------------------------------

export async function getSubmittedVehicles() {
  return runAction("getSubmittedVehicles", "LOAD_FAILED", async () => ({ vehicles: await getSubmittedVehiclesImpl() }));
}

export async function countSubmittedVehicles() {
  return runAction("countSubmittedVehicles", "LOAD_FAILED", async () => ({ count: await countSubmittedVehiclesImpl() }));
}

export async function createSubmittedVehicle(vehicleData: unknown, images: unknown) {
  return runAction("createSubmittedVehicle", "CREATE_FAILED", () => createSubmittedVehicleImpl(vehicleData, images));
}

export async function uploadSubmissionImages(submissionId: string, filesData: unknown) {
  return runAction("uploadSubmissionImages", "UPLOAD_FAILED", () => uploadSubmissionImagesImpl(submissionId, filesData));
}

export async function finalizeSubmission(vehicleId: string) {
  return runAction("finalizeSubmission", "UPDATE_FAILED", () => finalizeSubmissionImpl(vehicleId));
}

export async function acceptOffer(vehicleId: string) {
  return runAction("acceptOffer", "UPDATE_FAILED", () => acceptOfferImpl(vehicleId));
}

export async function rejectOffer(vehicleId: string) {
  return runAction("rejectOffer", "UPDATE_FAILED", () => rejectOfferImpl(vehicleId));
}
