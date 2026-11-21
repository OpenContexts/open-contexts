import Link from "next/link";
import { StatusBadge, StatusIcon } from "@/components/problems/status";
import type { Problem } from "@/lib/data/problems";

/**
 * Which problem a page belongs to, along its top: the problem's apple in the colour of its status, what the page
 * is to it (`label`, e.g. "Contribution to"), its number and title, and its status, all linking to it.
 */
export function ProblemContext({ problem, label }: { problem: Pick<Problem, "slug" | "number" | "title" | "status" | "published">; label: string }) {
  return (
    <Link
      href={`/problems/${problem.slug}`}
      className="group mt-6 flex items-center gap-3.5 rounded-md border border-rule bg-surface px-4 py-3 no-underline transition hover:border-rule-strong"
    >
      <StatusIcon status={problem.status} additional={!problem.published} className="size-7" />
      <span className="min-w-0 flex-1">
        <span className="block font-sans text-[0.7rem] font-bold tracking-[0.12em] text-ink-subtle uppercase">{label}</span>
        <span className="block font-bold text-ink group-hover:text-brand">
          Problem {problem.number}: {problem.title}
        </span>
      </span>
      <StatusBadge status={problem.status} className="max-sm:hidden" />
      <span aria-hidden className="text-brand transition group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  );
}
