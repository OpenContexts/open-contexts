"use client";

import { Children, type ReactNode, useState } from "react";

/**
 * A list in order of time, oldest first, of which only the last `limit` items show; a grey "Show more" above them
 * reveals the earlier ones. `noun` is [singular, plural], e.g. ["reply", "replies"].
 */
export function RecentItems({ limit, noun, label, className, children }: { limit: number; noun: [string, string]; label: string; className?: string; children: ReactNode }) {
  const items = Children.toArray(children);
  const [all, setAll] = useState(false);
  const hidden = all ? 0 : Math.max(0, items.length - limit);
  return (
    <>
      {hidden > 0 && (
        <button type="button" onClick={() => setAll(true)} className="mt-2 block cursor-pointer font-sans text-xs text-ink-subtle hover:text-ink hover:underline">
          Show {hidden} more {hidden === 1 ? noun[0] : noun[1]}
        </button>
      )}
      <ol aria-label={label} className={className}>
        {items.slice(hidden)}
      </ol>
    </>
  );
}
