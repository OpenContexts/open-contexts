// The moderators listed on the About page. Cached until someone becomes or stops being a moderator,
// or a moderator's name or email changes: the dashboard's user actions and the auth hooks in
// lib/auth invalidate MODERATORS_TAG.
import "server-only";
import { and, asc, inArray, isNull, or, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { MODERATOR_ROLES } from "@/lib/constants";
import { db, isDbConfigured } from "@/lib/db";
import { user } from "@/lib/db/schema";

export const MODERATORS_TAG = "moderators";

export type Moderator = { name: string; email: string };

/** Moderators and admins, by name; blocked accounts are left out. */
export async function getModerators(): Promise<Moderator[]> {
  "use cache";
  cacheLife("max");
  cacheTag(MODERATORS_TAG);
  if (!isDbConfigured()) return [];
  return db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(and(inArray(user.role, [...MODERATOR_ROLES]), or(isNull(user.banned), eq(user.banned, false))))
    .orderBy(asc(user.name));
}
