import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Link tabs in a pill-shaped track, for switching a list's filter (state lives in the URL). */
export function Segmented({ items, label }: { items: { href: string; active: boolean; label: ReactNode }[]; label: string }) {
  return (
    <nav aria-label={label} className="inline-flex rounded-lg bg-zinc-100 p-0.5 ring-1 ring-zinc-200/60 ring-inset">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          aria-current={it.active ? "page" : undefined}
          className={cn("rounded-md px-3 py-1 transition", it.active ? "bg-white font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200" : "text-zinc-500 hover:text-zinc-900")}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
