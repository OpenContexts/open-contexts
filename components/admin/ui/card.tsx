import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ title, action, children, className, padded = true }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cn("overflow-hidden rounded-xl bg-white shadow-xs ring-1 ring-zinc-200", className)}>
      {(title || action) && (
        <header className="flex min-h-12 items-center justify-between gap-3 border-b border-zinc-100 px-5 py-2.5">
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          {action}
        </header>
      )}
      <div className={cn(padded && "p-5")}>{children}</div>
    </section>
  );
}
