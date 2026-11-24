// The uploaded images (lib/images.ts) and their cleanup. An image is kept as long as a stored text uses it; the
// texts are what count, so there is nothing to keep in step when a text is edited, approved or deleted.
import "server-only";
import { del } from "@vercel/blob";
import { inArray, sql } from "drizzle-orm";
import { after } from "next/server";
import { db, isDbConfigured } from "@/lib/db";
import { upload } from "@/lib/db/schema";
import { IMAGE_URL_PATTERN } from "@/lib/images";

/** False when no Blob store is connected; uploading then fails with a message saying so. */
export function isBlobConfigured(): boolean {
  return !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

/**
 * How long an upload that no saved text has used yet is kept: the time someone may take to finish the text they
 * uploaded it for. Once a saved text has used it, it is deleted as soon as none does.
 */
const DRAFT_HOURS = 24;

/**
 * Every text that can show images and is still shown somewhere, or may be once reviewed: the problems (with
 * their earlier versions, while the problem exists), suggested edits, proposed problems, contributions and blog
 * posts, whatever their status. A rejected submission keeps its images, since it can be reopened. Comments
 * cannot show uploaded images.
 */
const TEXTS = sql`
  select unnest(array[statement, body, note]) from problem
  union all select unnest(array[v.statement, v.body]) from problem_version v where exists (select 1 from problem p where p.id = v.problem_id)
  union all select unnest(array[statement, body]) from problem_revision
  union all select unnest(array[statement, body]) from problem_proposal
  union all select summary from contribution
  union all select body from blog_post
`;

/**
 * Deletes the uploads no text uses: at once if a saved text used them before (an image taken out of a text, or
 * whose text was deleted), else once they are DRAFT_HOURS old (uploaded for a text that was never sent). Marks
 * those that are used. Runs after the changes that can leave images unused (see `sweepUploadsLater`), and after
 * each upload, which clears the abandoned ones. Never throws: an image left over is removed by the next sweep.
 */
export async function sweepUploads(): Promise<void> {
  if (!isDbConfigured() || !isBlobConfigured()) return;
  try {
    const { rows } = await db.execute<{ id: string; url: string }>(sql`
      with texts(t) as (${TEXTS}),
      used as (
        select distinct (regexp_matches(t, ${IMAGE_URL_PATTERN}, 'g'))[1]::uuid as id
        from texts where t like '%vercel-storage.com/images/%'
      ),
      marked as (update upload set used_at = now() where used_at is null and id in (select id from used))
      select id, url from upload
      where id not in (select id from used)
        and (used_at is not null or created_at < now() - make_interval(hours => ${DRAFT_HOURS}))
    `);
    if (!rows.length) return;
    await del(rows.map((r) => r.url));
    await db.delete(upload).where(inArray(upload.id, rows.map((r) => r.id)));
  } catch (error) {
    console.error("Cleaning up unused images failed", error);
  }
}

/** Sweeps once the response is sent, so that saving does not wait for it. */
export function sweepUploadsLater(): void {
  after(sweepUploads);
}
