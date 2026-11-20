"use client";

import Link from "next/link";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Shows at most `lines` lines of its content; a click on the text (or the button) shows all of it.
 * Short content is left alone: the toggle only appears when something is cut off.
 * `more`: where the rest is, for content that is only the start of a longer text; "Read more" then goes there.
 */
export function Clamped({ lines = 5, more, className, children }: { lines?: number; more?: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const clamped = !open && overflows;
  if (more)
    return (
      <div className={className}>
        <div ref={ref} style={{ maxHeight: `${lines}lh` }} className={cn("overflow-hidden", overflows && "[mask-image:linear-gradient(to_bottom,black_55%,transparent)]")}>
          {children}
        </div>
        <Link href={more} className="mt-0.5 inline-block text-sm text-brand hover:underline">
          Read more
        </Link>
      </div>
    );
  return (
    <div className={className}>
      <div
        ref={ref}
        style={open ? undefined : { maxHeight: `${lines}lh` }}
        onClick={clamped ? () => setOpen(true) : undefined}
        className={cn("overflow-hidden", clamped && "cursor-pointer [mask-image:linear-gradient(to_bottom,black_55%,transparent)]")}
      >
        {children}
      </div>
      {(clamped || open) && (
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="mt-0.5 cursor-pointer text-sm text-brand hover:underline">
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
