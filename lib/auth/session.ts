// Data Access Layer for the current user. Every server-side permission check goes
// through here (pages, server actions, route handlers), never through layouts alone.
import "server-only";
import { notFound, redirect } from "next/navigation";
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
 * The signed-in user, or null. Reads request headers, so call it inside a <Suspense> boundary.
 * Visitors without a session cookie cost no database query; signed-in ones cost one session lookup.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  // Request time only. Without this, Next.js pre-runs the session lookup while prerendering
  // with the session cookie, and Better Auth's expiry check (`new Date()`) and database query
  // fail there.
  await connection();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.banned) return null;
  const { id, name, email, role } = session.user;
  return { id, name, email, role: (role as Role | null | undefined) ?? "user" };
}

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
