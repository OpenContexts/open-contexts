import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The full text behind a short summary: "Read more" opens it in place. A plain <details>, so it works without
 * JavaScript and the browser's find-in-page still reaches the hidden text.
 */
export function Disclosure({ label = "Read more", children, className, id }: { label?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <details id={id} className={cn("group my-4", className)}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-sans text-sm font-bold text-brand select-none hover:underline [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="inline-block transition group-open:rotate-90">
          ›
        </span>
        {label}
      </summary>
      <div className="mt-3 border-l-2 border-rule pl-4">{children}</div>
    </details>
  );
}
