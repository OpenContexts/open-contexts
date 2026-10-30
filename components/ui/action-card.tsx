import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A large link with a title and a one-line explanation, for "what would you like to do?" choices. */
export function ActionCard({
  title,
  description,
  icon,
  className,
  ...props
}: Omit<ComponentProps<typeof Link>, "title"> & { title: ReactNode; description: ReactNode; icon?: ReactNode }) {
  return (
    <Link
      className={cn(
        "group flex gap-3 rounded border border-rule-strong bg-paper px-4 py-3 text-ink no-underline transition hover:border-ink hover:bg-surface",
        className,
      )}
      {...props}
    >
      {icon && <span className="mt-0.5 w-5 flex-none text-center text-[1.2rem] leading-none">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block font-bold group-hover:text-brand">{title}</span>
        <span className="mt-0.5 block text-sm text-ink-muted">{description}</span>
      </span>
      <span aria-hidden className="self-center text-ink-subtle group-hover:text-brand">
        →
      </span>
    </Link>
  );
}

export function ActionCardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-2.5 sm:grid-cols-2", className)}>{children}</div>;
}
