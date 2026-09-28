import { z } from "zod";

/** Server-side validation of images that arrive as base64 data URLs (server actions). */

export const MAX_IMAGES_PER_REQUEST = 20;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

/** A data URL for a jpeg/png/webp image no larger than MAX_IMAGE_BYTES. */
export const imageDataUrlSchema = z
  .string()
  .max(Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 64)
  .regex(DATA_URL);

export interface DecodedImage {
  bytes: Buffer;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
}

const TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

/** Whether the first bytes match the declared type (the data URL's MIME type is client-controlled). */
function hasMagicBytes(bytes: Buffer, contentType: DecodedImage["contentType"]): boolean {
  if (contentType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType === "image/png") return bytes.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
}

/** Decodes an already schema-validated data URL. Returns null when it is not a real image of the declared type. */
export function decodeImageDataUrl(dataUrl: string): DecodedImage | null {
  const match = DATA_URL.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1] as DecodedImage["contentType"];
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) return null;
  if (!hasMagicBytes(bytes, contentType)) return null;
  return { bytes, contentType, extension: TYPES[contentType] };
}
