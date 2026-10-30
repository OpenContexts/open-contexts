import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const strongTones = {
  neutral: "bg-surface text-ink ring-rule-strong",
  success: "bg-success-tint text-success ring-success/50",
  info: "bg-info-tint text-info ring-info/40",
  warning: "bg-gold-tint text-gold-dark ring-gold",
  danger: "bg-brand-tint text-brand ring-brand/50",
} as const;

// Barely coloured: a tint behind grey text, so the kind is visible without competing with the strong ones.
const slightTones = {
  neutral: "bg-surface",
  success: "bg-success-tint",
  info: "bg-info-tint",
  warning: "bg-gold-tint",
  danger: "bg-brand-tint",
} as const;

export type TagTone = keyof typeof strongTones;

/** A short label in small capitals that says what kind of thing an entry is. `strong` is for outcomes that matter. */
export function Tag({ tone = "neutral", strong, children, className }: { tone?: TagTone; strong?: boolean; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-sm px-1.5 py-px font-sans text-[0.7rem]/[1.35] font-bold tracking-[0.06em] whitespace-nowrap uppercase",
        strong ? ["ring-1 ring-inset", strongTones[tone]] : ["text-ink-muted", slightTones[tone]],
        className,
      )}
    >
      {children}
    </span>
  );
}
