"use server";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { SubmittedVehicle } from "@/lib/supabase";

export async function getSubmittedVehicleById(vehicleId: string, userId: string) {
  try {
    const { supabase } = await getSupabaseServerClient();

    // Fetch single vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from("submitted_vehicles")
      .select("*")
      .eq("id", vehicleId)
      .eq("user_id", userId)
      .single();

    if (vehicleError || !vehicle) {
      throw new Error("Fahrzeug nicht gefunden");
    }

    // Fetch images
    const { data: images, error: imagesError } = await supabase
      .from("submitted_vehicle_images")
      .select("*")
      .eq("submitted_vehicle_id", vehicleId)
      .order("sort_order", { ascending: true });

    if (imagesError) {
      console.error("Error fetching images:", imagesError);
      return { vehicle, images: [] };
    }

    return { vehicle, images: images || [] };
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    throw new Error(
      error instanceof Error ? error.message : "Fehler beim Abrufen des Fahrzeugs"
    );
  }
}

export async function debugVehicleImages(vehicleId: string) {
  try {
    const { supabase } = await getSupabaseServerClient();

    const { data: images, error } = await supabase
      .from("submitted_vehicle_images")
      .select("*")
      .eq("submitted_vehicle_id", vehicleId);

    if (error) throw error;

    console.log(`[DEBUG] Images for vehicle ${vehicleId}:`, images);
    return { success: true, imagesCount: images?.length || 0, images };
  } catch (error) {
    console.error("Debug error:", error);
    throw error;
  }
}

export async function debugStorageAndVehicle(vehicleId: string) {
  try {
    const { supabase } = await getSupabaseServerClient();

    console.log("\n========== STORAGE DIAGNOSTIC ==========");

    // Check if bucket exists by trying to list files
    console.log("[STORAGE] Attempting to list files in 'vehicle-images' bucket...");
    const { data: files, error: listError } = await supabase.storage
      .from("vehicle-images")
      .list();

    if (listError) {
      console.error("[STORAGE] ❌ Failed to list bucket contents:", {
        message: listError.message,
        statusCode: (listError as any).statusCode,
        error: listError,
      });
    } else {
      console.log("[STORAGE] ✅ Bucket 'vehicle-images' exists and is accessible");
      console.log(`[STORAGE] Files in bucket: ${files?.length || 0}`);
    }

    console.log("\n========== VEHICLE DIAGNOSTIC ==========");

    // Check vehicle status
    const { data: vehicle, error: vehicleError } = await supabase
      .from("submitted_vehicles")
      .select("id, status, user_id, brand, model")
      .eq("id", vehicleId)
      .single();

    if (vehicleError) {
      console.error("[VEHICLE] ❌ Failed to fetch vehicle:", vehicleError);
    } else {
      console.log("[VEHICLE] ✅ Vehicle found:", {
        id: vehicle?.id,
        status: vehicle?.status,
        user_id: vehicle?.user_id,
        brand: vehicle?.brand,
        model: vehicle?.model,
      });
    }

    // Check for images related to this vehicle
    const { data: images, error: imagesError } = await supabase
      .from("submitted_vehicle_images")
      .select("id, image_url, sort_order")
      .eq("submitted_vehicle_id", vehicleId);

    if (imagesError) {
      console.error("[VEHICLE] ❌ Failed to fetch images:", imagesError);
    } else {
      console.log(`[VEHICLE] Images for this vehicle: ${images?.length || 0}`);
      images?.forEach((img, idx) => {
        console.log(`  [${idx}] ${img.image_url}`);
      });
    }

    console.log("\n========== RLS POLICY CHECK ==========");
    console.log("[RLS] Vehicle status for image insert policy: MUST be 'draft'");
    console.log(`[RLS] Current vehicle status: '${vehicle?.status}'`);
    if (vehicle?.status !== 'draft') {
      console.warn(`[RLS] ⚠️ MISMATCH: Vehicle status is '${vehicle?.status}' but image insert requires 'draft'`);
    }

    return {
      success: true,
      storage: { bucketExists: !listError, error: listError?.message },
      vehicle: vehicle,
      images: images,
    };
  } catch (error) {
    console.error("[DIAGNOSTIC] Unexpected error:", error);
    throw error;
  }
}

