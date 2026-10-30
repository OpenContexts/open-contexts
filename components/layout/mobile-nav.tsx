"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

/**
 * The burger menu that holds the main links on small screens. `children` are the links; choosing one,
 * pressing Escape or clicking elsewhere closes the menu.
 */
export function MobileNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="min-[880px]:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Menu"}
        onClick={() => setOpen(!open)}
        className="-ml-1.5 flex size-9 cursor-pointer items-center justify-center rounded text-ink hover:bg-surface"
      >
        <svg viewBox="0 0 20 20" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
          {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 5.5h14M3 10h14M3 14.5h14" />}
        </svg>
      </button>
      <nav
        id="mobile-nav"
        aria-label="Main"
        hidden={!open}
        // A click on a link closes the menu; the page change itself happens as usual.
        onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
        className="absolute inset-x-0 top-full z-30 border-b border-ink bg-paper px-5 py-2 text-lg shadow-[0_6px_12px_rgba(0,0,0,0.06)] [&_a]:block [&_a]:border-b [&_a]:border-rule [&_a]:py-2.5 [&_a:last-child]:border-0"
      >
        {children}
      </nav>
    </div>
  );
}
