"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { ROLES } from "@/lib/constants";
import { db } from "@/lib/db";
import { session, user } from "@/lib/db/schema";

export type UserActionResult = { error?: string };

/** Loads the target and refuses changes to one's own account, so an admin cannot lock themselves out. */
async function target(userId: string) {
  const admin = await requireAdmin();
  if (userId === admin.id) return { error: "You cannot change your own account here." } as const;
  const row = await db.query.user.findFirst({ where: eq(user.id, userId), columns: { id: true, role: true } });
  if (!row) return { error: "This user no longer exists." } as const;
  return { row } as const;
}

const roleSchema = z.object({ userId: z.string().min(1), role: z.enum(ROLES) });

export async function setUserRole(input: z.input<typeof roleSchema>): Promise<UserActionResult> {
  const { userId, role } = roleSchema.parse(input);
  const t = await target(userId);
  if ("error" in t) return { error: t.error };
  await db.update(user).set({ role }).where(eq(user.id, userId));
  refresh();
  return {};
}

const blockSchema = z.object({ userId: z.string().min(1), reason: z.string().trim().max(500).optional() });

/** Blocked users cannot sign in (Better Auth admin plugin) and are signed out everywhere at once. */
export async function blockUser(input: z.input<typeof blockSchema>): Promise<UserActionResult> {
  const { userId, reason } = blockSchema.parse(input);
  const t = await target(userId);
  if ("error" in t) return { error: t.error };
  if (t.row.role === "admin") return { error: "Admins cannot be blocked. Change their role first." };
  await db.batch([
    db.update(user).set({ banned: true, banReason: reason || null, banExpires: null }).where(eq(user.id, userId)),
    db.delete(session).where(eq(session.userId, userId)),
  ]);
  refresh();
  return {};
}

export async function unblockUser(input: { userId: string }): Promise<UserActionResult> {
  const { userId } = z.object({ userId: z.string().min(1) }).parse(input);
  const t = await target(userId);
  if ("error" in t) return { error: t.error };
  await db.update(user).set({ banned: false, banReason: null, banExpires: null }).where(eq(user.id, userId));
  refresh();
  return {};
}
