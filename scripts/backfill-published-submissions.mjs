// One-off backfill for submissions that were published before the publish flow
// copied photos, set the source from the sale type and carried over the details.
//
//   node --env-file=.env.local scripts/backfill-published-submissions.mjs            (dry run, reads only)
//   node --env-file=.env.local scripts/backfill-published-submissions.mjs --apply    (writes)
//
// Per submission it
//   1. sets vehicles.source_type from submitted_vehicles.sales_type (consignment ->
//      customer; direct sale / trade-in -> rbm) and links vehicles.submitted_vehicle_id,
//   2. copies variant, previous_owners, hu_au, accident_history, service_book
//      (needs migration 027),
//   3. copies the photos (private customer-submitted-photos -> public vehicle-images,
//      main photo first), only if the vehicle has no image rows yet.
// Status, price and description are not touched. Same logic as
// lib/submission-photos.ts and lib/submission-workflow.ts. Safe to re-run.

import { createClient } from "@supabase/supabase-js";

const SUBMISSION_IDS = [
  "d5550c9a-ddf5-42b3-9ddd-b1ced7e93dba", // VW Golf
  "25f99487-69f4-4980-adae-0dfbb93742ca", // TEST-Mercedes
];
const DETAIL_COLUMNS = ["variant", "previous_owners", "hu_au", "accident_history", "service_book"];
const RBM_SALES_TYPES = ["direct", "tradeIn", "Direktverkauf", "Direktverkauf an KFZ RBM", "Inzahlungnahme"];
const CUSTOMER_SALES_TYPES = ["consignment", "Verkauf im Kundenauftrag"];

const apply = process.argv.includes("--apply");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY missing (run with --env-file=.env.local).");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

function sourceTypeFor(salesType) {
  const value = salesType?.trim() ?? "";
  if (value === "" || RBM_SALES_TYPES.includes(value)) return "rbm";
  if (CUSTOMER_SALES_TYPES.includes(value)) return "customer";
  return null;
}

async function backfill(submissionId) {
  console.log(`\n=== Submission ${submissionId}`);
  const { data: submission, error } = await supabase
    .from("submitted_vehicles")
    .select(`id, brand, model, status, sales_type, vehicle_id, ${DETAIL_COLUMNS.join(", ")}`)
    .eq("id", submissionId)
    .maybeSingle();
  if (error) throw error;
  if (!submission) return console.log("  ! submission not found, skipped");
  if (!submission.vehicle_id) return console.log("  ! submission has no vehicle_id (not published), skipped");

  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select(`id, brand, model, status, source_type, submitted_vehicle_id, ${DETAIL_COLUMNS.join(", ")}`)
    .eq("id", submission.vehicle_id)
    .maybeSingle();
  if (vehicleError) throw vehicleError;
  if (!vehicle) return console.log(`  ! vehicle ${submission.vehicle_id} not found, skipped`);
  console.log(`  ${submission.brand} ${submission.model}, sales_type=${JSON.stringify(submission.sales_type)}`);
  console.log(`  vehicle ${vehicle.id}: status=${vehicle.status}, source_type=${vehicle.source_type}`);

  // 1 + 2: source, link, details
  const sourceType = sourceTypeFor(submission.sales_type);
  if (!sourceType) return console.log("  ! unknown sales_type, nothing changed for this vehicle");
  const update = { source_type: sourceType, submitted_vehicle_id: submission.id };
  for (const column of DETAIL_COLUMNS) update[column] = submission[column] ?? null;
  const changes = Object.entries(update).filter(([column, value]) => (vehicle[column] ?? null) !== value);
  if (changes.length === 0) console.log("  vehicle columns: already correct");
  for (const [column, value] of changes) console.log(`  vehicle.${column}: ${JSON.stringify(vehicle[column] ?? null)} -> ${JSON.stringify(value)}`);
  if (apply && changes.length > 0) {
    const { error: updateError } = await supabase
      .from("vehicles")
      .update({ ...Object.fromEntries(changes), updated_at: new Date().toISOString() })
      .eq("id", vehicle.id);
    if (updateError) throw updateError;
    console.log("  vehicle columns: updated");
  }

  // 3: photos
  const { count: existingRows, error: countError } = await supabase
    .from("vehicle_images")
    .select("id", { count: "exact", head: true })
    .eq("vehicle_id", vehicle.id);
  if (countError) throw countError;
  const { data: existingFiles } = await supabase.storage.from("vehicle-images").list(vehicle.id, { limit: 1000 });
  console.log(`  vehicle_images rows: ${existingRows}; files in vehicle-images/${vehicle.id}/: ${existingFiles?.length ?? 0}`);
  if (existingRows > 0) return console.log("  photos: vehicle already has images, skipped");

  const { data: images, error: imagesError } = await supabase
    .from("submitted_vehicle_images")
    .select("image_url, sort_order, is_main")
    .eq("submitted_vehicle_id", submission.id)
    .order("sort_order", { ascending: true });
  if (imagesError) throw imagesError;
  const mainIndex = images.findIndex((image) => image.is_main);
  const ordered = mainIndex > 0 ? [images[mainIndex], ...images.filter((_, i) => i !== mainIndex)] : images;
  if (ordered.length === 0) return console.log("  photos: submission has none");

  const rows = [];
  for (const image of ordered) {
    const targetPath = `${vehicle.id}/${image.image_url.split("/").pop()}`;
    console.log(`  photo ${rows.length}${image.is_main ? " (main)" : ""}: ${image.image_url} -> vehicle-images/${targetPath}`);
    if (!apply) {
      rows.push(null);
      continue;
    }
    const { data: file, error: downloadError } = await supabase.storage.from("customer-submitted-photos").download(image.image_url);
    if (downloadError || !file) throw new Error(`download ${image.image_url}: ${downloadError?.message}`);
    const { error: uploadError } = await supabase.storage
      .from("vehicle-images")
      .upload(targetPath, file, { contentType: file.type || undefined, cacheControl: "3600", upsert: true });
    if (uploadError) throw new Error(`upload ${targetPath}: ${uploadError.message}`);
    const { data: publicUrl } = supabase.storage.from("vehicle-images").getPublicUrl(targetPath);
    rows.push({ vehicle_id: vehicle.id, image_url: publicUrl.publicUrl, sort_order: rows.length });
  }
  if (apply) {
    const { error: insertError } = await supabase.from("vehicle_images").upsert(rows, { onConflict: "vehicle_id,image_url" });
    if (insertError) throw insertError;
    console.log(`  photos: ${rows.length} copied`);
  }
}

console.log(apply ? "MODE: APPLY (writes)" : "MODE: DRY RUN (no writes; add --apply to write)");
for (const id of SUBMISSION_IDS) await backfill(id);
console.log("\nDone.");
