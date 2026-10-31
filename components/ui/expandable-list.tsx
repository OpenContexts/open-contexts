"use client";

import { Children, type ReactNode, useState } from "react";

/**
 * A list that shows its first `limit` items and reveals the rest `limit` at a time.
 * `noun` is [singular, plural], e.g. ["reference", "references"].
 */
export function ExpandableList({
  limit,
  noun,
  ordered,
  className,
  children,
}: {
  limit: number;
  noun: [string, string];
  ordered?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const items = Children.toArray(children);
  const [shown, setShown] = useState(limit);
  const hidden = items.length - shown;
  const next = Math.min(hidden, limit);
  const List = ordered ? "ol" : "ul";

  return (
    <>
      <List className={className}>{items.slice(0, shown)}</List>
      {items.length > limit && (
        <p className="mt-2.5 flex justify-center gap-4 text-[0.92rem]">
          {hidden > 0 && (
            <button type="button" onClick={() => setShown((s) => s + limit)} className="cursor-pointer text-brand hover:underline">
              Show {next === hidden && hidden > 0 ? `the remaining ${hidden}` : `${next} more`} {next === 1 ? noun[0] : noun[1]}
            </button>
            
          )}
          {shown > limit && (
            <button type="button" onClick={() => setShown(limit)} className="cursor-pointer text-ink-subtle hover:text-ink hover:underline">
              Show fewer
            </button>
          )}
        </p>
      )}
    </>
  );
}
