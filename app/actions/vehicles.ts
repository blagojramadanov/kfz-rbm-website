"use server";

import { getSupabaseUser, getSupabaseServerClient } from "@/lib/supabase-server";
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
    const { data: images } = await supabase
      .from("submitted_vehicle_images")
      .select("*")
      .eq("submitted_vehicle_id", vehicleId)
      .order("sort_order", { ascending: true });

    return { vehicle, images: images || [] };
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    throw new Error(
      error instanceof Error ? error.message : "Fehler beim Abrufen des Fahrzeugs"
    );
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
        const { data: images } = await supabase
          .from("submitted_vehicle_images")
          .select("image_url")
          .eq("submitted_vehicle_id", vehicle.id)
          .order("sort_order", { ascending: true });

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
  images: string[]
) {
  try {
    const { supabase, user } = await getSupabaseUser();

    const { data: vehicle, error: vehicleError } = await supabase
      .from("submitted_vehicles")
      .insert({
        user_id: user.id,
        ...vehicleData,
        status: "eingereicht",
      })
      .select()
      .single();

    if (vehicleError || !vehicle) {
      throw vehicleError || new Error("Fahrzeug konnte nicht erstellt werden");
    }

    // Upload images to private bucket
    if (images && images.length > 0) {
      const base64Images = images.filter((img) => img.startsWith("data:"));

      for (let i = 0; i < base64Images.length; i++) {
        const base64 = base64Images[i];
        const storagePath = `${user.id}/${vehicle.id}/${Date.now()}-${i}.jpg`;

        // Convert base64 to blob
        let blob;
        try {
          const response = await fetch(base64);
          blob = await response.blob();
        } catch (e) {
          try {
            const parts = base64.split(',');
            const byteCharacters = atob(parts[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let j = 0; j < byteCharacters.length; j++) {
              byteNumbers[j] = byteCharacters.charCodeAt(j);
            }
            blob = new Blob([new Uint8Array(byteNumbers)], { type: 'image/jpeg' });
          } catch (fallbackError) {
            continue;
          }
        }

        // Upload to private bucket
        const { error: uploadError } = await supabase.storage
          .from("customer-submitted-photos")
          .upload(storagePath, blob, { upsert: false });

        if (uploadError) continue;

        // Save image record with storage path (not public URL)
        const { error: insertError } = await supabase.from("submitted_vehicle_images").insert({
          submitted_vehicle_id: vehicle.id,
          image_url: storagePath,
          sort_order: i,
          is_main: i === 0,
        });

        if (insertError) continue;
      }
    }

    return {
      success: true,
      vehicleId: vehicle.id,
      message: "Fahrzeug eingereicht",
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Fehler beim Erstellen des Fahrzeugs");
  }
}

export async function uploadVehicleImagesBase64(vehicleId: string, filesData: { name: string; data: string }[]) {
  try {
    const { getSupabaseAdminClient } = await import("@/lib/supabase-admin");
    const supabase = getSupabaseAdminClient();

    // Verify vehicle exists
    const { data: vehicle, error: fetchError } = await supabase
      .from("vehicles")
      .select("id, brand, model")
      .eq("id", vehicleId)
      .single();

    if (fetchError || !vehicle) {
      throw new Error("Fahrzeug nicht gefunden");
    }

    const uploadResults: any[] = [];

    for (let i = 0; i < filesData.length; i++) {
      const fileData = filesData[i];
      const imageUrl = `${vehicleId}/${Date.now()}-${i}-${fileData.name.replace(/[^a-z0-9.]/gi, '_')}`;

      try {
        // Convert base64 to blob
        const response = await fetch(fileData.data);
        const blob = await response.blob();

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("vehicle-images")
          .upload(imageUrl, blob, { cacheControl: "3600" });

        if (uploadError) {
          uploadResults.push({ index: i, success: false, error: uploadError.message });
          continue;
        }

        // Get public URL
        const { data: publicUrl } = supabase.storage
          .from("vehicle-images")
          .getPublicUrl(imageUrl);

        // Save image record to database
        const { error: insertError } = await supabase
          .from("vehicle_images")
          .insert({
            vehicle_id: vehicleId,
            image_url: publicUrl.publicUrl,
            sort_order: i,
          });

        if (insertError) {
          uploadResults.push({ index: i, success: false, error: insertError.message });
          continue;
        }

        uploadResults.push({ index: i, success: true, url: publicUrl.publicUrl });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unbekannter Fehler";
        uploadResults.push({ index: i, success: false, error: errMsg });
      }
    }

    const successCount = uploadResults.filter((r) => r.success).length;
    const failedCount = uploadResults.filter((r) => !r.success).length;

    if (failedCount > 0) {
      throw new Error(`${failedCount} von ${filesData.length} Bilder konnten nicht hochgeladen werden`);
    }

    return {
      success: true,
      message: `${successCount} Bilder erfolgreich hochgeladen`,
      uploadedCount: successCount,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Fehler beim Hochladen";
    throw new Error(errorMsg);
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

export async function acceptOffer(vehicleId: string) {
  try {
    const { supabase, user } = await getSupabaseUser();
    const { getSupabaseAdminClient } = await import("@/lib/supabase-admin");

    // 1. Load submission with user client (RLS ensures it's theirs)
    const { data: vehicle, error: fetchError } = await supabase
      .from("submitted_vehicles")
      .select("id, user_id, status")
      .eq("id", vehicleId)
      .single();

    if (fetchError || !vehicle) {
      throw new Error("Fahrzeug nicht gefunden");
    }

    if (vehicle.user_id !== user.id) {
      throw new Error("Sie sind nicht berechtigt, dieses Angebot anzunehmen");
    }

    if (vehicle.status !== "angebot_gesendet") {
      throw new Error("Dieses Fahrzeug hat kein ausstehend Angebot");
    }

    // 2. Update with service_role (bypass RLS, update ONLY status and timestamp)
    const adminClient = getSupabaseAdminClient();
    const now = new Date().toISOString();
    const { error: updateError } = await adminClient
      .from("submitted_vehicles")
      .update({
        status: "akzeptiert",
        offer_accepted_at: now,
        updated_at: now,
      })
      .eq("id", vehicleId);

    if (updateError) throw updateError;

    return {
      success: true,
      message: "Angebot akzeptiert. Kontaktieren Sie uns für die nächsten Schritte."
    };
  } catch (error) {
    console.error("Error accepting offer:", error);
    throw new Error(error instanceof Error ? error.message : "Fehler beim Akzeptieren des Angebots");
  }
}

export async function rejectOffer(vehicleId: string) {
  try {
    const { supabase, user } = await getSupabaseUser();
    const { getSupabaseAdminClient } = await import("@/lib/supabase-admin");

    // 1. Load submission with user client (RLS ensures it's theirs)
    const { data: vehicle, error: fetchError } = await supabase
      .from("submitted_vehicles")
      .select("id, user_id, status")
      .eq("id", vehicleId)
      .single();

    if (fetchError || !vehicle) {
      throw new Error("Fahrzeug nicht gefunden");
    }

    if (vehicle.user_id !== user.id) {
      throw new Error("Sie sind nicht berechtigt, dieses Angebot abzulehnen");
    }

    if (vehicle.status !== "angebot_gesendet") {
      throw new Error("Dieses Fahrzeug hat kein ausstehend Angebot");
    }

    // 2. Update with service_role (bypass RLS, update ONLY status and timestamp)
    const adminClient = getSupabaseAdminClient();
    const now = new Date().toISOString();
    const { error: updateError } = await adminClient
      .from("submitted_vehicles")
      .update({
        status: "eingereicht",
        offer_rejected_at: now,
        updated_at: now,
      })
      .eq("id", vehicleId);

    if (updateError) throw updateError;

    return {
      success: true,
      message: "Angebot abgelehnt. Sie können andere Angebote erhalten."
    };
  } catch (error) {
    console.error("Error rejecting offer:", error);
    throw new Error(error instanceof Error ? error.message : "Fehler beim Ablehnen des Angebots");
  }
}
