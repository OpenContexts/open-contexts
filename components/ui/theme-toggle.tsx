"use client";

import { useLayoutEffect } from "react";
import { cn } from "@/lib/cn";
import { THEME_KEY } from "@/lib/theme";

function stored() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Switches between light and dark. Picking what the system shows anyway forgets the choice, so the site
 * follows the system setting again. The icon is chosen in CSS, so the server can render it.
 */
export function ThemeToggle({ className }: { className?: string }) {
  // The script in <head> sets data-theme before the first paint. In development, React resets <html> when
  // Strict Mode remounts, so it is put back here; in production this changes nothing.
  useLayoutEffect(() => {
    const t = stored();
    if (t) document.documentElement.dataset.theme = t;
  }, []);

  function toggle() {
    const root = document.documentElement;
    const systemDark = matchMedia("(prefers-color-scheme: dark)").matches;
    const next = (root.dataset.theme ? root.dataset.theme === "dark" : systemDark) ? "light" : "dark";
    try {
      if ((next === "dark") === systemDark) localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {
      // Not stored (storage blocked); the switch still applies to this page.
    }
    if ((next === "dark") === systemDark) delete root.dataset.theme;
    else root.dataset.theme = next;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark mode"
      title="Light or dark mode"
      className={cn("flex size-8 flex-none cursor-pointer items-center justify-center rounded text-ink-muted hover:bg-surface hover:text-ink", className)}
    >
      <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-[1.1rem]">
        {/* A moon in light mode (switches to dark), a sun in dark mode (switches to light). */}
        <path className="dark:hidden" d="M16.5 12.3A7 7 0 0 1 7.7 3.5a7 7 0 1 0 8.8 8.8z" />
        <g className="hidden dark:inline">
          <circle cx="10" cy="10" r="3.4" />
          <path d="M10 1.8v1.8M10 16.4v1.8M1.8 10h1.8M16.4 10h1.8M4.2 4.2l1.3 1.3M14.5 14.5l1.3 1.3M4.2 15.8l1.3-1.3M14.5 5.5l1.3-1.3" />
        </g>
      </svg>
    </button>
  );
}
