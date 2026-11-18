// Data Access Layer for the current user. Every server-side permission check goes
// through here (pages, server actions, route handlers), never through layouts alone.
import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { headers } from "next/headers";
import { connection } from "next/server";
import { MODERATOR_ROLES, type Role } from "@/lib/constants";
import { auth } from "./index";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/**
 * The signed-in user, or null.
 * Visitors without a session cookie cost no database query; signed-in ones cost one session lookup, once per
 * request however many parts of the page ask.
 */
export const getCurrentUser = cache(async function getCurrentUser(): Promise<CurrentUser | null> {
  // Request time only. Without this, Next.js pre-runs the session lookup while prerendering
  // with the session cookie, and Better Auth's expiry check (`new Date()`) and database query
  // fail there.
  await connection();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.banned) return null;
  const { id, name, email, role } = session.user;
  return { id, name, email, role: (role as Role | null | undefined) ?? "user" };
});

/** Whether anyone is signed in, for SignedInProvider. */
export const isSignedIn = async () => !!(await getCurrentUser());

export function isModerator(user: CurrentUser | null): boolean {
  return !!user && MODERATOR_ROLES.includes(user.role);
}

export async function requireUser(redirectTo = "/"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(redirectTo)}`);
  return user;
}

export async function requireModerator(): Promise<CurrentUser> {
  const user = await requireUser("/admin");
  // 404 rather than 403, so the admin area does not advertise itself.
  if (!isModerator(user)) notFound();
  return user;
}

export function isAdmin(user: CurrentUser | null): boolean {
  return user?.role === "admin";
}

/** For user management and other admin-only areas. Moderators only review submissions. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireModerator();
  if (!isAdmin(user)) notFound();
  return user;
}

/** Why `actor` may not block `target`, or undefined if they may. Shared by the block action and the UI. */
export function blockRefusal(actor: CurrentUser, target: { id: string; role: string | null } | undefined): string | undefined {
  if (!target) return "This user no longer exists.";
  if (target.id === actor.id) return "You cannot block yourself.";
  if (target.role === "admin") return "Admins cannot be blocked.";
  if (target.role === "moderator" && !isAdmin(actor)) return "Only admins can block moderators.";
  return undefined;
}
