// Images uploaded for the texts (lib/images.ts). The files are in Vercel Blob; this table keeps track of them, so
// that those no text uses any more can be deleted (sweepUploads in lib/data/uploads.ts).
import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const upload = pgTable(
  "upload",
  {
    /** Also the file's name in the store: images/<id>.webp, which is how the texts are searched for it. */
    id: uuid("id").primaryKey(),
    /** The file's public address, as it appears in the markdown. */
    url: text("url").notNull(),
    /** Null once the uploader's account is deleted; the image stays as long as a text uses it. */
    uploaderId: text("uploader_id").references(() => user.id, { onDelete: "set null" }),
    /** In bytes. */
    size: integer("size").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    /** When a stored text was first found to use it. From then on it is deleted as soon as none does. */
    usedAt: timestamp("used_at", { withTimezone: true }),
  },
  (t) => [index("upload_uploader_created_idx").on(t.uploaderId, t.createdAt)],
);
