"use client";

import type { ComponentProps, ReactNode } from "react";
import { Select } from "@/components/ui";
import { cn } from "@/lib/cn";

// Selects that submit their form when changed; without JavaScript the form's submit button does it.

/** The sort order, marked with a sort icon. */
export function SortSelect(props: ComponentProps<"select">) {
  return (
    // An arrow up and an arrow down, side by side.
    <AutoSubmitSelect title="Sort by" icon={<path d="M5 13V3M2.5 5.5 5 3l2.5 2.5M11 3v10M8.5 10.5 11 13l2.5-2.5" />} {...props} />
  );
}

/** What to show, marked with a funnel. */
export function FilterSelect(props: ComponentProps<"select">) {
  return (
    <AutoSubmitSelect title="Show" icon={<path d="M2.5 3.5h11L9.5 8.5v4l-3 1.5V8.5Z" />} {...props} />
  );
}

/**
 * A select with an icon on its left. It drops the browser's own look (`appearance-none`) and draws its chevron
 * itself: Safari on iOS keeps its native control otherwise, which ignores the room left for the icon, so the icon
 * would sit on the text. On phones its text is 16px, below which iOS zooms into a control when it is tapped.
 */
function AutoSubmitSelect({ className, icon, ...props }: ComponentProps<"select"> & { icon: ReactNode }) {
  return (
    <span className="relative inline-flex">
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-muted"
      >
        {icon}
      </svg>
      <Select {...props} className={cn("cursor-pointer appearance-none pr-8 pl-8 max-sm:text-base", className)} onChange={(e) => e.currentTarget.form?.requestSubmit()} />
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-ink-muted"
      >
        <path d="M4 6l4 4 4-4" />
      </svg>
    </span>
  );
}
