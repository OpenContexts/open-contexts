// Scales and compresses an image in the browser before it is uploaded, so what reaches the server is small
// (lib/images.ts). Drawing it on a canvas also leaves out everything but the pixels, such as a photo's location.
import { IMAGE_MAX_SIDE, IMAGE_TARGET_BYTES, type ImageType } from "@/lib/images";

export type Compressed = { blob: Blob; type: ImageType; width: number; height: number };

/** Below this quality the image gets smaller instead: fewer pixels look better than coarser ones. */
const MIN_QUALITY = 0.6;
const MAX_QUALITY = 0.92;

function load(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  return img
    .decode()
    .then(() => img)
    .finally(() => URL.revokeObjectURL(url));
}

function encode(canvas: HTMLCanvasElement, type: ImageType, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** WebP where the browser can write it; Safari cannot, and hands back a PNG instead. */
async function format(): Promise<ImageType> {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const blob = await encode(canvas, "image/webp", 0.8);
  return blob?.type === "image/webp" ? "image/webp" : "image/jpeg";
}

/** The best quality whose file fits the target, searched by halving; null if not even the lowest does. */
async function fit(canvas: HTMLCanvasElement, type: ImageType): Promise<Blob | null> {
  const best = await encode(canvas, type, MAX_QUALITY);
  if (best && best.size <= IMAGE_TARGET_BYTES) return best;
  let found = await encode(canvas, type, MIN_QUALITY);
  if (!found || found.size > IMAGE_TARGET_BYTES) return null;
  let [low, high] = [MIN_QUALITY, MAX_QUALITY];
  for (let i = 0; i < 4; i++) {
    const quality = (low + high) / 2;
    const blob = await encode(canvas, type, quality);
    if (blob && blob.size <= IMAGE_TARGET_BYTES) [found, low] = [blob, quality];
    else high = quality;
  }
  return found;
}

/**
 * The image at most IMAGE_MAX_SIDE pixels on its longest side, compressed to about IMAGE_TARGET_BYTES: at the best
 * quality that fits, and smaller where even the lowest quality does not. Throws a message for the reader if the
 * browser cannot read the file (e.g. a HEIC photo outside Safari).
 */
export async function compressImage(file: File): Promise<Compressed> {
  let img: HTMLImageElement;
  try {
    img = await load(file);
  } catch {
    throw new Error("Your browser cannot read this file. Please choose a PNG, JPEG or WebP image.");
  }
  const type = await format();
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser cannot process images here.");
  let scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  for (let i = 0; i < 12; i++) {
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    // JPEG has no transparency: transparent parts would turn black.
    if (type === "image/jpeg") {
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.imageSmoothingQuality = "high";
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await fit(canvas, type);
    if (blob) return { blob, type, width: canvas.width, height: canvas.height };
    scale *= 0.8;
  }
  throw new Error("This image could not be compressed enough. Please choose a smaller one.");
}
