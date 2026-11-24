import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Line icons in the colour of the text around them, sized to it. Decorative: the text next to them says what they do.

function Line({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("inline-block size-[1.1em] flex-none", className)}
    >
      {children}
    </svg>
  );
}

/** An arrow down onto a line: a download. */
export function DownloadIcon({ className }: { className?: string }) {
  return (
    <Line className={className}>
      <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" />
    </Line>
  );
}

/** Two overlapping squares: copy. */
export function CopyIcon({ className }: { className?: string }) {
  return (
    <Line className={className}>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
      <path d="M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" />
    </Line>
  );
}

/** A speech bubble: comments. */
export function CommentIcon({ className }: { className?: string }) {
  return (
    <Line className={className}>
      <path d="M2.5 4A1.5 1.5 0 0 1 4 2.5h8A1.5 1.5 0 0 1 13.5 4v5.5A1.5 1.5 0 0 1 12 11H7l-3 2.5V11A1.5 1.5 0 0 1 2.5 9.5Z" />
    </Line>
  );
}

/** A framed picture of a hill under a sun: an image. */
export function ImageIcon({ className }: { className?: string }) {
  return (
    <Line className={className}>
      <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
      <circle cx="5.75" cy="6.25" r="1.25" />
      <path d="m2.5 12 3.5-3.5 2.5 2.5 2-2 3 3" />
    </Line>
  );
}

/** Two links of a chain: a link. */
export function LinkIcon({ className }: { className?: string }) {
  return (
    <Line className={className}>
      <path d="M6.75 9.25a2.75 2.75 0 0 0 3.9 0l2.1-2.1a2.75 2.75 0 0 0-3.9-3.9l-.85.85" />
      <path d="M9.25 6.75a2.75 2.75 0 0 0-3.9 0l-2.1 2.1a2.75 2.75 0 0 0 3.9 3.9l.85-.85" />
    </Line>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <Line className={className}>
      <path d="m3 8.5 3 3 7-7" />
    </Line>
  );
}

/** A turning ring, for something on its way. */
export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <svg role="status" aria-label={label} viewBox="0 0 16 16" fill="none" className={cn("inline-block size-4 flex-none animate-spin", className)}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
