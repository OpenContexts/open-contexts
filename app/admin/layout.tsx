import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppleIcon, ThemeToggle } from "@/components/ui";
import { getCurrentUser, isAdmin, isModerator } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/constants";
import { getPendingCounts } from "@/lib/data/moderation";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };

// Chrome only. Access is checked in each page and in the server actions: requireModerator for
// reviewing submissions, requireAdmin for user management.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="admin-ui min-h-screen bg-zinc-50 font-ui text-sm text-zinc-900 antialiased lg:flex">
      <aside className="border-b border-zinc-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:flex-none lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex h-14 items-center gap-2 px-5">
          <AppleIcon className="size-4" />
          <span className="font-semibold tracking-tight">OpenContexts</span>
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500">Admin</span>
          <ThemeToggle className="-mr-2 ml-auto rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" />
        </div>
        <div className="lg:flex-1 lg:overflow-y-auto lg:pt-2">
          <NavWithCounts />
        </div>
        <div className="hidden border-t border-zinc-100 p-3 lg:block">
          <SignedInAs />
          <Link href="/" className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
            View site <span aria-hidden>↗</span>
          </Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}

async function NavWithCounts() {
  const user = await getCurrentUser();
  if (!isModerator(user)) return <AdminNav />;
  return <AdminNav counts={await getPendingCounts()} admin={isAdmin(user)} />;
}

async function SignedInAs() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <p className="truncate px-2.5 pb-2 text-xs text-zinc-400" title={user.email}>
      {user.email} · {ROLE_LABELS[user.role]}
    </p>
  );
}
