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
      <Select {...props} className={cn("pl-8", className)} onChange={(e) => e.currentTarget.form?.requestSubmit()} />
    </span>
  );
}
