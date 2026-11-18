import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A few choices of which one applies, as joined buttons (e.g. a sort order or a status filter). Links, so the
 * choice lives in the URL and works without JavaScript.
 */
export function Segmented({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <nav aria-label={label} className={cn("inline-flex flex-wrap rounded border border-rule-strong bg-surface p-0.5 font-sans text-xs", className)}>
      {children}
    </nav>
  );
}

export function SegmentLink({ href, active, count, children }: { href: string; active: boolean; count?: number; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex items-center gap-1.5 rounded-[3px] px-2.5 py-1 font-bold whitespace-nowrap no-underline transition",
        active ? "bg-paper text-ink shadow-[0_0_0_1px_var(--color-rule-strong)]" : "text-ink-muted hover:text-ink",
      )}
    >
      {children}
      {count !== undefined && <span className={cn("font-normal tabular-nums", active ? "text-ink-subtle" : "text-ink-subtle/80")}>{count}</span>}
    </Link>
  );
}
