import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ title, action, children, className, padded = true }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cn("rounded-lg bg-white ring-1 ring-zinc-200", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3">
          <h2 className="text-[13px] font-semibold text-zinc-900">{title}</h2>
          {action}
        </header>
      )}
      <div className={cn(padded && "p-5")}>{children}</div>
    </section>
  );
}

/** Label / value rows inside a card. */
export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="space-y-3">
      {items.map((it) => (
        <div key={it.label}>
          <dt className="text-xs text-zinc-500">{it.label}</dt>
          <dd className="mt-0.5 break-words text-zinc-900">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