export async function getSubmittedVehicles(userId: string): Promise<SubmittedVehicle[]> {
  try {
    const { supabase } = await getSupabaseServerClient();

    // Fetch vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from("submitted_vehicles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (vehiclesError) throw vehiclesError;
    if (!vehicles) return [];

    // Fetch images for each vehicle
    const vehiclesWithImages = await Promise.all(
      vehicles.map(async (vehicle) => {
        const { data: images, error: imagesError } = await supabase
          .from("submitted_vehicle_images")
          .select("image_url")
          .eq("submitted_vehicle_id", vehicle.id)
          .order("sort_order", { ascending: true });

        if (imagesError) {
          console.error("Error fetching images for vehicle", vehicle.id, ":", imagesError);
          return {
            ...vehicle,
            images: [],
          };
        }

        const vehicleImages = images?.map((img) => img.image_url) || [];
        console.log(`[DEBUG] Vehicle ${vehicle.id} (${vehicle.brand} ${vehicle.model}): Found ${vehicleImages.length} images`);

        return {
          ...vehicle,
          images: vehicleImages,
        };
      })
    );

    console.log("[DEBUG] getSubmittedVehicles returning:", vehiclesWithImages.map(v => ({ id: v.id, brand: v.brand, imageCount: v.images.length })));
    return vehiclesWithImages as SubmittedVehicle[];
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    throw new Error(error instanceof Error ? error.message : "Fehler beim Abrufen der Fahrzeuge");
  }
}

export async function deleteVehicle(vehicleId: string, userId: string) {
  try {
    const { supabase } = await getSupabaseServerClient();

    // Verify ownership and status (can only delete draft)
    const { data: vehicle, error: fetchError } = await supabase
      .from("submitted_vehicles")
      .select("user_id, status")
      .eq("id", vehicleId)
      .single();

    if (fetchError || !vehicle) {
      throw new Error("Fahrzeug nicht gefunden");
    }

    if (vehicle.user_id !== userId) {
      throw new Error("Sie sind nicht berechtigt, dieses Fahrzeug zu löschen");
    }

    // Only allow deletion of draft vehicles
    if (vehicle.status !== "draft") {
      throw new Error("Nur Entwürfe können gelöscht werden");
    }

    // Delete vehicle (cascades to images via DB RLS)
    const { error } = await supabase
      .from("submitted_vehicles")
      .delete()
      .eq("id", vehicleId)
      .eq("user_id", userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    throw new Error(error instanceof Error ? error.message : "Fehler beim Löschen des Fahrzeugs");
  }
}

export async function updateVehicleStatus(vehicleId: string, userId: string, newStatus: string) {
  const debugInfo: any = {
    vehicleId,
    newStatus,
    timestamp: new Date().toISOString(),
  };

  try {
    const { supabase } = await getSupabaseServerClient();

    // Verify ownership and current status
    const { data: vehicle, error: fetchError } = await supabase
      .from("submitted_vehicles")
      .select("user_id, status")
      .eq("id", vehicleId)
      .single();

    if (fetchError || !vehicle) {
      debugInfo.fetchError = fetchError?.message || "Vehicle not found";
      throw new Error("Fahrzeug nicht gefunden");
    }

    debugInfo.currentStatus = vehicle.status;

    if (vehicle.user_id !== userId) {
      debugInfo.ownershipError = "User ID mismatch";
      throw new Error("Sie sind nicht berechtigt, dieses Fahrzeug zu ändern");
    }

    // Allow draft -> eingereicht (or other new statuses) transition
    if (vehicle.status === "draft") {
      const { data: updateData, error } = await supabase
        .from("submitted_vehicles")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", vehicleId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        debugInfo.updateError = {
          message: error.message,
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint,
        };
        throw error;
      }

      debugInfo.updateSuccess = true;
      debugInfo.newStatus = updateData?.status;

      return {
        success: true,
        message: "Fahrzeug erfolgreich eingereicht",
        _debug: debugInfo,
      };
    }

    debugInfo.transitionError = `Cannot transition from ${vehicle.status} to ${newStatus}`;
    throw new Error("Nur Entwürfe können eingereicht werden");
  } catch (error) {
    console.error("Error updating vehicle status:", error);
    const errorMessage = error instanceof Error ? error.message : "Fehler beim Aktualisieren des Fahrzeug-Status";
    debugInfo.errorMessage = errorMessage;
    debugInfo.errorType = error instanceof Error ? error.constructor.name : typeof error;

    throw new Error(JSON.stringify({
      message: errorMessage,
      _debug: debugInfo,
    }));
  }
}

