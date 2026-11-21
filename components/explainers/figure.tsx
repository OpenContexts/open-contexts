import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A figure as in the paper: the drawing, then "Fig. 1. Title. Caption." in small type under it. */
export function Figure({ number, title, children, caption, className }: { number?: number; title: string; children: ReactNode; caption?: ReactNode; className?: string }) {
  return (
    <figure className={cn("my-6", className)}>
      {children}
      <figcaption className="mx-auto mt-3 max-w-160 text-center text-[0.9rem] text-ink-muted">
        {number !== undefined && <span className="text-ink">Fig. {number}. </span>}
        <strong className="text-ink">{title}.</strong> {caption}
      </figcaption>
    </figure>
  );
}
