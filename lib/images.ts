// Images in the texts: uploaded through the editors (components/markdown/image-upload.tsx), stored in Vercel Blob
// (lib/data/uploads.ts) and written into the markdown as ![description](url). Shared by the browser and the server.

/** The longest side an image is scaled down to, in pixels. */
export const IMAGE_MAX_SIDE = 2000;
/** What the browser compresses an image to, in bytes. */
export const IMAGE_TARGET_BYTES = 150_000;
/** The most the server accepts, in bytes: the target with room to spare. */
export const IMAGE_MAX_BYTES = 300_000;
/** The largest file one may choose, before compressing, in bytes. */
export const IMAGE_MAX_INPUT_BYTES = 40_000_000;
/** Uploads one person may make in a day; moderators have no limit. */
export const IMAGE_DAILY_LIMIT = 40;

/** The formats the browser produces: WebP, or JPEG where it cannot write WebP (Safari). */
export const IMAGE_TYPES = { "image/webp": "webp", "image/jpeg": "jpg" } as const;
export type ImageType = keyof typeof IMAGE_TYPES;

/**
 * An uploaded image's address as it appears in a text: the store's host, then images/<id>.<ext>. The texts are
 * searched for it, in the database, with the same pattern (a POSIX regex there), to find the images still in use.
 */
export const IMAGE_URL_PATTERN = String.raw`vercel-storage\.com/images/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(webp|jpg)`;

/** The markdown for an image. Brackets and line breaks would end the description early, so they are left out. */
export function imageMarkdown(url: string, description: string): string {
  const alt = description.replace(/[[\]\\]/g, "").replace(/\s+/g, " ").trim();
  return `![${alt}](${url})`;
}