export async function updateVehicleDraft(vehicleId: string, userId: string, updates: Record<string, any>) {
  try {
    const { supabase } = await getSupabaseServerClient();

    // Verify ownership and status (can only edit draft)
    const { data: vehicle, error: fetchError } = await supabase
      .from("submitted_vehicles")
      .select("user_id, status")
      .eq("id", vehicleId)
      .single();

    if (fetchError || !vehicle) {
      throw new Error("Fahrzeug nicht gefunden");
    }

    if (vehicle.user_id !== userId) {
      throw new Error("Sie sind nicht berechtigt, dieses Fahrzeug zu bearbeiten");
    }

    if (vehicle.status !== "draft") {
      throw new Error("Nur Entwürfe können bearbeitet werden");
    }

    // Update vehicle
    const { error } = await supabase
      .from("submitted_vehicles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", vehicleId)
      .eq("user_id", userId);

    if (error) throw error;

    return { success: true, message: "Fahrzeug aktualisiert" };
  } catch (error) {
    console.error("Error updating vehicle draft:", error);
    throw new Error(error instanceof Error ? error.message : "Fehler beim Aktualisieren des Fahrzeugs");
  }
}

export async function updateVehicleImages(
  vehicleId: string,
  userId: string,
  updates: {
    newImages?: string[];
    imagesToRemove?: string[];
    imageOrder?: string[];
    mainImageId?: string;
    mainNewImageIndex?: number;
  }
) {
  try {
    const { supabase } = await getSupabaseServerClient();

    // Verify ownership and draft status
    const { data: vehicle, error: fetchError } = await supabase
      .from("submitted_vehicles")
      .select("user_id, status")
      .eq("id", vehicleId)
      .single();

    if (fetchError || !vehicle) {
      throw new Error("Fahrzeug nicht gefunden");
    }

    if (vehicle.user_id !== userId) {
      throw new Error("Sie sind nicht berechtigt, dieses Fahrzeug zu bearbeiten");
    }

    if (vehicle.status !== "draft") {
      throw new Error("Nur Entwürfe können bearbeitet werden");
    }

    // Remove images
    if (updates.imagesToRemove && updates.imagesToRemove.length > 0) {
      // Get image URLs before deletion
      const { data: imagesToDelete } = await supabase
        .from("submitted_vehicle_images")
        .select("id, image_url")
        .in("id", updates.imagesToRemove)
        .eq("submitted_vehicle_id", vehicleId);

      if (imagesToDelete) {
        // Delete from storage
        for (const img of imagesToDelete) {
          const filePath = img.image_url.split("/vehicle-images/")[1];
          if (filePath) {
            await supabase.storage.from("vehicle-images").remove([filePath]);
          }
        }
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from("submitted_vehicle_images")
        .delete()
        .in("id", updates.imagesToRemove);

      if (deleteError) throw deleteError;
    }

    // Upload new images
    const newImageIds: string[] = [];
    if (updates.newImages && updates.newImages.length > 0) {
      const base64Images = updates.newImages.filter((img) =>
        img.startsWith("data:")
      );

      // Get current max sort_order
      const { data: existingImages } = await supabase
        .from("submitted_vehicle_images")
        .select("sort_order")
        .eq("submitted_vehicle_id", vehicleId)
        .order("sort_order", { ascending: false })
        .limit(1);

      let nextSortOrder =
        (existingImages?.[0]?.sort_order ?? -1) + 1;

      for (let i = 0; i < base64Images.length; i++) {
        const base64 = base64Images[i];
        const imageUrl = `${vehicleId}/${Date.now()}-${i}.jpg`;

        // Convert base64 to blob
        let blob;
        try {
          const response = await fetch(base64);
          blob = await response.blob();
        } catch (e) {
          console.error("Failed to fetch base64, trying direct conversion:", e);
          // Fallback: convert base64 string directly to blob
          const byteCharacters = atob(base64.split(',')[1]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], { type: 'image/jpeg' });
        }

        const { error: uploadError } = await supabase.storage
          .from("vehicle-images")
          .upload(imageUrl, blob, { cacheControl: "3600" });

        if (uploadError) {
          console.error("Image upload error:", uploadError);
          continue;
        }

        const { data: publicUrl } = supabase.storage
          .from("vehicle-images")
          .getPublicUrl(imageUrl);

        const isMainNewImage = i === updates.mainNewImageIndex;
        const { data: insertedImage, error: insertError } = await supabase
          .from("submitted_vehicle_images")
          .insert({
            submitted_vehicle_id: vehicleId,
            image_url: publicUrl.publicUrl,
            sort_order: nextSortOrder + i,
            is_main: isMainNewImage,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error inserting image record:", insertError);
          continue;
        }

        if (insertedImage) {
          newImageIds.push(insertedImage.id);
        }

        console.log(`[DEBUG] Image ${i} uploaded successfully for vehicle ${vehicleId}: ${publicUrl.publicUrl}`);
      }

      // If a new image is being set as main, clear is_main from all other images
      if (updates.mainNewImageIndex !== undefined && newImageIds.length > updates.mainNewImageIndex) {
        const mainNewImageId = newImageIds[updates.mainNewImageIndex];
        const { error: clearError } = await supabase
          .from("submitted_vehicle_images")
          .update({ is_main: false })
          .eq("submitted_vehicle_id", vehicleId)
          .neq("id", mainNewImageId);

        if (clearError) throw clearError;
      }
    }

    // Update sort order and main image (use newImageIds for newly uploaded images)
    if (updates.imageOrder && updates.imageOrder.length > 0) {
      for (let i = 0; i < updates.imageOrder.length; i++) {
        const imageId = updates.imageOrder[i];
        const isMain = imageId === updates.mainImageId;

        const { error: updateError } = await supabase
          .from("submitted_vehicle_images")
          .update({
            sort_order: i,
            is_main: isMain,
          })
          .eq("id", imageId)
          .eq("submitted_vehicle_id", vehicleId);

        if (updateError) throw updateError;
      }
    } else if (updates.mainImageId) {
      // Just update main image if no reordering
      const { error: mainError } = await supabase
        .from("submitted_vehicle_images")
        .update({ is_main: true })
        .eq("id", updates.mainImageId)
        .eq("submitted_vehicle_id", vehicleId);

      if (mainError) throw mainError;

      // Remove main from other images
      const { error: clearError } = await supabase
        .from("submitted_vehicle_images")
        .update({ is_main: false })
        .eq("submitted_vehicle_id", vehicleId)
        .neq("id", updates.mainImageId);

      if (clearError) throw clearError;
    }

    return { success: true, message: "Bilder aktualisiert" };
  } catch (error) {
    console.error("Error updating vehicle images:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Fehler beim Aktualisieren der Bilder"
    );
  }
}

export async function createSubmittedVehicle(
  userId: string,
  vehicleData: {
    brand: string;
    model: string;
    year: number;
    mileage: number;
    price?: number;
    transmission?: string;
    fuel_type?: string;
    body_type?: string;
    color?: string;
    power_hp?: number;
    description?: string;
    sales_type?: string;
    commission?: number | null;
  },
  images: string[],
  isDraft: boolean = true
) {
  console.log("\n========== CREATE_SUBMITTED_VEHICLE CALLED ==========");
  console.log(`[CREATE_VEHICLE] Function START - userId: ${userId}`);
  console.log(`[CREATE_VEHICLE] isDraft parameter: ${isDraft}`);
  console.log(`[CREATE_VEHICLE] Images array received: ${images ? images.length : 'null'} items`);
  if (images && images.length > 0) {
    console.log(`[CREATE_VEHICLE] First image type: ${images[0]?.substring(0, 50)}...`);
  }

  try {
    const { supabase } = await getSupabaseServerClient();
    console.log(`[CREATE_VEHICLE] Supabase client initialized`);

    // Create vehicle
    console.log(`[CREATE_VEHICLE] Creating vehicle with status: draft (will be updated to eingereicht after upload)`);
    console.log(`[CREATE_VEHICLE] Vehicle data:`, {
      brand: vehicleData.brand,
      model: vehicleData.model,
      year: vehicleData.year,
    });

    const { data: vehicle, error: vehicleError } = await supabase
      .from("submitted_vehicles")
      .insert({
        user_id: userId,
        ...vehicleData,
        status: "draft",
      })
      .select()
      .single();

    if (vehicleError || !vehicle) {
      console.error(`[CREATE_VEHICLE] ❌ Vehicle creation failed:`, vehicleError);
      throw vehicleError || new Error("Fahrzeug konnte nicht erstellt werden");
    }

    console.log(`[CREATE_VEHICLE] ✅ Vehicle created successfully with ID: ${vehicle.id}, status: ${vehicle.status}`);

    // Upload images if provided
    const uploadResults: Array<{
      index: number;
      success: boolean;
      storageError?: string;
      insertError?: string;
      publicUrl?: string;
      blobSize?: number;
      conversionError?: string;
    }> = [];

    console.log(`[DEBUG] About to check images: images.length=${images?.length}, condition result=${images && images.length > 0}`);
    if (images && images.length > 0) {
      console.log(`[IMAGE_UPLOAD] Starting image upload for vehicle ${vehicle.id}. Total images received: ${images.length}`);

      // Filter base64 images (local uploads)
      const base64Images = images.filter((img) => img.startsWith("data:"));
      console.log(`[IMAGE_UPLOAD] Base64 images after filtering: ${base64Images.length}`);

      for (let i = 0; i < base64Images.length; i++) {
        const base64 = base64Images[i];
        const imageUrl = `${vehicle.id}/${Date.now()}-${i}.jpg`;
        const resultEntry: any = { index: i, success: false };

        console.log(`[IMAGE_UPLOAD] Processing image ${i + 1}/${base64Images.length}: ${imageUrl}`);
        console.log(`[IMAGE_UPLOAD] Base64 string length: ${base64.length} chars`);

        // Convert base64 to blob
        let blob;
        try {
          console.log(`[IMAGE_UPLOAD] Image ${i}: Attempting fetch-based conversion`);
          const response = await fetch(base64);
          blob = await response.blob();
          resultEntry.blobSize = blob.size;
          console.log(`[IMAGE_UPLOAD] Image ${i}: Fetch-based conversion successful. Blob size: ${blob.size} bytes`);
        } catch (e) {
          console.warn(`[IMAGE_UPLOAD] Image ${i}: Fetch conversion failed, attempting fallback:`, e);
          try {
            // Fallback: convert base64 string directly to blob
            const parts = base64.split(',');
            if (parts.length !== 2) {
              throw new Error(`Invalid base64 format: expected 2 parts, got ${parts.length}`);
            }
            const byteCharacters = atob(parts[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let j = 0; j < byteCharacters.length; j++) {
              byteNumbers[j] = byteCharacters.charCodeAt(j);
            }
            const byteArray = new Uint8Array(byteNumbers);
            blob = new Blob([byteArray], { type: 'image/jpeg' });
            resultEntry.blobSize = blob.size;
            console.log(`[IMAGE_UPLOAD] Image ${i}: Fallback conversion successful. Blob size: ${blob.size} bytes`);
          } catch (fallbackError) {
            console.error(`[IMAGE_UPLOAD] Image ${i}: Both conversion methods failed:`, fallbackError);
            resultEntry.conversionError = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
            uploadResults.push(resultEntry);
            continue;
          }
        }

        // Upload to Supabase Storage
        console.log(`[IMAGE_UPLOAD] Image ${i}: Starting Supabase Storage upload to bucket "vehicle-images", path: "${imageUrl}"`);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("vehicle-images")
          .upload(imageUrl, blob, { cacheControl: "3600" });

        if (uploadError) {
          console.error(`[IMAGE_UPLOAD] Image ${i}: Storage upload FAILED`, {
            message: uploadError.message,
            statusCode: (uploadError as any).statusCode,
            error: uploadError,
          });
          resultEntry.storageError = uploadError.message;
          uploadResults.push(resultEntry);
          continue;
        }

        console.log(`[IMAGE_UPLOAD] Image ${i}: Storage upload successful`, { uploadData });

        // Get public URL
        const { data: publicUrl } = supabase.storage
          .from("vehicle-images")
          .getPublicUrl(imageUrl);

        resultEntry.publicUrl = publicUrl.publicUrl;
        console.log(`[IMAGE_UPLOAD] Image ${i}: Public URL generated: ${publicUrl.publicUrl}`);

        // Save image record (first image is main)
        console.log(`[IMAGE_UPLOAD] Image ${i}: Inserting into submitted_vehicle_images table. submitted_vehicle_id=${vehicle.id}, is_main=${i === 0}`);
        const { data: insertData, error: insertError } = await supabase.from("submitted_vehicle_images").insert({
          submitted_vehicle_id: vehicle.id,
          image_url: publicUrl.publicUrl,
          sort_order: i,
          is_main: i === 0,
        });

        if (insertError) {
          console.error(`[IMAGE_UPLOAD] Image ${i}: Database insert FAILED`, {
            message: insertError.message,
            code: (insertError as any).code,
            details: (insertError as any).details,
            error: insertError,
          });
          resultEntry.insertError = insertError.message;
          uploadResults.push(resultEntry);
          continue;
        }

        console.log(`[IMAGE_UPLOAD] Image ${i}: Database insert successful`, { insertData });
        console.log(`[IMAGE_UPLOAD] ✅ Image ${i} uploaded successfully for vehicle ${vehicle.id}: ${publicUrl.publicUrl}`);
        resultEntry.success = true;
        uploadResults.push(resultEntry);
      }

      console.log(`[IMAGE_UPLOAD] ✅ Completed image upload for vehicle ${vehicle.id}`);
    } else {
      console.log(`[IMAGE_UPLOAD] ⚠️  No images to upload for vehicle ${vehicle.id} - images array was empty or falsy`);
      console.log(`[IMAGE_UPLOAD] images value:`, images);
    }

    const successfulUploads = uploadResults.filter(r => r.success).length;
    const failedUploads = uploadResults.filter(r => !r.success).length;

    console.log(`[CREATE_VEHICLE] ========== FUNCTION COMPLETE ==========`);
    console.log(`[CREATE_VEHICLE] Vehicle ID: ${vehicle.id}`);
    console.log(`[CREATE_VEHICLE] Status: ${isDraft ? "draft" : "submitted"}`);
    console.log(`[CREATE_VEHICLE] Images processed: ${images?.length || 0}`);
    console.log(`[CREATE_VEHICLE] Successful uploads: ${successfulUploads}, Failed: ${failedUploads}`);

    return {
      success: true,
      vehicleId: vehicle.id,
      message: `Fahrzeug ${isDraft ? "als Entwurf gespeichert" : "eingereicht"}`,
      _debug: {
        imagesReceived: images?.length || 0,
        imagesSuccessfullyUploaded: successfulUploads,
        imagesFailed: failedUploads,
        uploadResults: uploadResults,
        timestamp: new Date().toISOString(),
        functionExecuted: true
      }
    };
  } catch (error) {
    console.error("\n========== CREATE_SUBMITTED_VEHICLE ERROR ==========");
    console.error("[CREATE_VEHICLE] ❌ Error creating vehicle:", error);
    console.error("[CREATE_VEHICLE] Error message:", error instanceof Error ? error.message : String(error));
    throw new Error(error instanceof Error ? error.message : "Fehler beim Erstellen des Fahrzeugs");
  }
}

export async function finalizeSubmission(vehicleId: string, userId: string) {
  try {
    console.log(`[FINALIZE] Starting finalizeSubmission for vehicle ${vehicleId}, user ${userId}`);

    const { getSupabaseAdminClient } = await import("@/lib/supabase-admin");
    const supabase = getSupabaseAdminClient();
    console.log(`[FINALIZE] Admin client initialized`);

    // Verify ownership
    const { data: vehicle, error: fetchError } = await supabase
      .from("submitted_vehicles")
      .select("user_id, status")
      .eq("id", vehicleId)
      .single();

    console.log(`[FINALIZE] Fetch result:`, { vehicle, fetchError });

    if (fetchError || !vehicle) {
      throw new Error(`Fahrzeug nicht gefunden: ${fetchError?.message || "no data"}`);
    }

    if (vehicle.user_id !== userId) {
      throw new Error("Sie sind nicht berechtigt, dieses Fahrzeug zu ändern");
    }

    console.log(`[FINALIZE] Ownership verified. Current status: ${vehicle.status}. Updating to eingereicht...`);

    // Update status to eingereicht using admin client (bypass RLS)
    const { data: updateData, error } = await supabase
      .from("submitted_vehicles")
      .update({
        status: "eingereicht",
        updated_at: new Date().toISOString(),
      })
      .eq("id", vehicleId);

    console.log(`[FINALIZE] Update result:`, { updateData, error });

    if (error) {
      throw new Error(`Update failed: ${error.message}`);
    }

    console.log(`[FINALIZE] ✅ Successfully finalized submission`);
    return { success: true, message: "Fahrzeug erfolgreich eingereicht" };
  } catch (error) {
    console.error("[FINALIZE] Error finalizing submission:", error);
    throw new Error(error instanceof Error ? error.message : "Fehler beim Einreichen des Fahrzeugs");
  }
}
