import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A row of link tabs (state lives in the URL, so they work without JavaScript). */
export function Tabs({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <nav aria-label={label} className={cn("mt-4 mb-1.5 flex flex-wrap gap-x-5 gap-y-0.5 border-b border-rule-strong", className)}>
      {children}
    </nav>
  );
}

export function TabLink({
  active,
  count,
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { active?: boolean; count?: number }) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "-mb-px flex items-center gap-1 border-b-2 py-1.5 no-underline",
        active ? "border-brand text-ink" : "border-transparent text-ink-muted hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
      {count !== undefined && <span className="ml-1 text-sm text-ink-subtle">{count}</span>}
    </Link>
  );
}
