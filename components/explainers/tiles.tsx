import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A typographic symbol in a ring, the site's icons: ∴ for results, § for references, ✎ for edits, … */
export function Glyph({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span aria-hidden className={cn("flex size-9 flex-none items-center justify-center rounded-full border border-ink bg-surface text-[1.1rem] leading-none", className)}>
      {children}
    </span>
  );
}

export type TileItem = { icon?: ReactNode; title: ReactNode; text?: ReactNode; href?: string };

/**
 * Short facts side by side, each an icon, a title and a line or two: the way to say in a glance what a paragraph
 * used to. `columns`: how many on wide screens; on phones they stack.
 */
export function Tiles({ items, columns = 2, className }: { items: TileItem[]; columns?: 2 | 3 | 4; className?: string }) {
  const grid = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 md:grid-cols-3", 4: "sm:grid-cols-2 md:grid-cols-4" }[columns];
  return (
    <ul className={cn("grid gap-x-6 gap-y-4", grid, className)}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          {item.icon !== undefined && <Glyph>{item.icon}</Glyph>}
          <p className="min-w-0 text-[0.98rem]/snug">
            <strong className="block">{item.href ? <Link href={item.href} className="text-ink hover:text-brand">{item.title}</Link> : item.title}</strong>
            {item.text && <span className="mt-0.5 block text-ink-muted">{item.text}</span>}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Numbered steps joined by arrows, left to right (top to bottom on phones). */
export function Steps({ items, className }: { items: { title: ReactNode; text?: ReactNode }[]; className?: string }) {
  return (
    <ol className={cn("flex items-stretch gap-2 max-md:flex-col", className)}>
      {items.map((step, i) => (
        <li key={i} className="flex flex-1 items-stretch gap-2 max-md:flex-col">
          <div className="flex flex-1 gap-3 rounded border border-rule-strong bg-paper px-3.5 py-3 md:flex-col md:items-center md:text-center">
            <span className="flex size-8 flex-none items-center justify-center rounded-full bg-ink font-sans text-sm font-bold text-paper">{i + 1}</span>
            <p className="text-[0.95rem]/snug">
              <strong className="block">{step.title}</strong>
              {step.text && <span className="mt-0.5 block text-ink-muted">{step.text}</span>}
            </p>
          </div>
          {i < items.length - 1 && (
            <span aria-hidden className="self-center font-sans text-lg text-ink-subtle max-md:rotate-90">
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
