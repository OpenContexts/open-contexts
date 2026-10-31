"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CountBadge } from "@/components/admin/ui";
import { SUBMISSION_TYPES, SUBMISSION_TYPE_LABELS, type SubmissionType } from "@/lib/constants";
import { cn } from "@/lib/cn";

function NavItem({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 whitespace-nowrap transition",
        active ? "bg-zinc-100 font-medium text-zinc-900" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
      )}
    >
      {children}
    </Link>
  );
}

function Section({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="lg:mt-5 lg:first:mt-0">
      {label && <p className="mb-1 hidden px-2.5 text-[11px] font-medium tracking-wide text-zinc-400 uppercase lg:block">{label}</p>}
      <div className="flex gap-1 lg:flex-col lg:gap-0.5">{children}</div>
    </div>
  );
}

type NavProps = { counts?: Record<SubmissionType, number>; admin?: boolean };

/**
 * The dashboard's links, with the current page highlighted and the number of pending submissions per queue.
 * Admin-only items are hidden for moderators (the pages check again).
 */
export function AdminNav({ counts, admin }: NavProps) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
      <Section>
        <NavItem href="/admin" active={pathname === "/admin"}>
          Overview
        </NavItem>
      </Section>
      <Section label="Content">
        <NavItem href="/admin/problems" active={pathname.startsWith("/admin/problems")}>
          Problems
        </NavItem>
      </Section>
      <Section label="Review">
        {SUBMISSION_TYPES.map((t) => (
          <NavItem key={t} href={`/admin/queue/${t}`} active={pathname.startsWith(`/admin/queue/${t}`) || pathname.startsWith(`/admin/review/${t}/`)}>
            {SUBMISSION_TYPE_LABELS[t]}
            <CountBadge n={counts?.[t] ?? 0} />
          </NavItem>
        ))}
      </Section>
      <Section label="Records">
        <NavItem href="/admin/activity" active={pathname.startsWith("/admin/activity")}>
          Activity log
        </NavItem>
        {admin && (
          <NavItem href="/admin/users" active={pathname.startsWith("/admin/users")}>
            Users
          </NavItem>
        )}
      </Section>
    </nav>
  );
}
