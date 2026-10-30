import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const tones = {
  neutral: "text-ink-muted",
  success: "text-success",
  info: "text-info",
  warning: "text-gold-dark",
  danger: "text-brand",
} as const;

export type BadgeTone = keyof typeof tones;

/** Monospace label with a thin border, like \texttt{} in the paper. */
export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("rounded-sm border border-current px-1.5 font-mono text-[0.8rem]/normal whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}
