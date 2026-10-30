import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, description, back, actions }: { title: ReactNode; description?: ReactNode; back?: { href: string; label: string }; actions?: ReactNode }) {
  return (
    <header className="mb-6">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{title}</h1>
          {description && <p className="mt-1 text-zinc-500">{description}</p>}
        </div>
        {actions}
      </div>
    </header>
  );
}

export function EmptyState({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
      <p className="font-medium text-zinc-900">{title}</p>
      {description && <p className="mt-1 text-zinc-500">{description}</p>}
    </div>
  );
}
