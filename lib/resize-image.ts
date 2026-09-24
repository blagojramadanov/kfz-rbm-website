/**
 * Browser-only: downscales a photo to at most MAX_EDGE px on the long edge and
 * re-encodes it as JPEG. Keeps every upload request small (server actions have a
 * body limit, Vercel functions a hard 4.5 MB limit) and strips EXIF metadata.
 */
const MAX_EDGE = 1920;
const QUALITY = 0.85;

export async function resizeImageToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("NOT_AN_IMAGE");

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("NOT_AN_IMAGE"));
      img.src = url;
    });

    const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("NOT_AN_IMAGE");
    // White background so transparent PNGs don't turn black as JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", QUALITY);
  } finally {
    URL.revokeObjectURL(url);
  }
}
