import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const shapes = {
  /** rounded pill, for topics and tags */
  pill: "rounded-full border-rule-strong px-2 py-px text-sm text-ink-muted hover:border-ink hover:text-ink",
  /** square chip, for short codes such as agenda numerals */
  square: "min-w-6 rounded-sm border-ink px-1.5 py-0.5 text-center text-sm font-bold text-ink hover:bg-ink hover:text-paper",
} as const;

type ChipProps = { shape?: keyof typeof shapes; active?: boolean; className?: string; children: ReactNode };

function chipStyles({ shape = "pill", active, className }: Omit<ChipProps, "children">) {
  return cn("inline-block border no-underline", shapes[shape], active && "border-ink bg-ink text-paper", className);
}

export function Chip({ shape, active, className, children }: ChipProps) {
  return <span className={chipStyles({ shape, active, className })}>{children}</span>;
}

export function ChipLink({ shape, active, className, ...props }: ComponentProps<typeof Link> & Omit<ChipProps, "children">) {
  return <Link className={chipStyles({ shape, active, className })} {...props} />;
}

export function ChipList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mt-3 flex flex-wrap gap-1.5", className)}>{children}</div>;
}
