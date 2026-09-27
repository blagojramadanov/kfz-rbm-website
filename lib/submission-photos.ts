import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Copies a customer submission's photos into the inventory vehicle's images.
 *
 * Source: private bucket `customer-submitted-photos`, rows in `submitted_vehicle_images`
 * (path in `image_url`, `is_main` marks the customer's main photo).
 * Target: public bucket `vehicle-images` under `{vehicleId}/`, rows in `vehicle_images`
 * with the public URL, like uploadVehicleImage(). `vehicle_images` has no `is_main`
 * column: the public pages show the lowest `sort_order` as the main image, so the
 * main photo goes first and the others follow in the customer's order.
 *
 * The files are copied, never moved: the submission keeps its own photos.
 * Re-running is safe (same target path per file, upsert on file and row), so a
 * partly failed copy can be repeated. Needs the service-role client: the private
 * bucket is not readable for the admin's session across all customers' folders.
 * scripts/backfill-published-submissions.mjs mirrors this logic for the one-off backfill.
 */
export async function copySubmissionPhotos(
  supabase: SupabaseClient,
  submissionId: string,
  vehicleId: string
): Promise<{ copied: number; failed: string[]; uploadedPaths: string[] }> {
  const { data: rows, error } = await supabase
    .from("submitted_vehicle_images")
    .select("image_url, sort_order, is_main")
    .eq("submitted_vehicle_id", submissionId)
    .order("sort_order", { ascending: true });
  if (error) throw error;

  const images = rows ?? [];
  const mainIndex = images.findIndex((image) => image.is_main);
  const ordered = mainIndex > 0 ? [images[mainIndex], ...images.filter((_, i) => i !== mainIndex)] : images;

  const failed: string[] = [];
  const uploadedPaths: string[] = [];
  const newRows: { vehicle_id: string; image_url: string; sort_order: number }[] = [];

  for (const image of ordered) {
    const sourcePath = image.image_url as string;
    const { data: file, error: downloadError } = await supabase.storage
      .from("customer-submitted-photos")
      .download(sourcePath);
    if (downloadError || !file) {
      console.error(`[copySubmissionPhotos] download ${sourcePath}:`, downloadError?.message);
      failed.push(sourcePath);
      continue;
    }

    const targetPath = `${vehicleId}/${sourcePath.split("/").pop()}`;
    const { error: uploadError } = await supabase.storage
      .from("vehicle-images")
      .upload(targetPath, file, { contentType: file.type || undefined, cacheControl: "3600", upsert: true });
    if (uploadError) {
      console.error(`[copySubmissionPhotos] upload ${targetPath}:`, uploadError.message);
      failed.push(sourcePath);
      continue;
    }
    uploadedPaths.push(targetPath);

    const { data: publicUrl } = supabase.storage.from("vehicle-images").getPublicUrl(targetPath);
    newRows.push({ vehicle_id: vehicleId, image_url: publicUrl.publicUrl, sort_order: newRows.length });
  }

  if (newRows.length > 0) {
    const { error: insertError } = await supabase
      .from("vehicle_images")
      .upsert(newRows, { onConflict: "vehicle_id,image_url" });
    if (insertError) {
      console.error("[copySubmissionPhotos] image rows:", insertError.message);
      return { copied: 0, failed: ordered.map((image) => image.image_url as string), uploadedPaths };
    }
  }

  return { copied: newRows.length, failed, uploadedPaths };
}
