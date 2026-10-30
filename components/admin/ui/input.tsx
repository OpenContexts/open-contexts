import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const field =
  "block rounded-md border-0 bg-white text-sm text-zinc-900 ring-1 ring-zinc-300 ring-inset placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900 focus:outline-none disabled:opacity-50";

export function AdminInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(field, "h-9 px-3", className)} {...props} />;
}

export function AdminTextarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(field, "w-full resize-y px-3 py-2", className)} {...props} />;
}

export function AdminSelect({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(field, "h-8 cursor-pointer py-0 pr-8 pl-2.5", className)} {...props} />;
}

/** Label, control, then the error (if any) or a hint. */
export function AdminField({ label, htmlFor, hint, error, children, className }: { label: ReactNode; htmlFor?: string; hint?: ReactNode; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-zinc-700">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
