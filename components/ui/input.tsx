import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const control =
  "block w-full rounded-sm border border-ink bg-paper px-3 py-1.5 font-serif text-base text-ink placeholder:text-ink-subtle disabled:opacity-60 aria-invalid:border-brand";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, className)} {...props} />;
}

/** Monospace, since most long text on the site is markdown with LaTeX. */
export function Textarea({ className, rows = 6, ...props }: ComponentProps<"textarea">) {
  return <textarea rows={rows} className={cn(control, "resize-y font-mono text-sm/relaxed", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(control, "w-auto py-1 text-[0.95rem]", className)} {...props} />;
}
