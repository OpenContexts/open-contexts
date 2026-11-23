import Link from "next/link";
import type { ReactNode } from "react";
import { adminButtonStyles } from "./button";
import { plural } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * The foot of a paged list: which rows of how many are shown, and links to the pages before and after. `href`
 * gives the address of a page, so the page lives in the URL and can be bookmarked.
 */
export function Pager({
  page,
  pages,
  total,
  shown,
  perPage,
  noun,
  href,
  className,
}: {
  page: number;
  pages: number;
  total: number;
  /** Rows on this page. */
  shown: number;
  perPage: number;
  /** Singular and plural of what is counted, e.g. ["user", "users"]. */
  noun: [string, string?];
  href: (page: number) => string;
  className?: string;
}) {
  const first = (page - 1) * perPage + 1;
  return (
    <footer className={cn("flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs text-zinc-500", className)}>
      <span className="tabular-nums">
        {shown ? `${first}–${first + shown - 1} of ` : ""}
        {plural(total, ...noun)}
      </span>
      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center gap-2">
          <PageLink to={page > 1 ? href(page - 1) : undefined}>← Previous</PageLink>
          <span className="tabular-nums">
            Page {page} of {pages}
          </span>
          <PageLink to={page < pages ? href(page + 1) : undefined}>Next →</PageLink>
        </nav>
      )}
    </footer>
  );
}

function PageLink({ to, children }: { to?: string; children: ReactNode }) {
  const styles = adminButtonStyles({ size: "sm" });
  return to ? (
    <Link href={to} className={styles}>
      {children}
    </Link>
  ) : (
    <span aria-disabled className={cn(styles, "pointer-events-none opacity-40")}>
      {children}
    </span>
  );
}

/** The page asked for in the search params: a whole number from 1, 1 for anything else. */
export function pageParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return Math.max(1, Math.floor(Number(value)) || 1);
}
