"use client";

import type { ComponentProps } from "react";
import { Select } from "@/components/ui";
import { cn } from "@/lib/cn";

/** The sort order, marked with a sort icon. Submits its form when changed; without JavaScript the form's submit button does it. */
export function SortSelect({ className, ...props }: ComponentProps<"select">) {
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
        {/* An arrow up and an arrow down, side by side. */}
        <path d="M5 13V3M2.5 5.5 5 3l2.5 2.5M11 3v10M8.5 10.5 11 13l2.5-2.5" />
      </svg>
      <Select {...props} title="Sort by" className={cn("pl-8", className)} onChange={(e) => e.currentTarget.form?.requestSubmit()} />
    </span>
  );
}
