/**
 * Image values as stored in `vehicle_images.image_url`: normally the public URL
 * of the `vehicle-images` bucket (uploadVehicleImage(), copySubmissionPhotos()).
 * Older or hand-made rows can instead hold a raw storage path ("{vehicleId}/x.jpg",
 * "vehicle-images/{vehicleId}/x.jpg") or an expired signed URL of the same public
 * bucket. Those are turned into the public URL, the way the working rows are built,
 * instead of being dropped or rendered as a broken image.
 */

export const PUBLIC_VEHICLE_BUCKET = "vehicle-images";

const SIGNED_PREFIX = `/storage/v1/object/sign/${PUBLIC_VEHICLE_BUCKET}/`;

function safeDecode(part: string): string {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

function publicUrl(path: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  if (!base || !path) return null;
  // Decoded first so an already encoded path is not encoded twice.
  const encoded = path.split("/").filter(Boolean).map((part) => encodeURIComponent(safeDecode(part))).join("/");
  return `${base}/storage/v1/object/public/${PUBLIC_VEHICLE_BUCKET}/${encoded}`;
}

/** Displayable URL for a stored vehicle image value, or null when it is empty. */
export function resolveVehicleImageUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    // A signed URL of the public bucket expires; its public URL does not.
    try {
      const url = new URL(trimmed);
      const index = url.pathname.indexOf(SIGNED_PREFIX);
      if (index !== -1) return publicUrl(url.pathname.slice(index + SIGNED_PREFIX.length)) ?? trimmed;
    } catch {
      // Not a parseable URL (data:/blob: are fine); use it as it is.
    }
    return trimmed;
  }

  const path = trimmed
    .replace(/^\/+/, "")
    .replace(/^storage\/v1\/object\/(public|sign)\//, "")
    .replace(new RegExp(`^${PUBLIC_VEHICLE_BUCKET}/`), "")
    .split("?")[0];
  return publicUrl(path);
}
