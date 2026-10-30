import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const tones = {
  info: "bg-sky-50 text-sky-900 ring-sky-200",
  warning: "bg-amber-50 text-amber-900 ring-amber-200",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
} as const;

/** A highlighted line of information, e.g. what a decision will also do. */
export function Notice({ tone = "info", children, className }: { tone?: keyof typeof tones; children: ReactNode; className?: string }) {
  return <p className={cn("rounded-lg px-3.5 py-2.5 ring-1 ring-inset", tones[tone], className)}>{children}</p>;
}
