import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Coloured text on a tint of the same colour, framed by a thin ring.
const softTones = {
  neutral: "bg-surface text-ink-muted ring-rule-strong",
  success: "bg-success-tint text-success ring-success/45",
  info: "bg-info-tint text-info ring-info/40",
  warning: "bg-gold-tint text-gold-dark ring-gold/70",
  danger: "bg-brand-tint text-brand ring-brand/40",
} as const;

// Filled: for outcomes that matter (a solution, a verification, a refutation, a change of status).
const strongTones = {
  neutral: "bg-ink text-white ring-ink",
  success: "bg-success text-white ring-success",
  info: "bg-info text-white ring-info",
  warning: "bg-gold text-ink ring-gold-dark/40",
  danger: "bg-brand-strong text-white ring-brand-strong",
} as const;

/** The plain colour of each tone, for markers and rules that go with a tag. */
export const toneColors = {
  neutral: { bg: "bg-rule-strong", border: "border-rule-strong" },
  success: { bg: "bg-success", border: "border-success" },
  info: { bg: "bg-info", border: "border-info" },
  warning: { bg: "bg-gold", border: "border-gold" },
  danger: { bg: "bg-brand-strong", border: "border-brand-strong" },
} as const;

export type TagTone = keyof typeof softTones;

/** A short label in capitals that says what kind of thing an entry is. `strong` fills it, for outcomes that matter. */
export function Tag({ tone = "neutral", strong, children, className }: { tone?: TagTone; strong?: boolean; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-sm px-2 py-0.5 font-sans text-[0.72rem]/[1.3] font-bold tracking-[0.07em] whitespace-nowrap uppercase ring-1 ring-inset",
        (strong ? strongTones : softTones)[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
