import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A figure as in the paper: the drawing, then its caption in small type, "Fig. 1:" standing out on the left and
 * the bold title and description justified beside it.
 */
export function Figure({ number, title, children, caption, className }: { number?: number; title: string; children: ReactNode; caption?: ReactNode; className?: string }) {
  return (
    <figure className={cn("my-6", className)}>
      {children}
      <figcaption className="mx-auto mt-4 flex max-w-170 gap-2.5 text-[0.9rem]/snug text-ink-muted">
        {number !== undefined && <span className="flex-none font-bold whitespace-nowrap text-ink">Fig. {number}:</span>}
        <span className="min-w-0 text-justify hyphens-auto max-sm:text-left">
          <strong className="text-ink">{title}.</strong> {caption}
        </span>
      </figcaption>
    </figure>
  );
}
