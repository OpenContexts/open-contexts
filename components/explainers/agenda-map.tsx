import Link from "next/link";
import { StatusIcon } from "@/components/problems/status";
import { AppleIcon } from "@/components/ui";
import { AGENDA } from "@/lib/agenda";
import { PROBLEM_STATUS_LABELS } from "@/lib/constants";
import type { Problem } from "@/lib/data/problems";

/**
 * The research agenda as a tree: the long-term goals (golden apples) branch off the list, and each goal's problems
 * (red apples, in the colour of their status) hang from it. A problem that serves two goals hangs from both. Every
 * apple links to its problem and names it on hover. `titles`: also write each problem's title next to its apple.
 */
export function AgendaMap({ problems, titles }: { problems: Problem[]; titles?: boolean }) {
  return (
    <div>
      {/* The trunk and the line it branches into; on phones the goals stack and the branches go. */}
      <div aria-hidden className="relative mx-auto h-7 max-sm:hidden">
        <span className="absolute top-0 left-1/2 h-3.5 w-px bg-rule-strong" />
        <span className="absolute top-3.5 right-[16.67%] left-[16.67%] h-px bg-rule-strong" />
      </div>
      <ol className="grid gap-x-4 gap-y-6 sm:grid-cols-3">
        {AGENDA.map((goal) => {
          const own = problems.filter((p) => p.agenda.some((a) => a === goal.id));
          return (
            <li key={goal.id} className="relative flex flex-col items-center text-center">
              <span aria-hidden className="absolute -top-3.5 left-1/2 h-3.5 w-px bg-rule-strong max-sm:hidden" />
              <Link href={`/agenda#${goal.id}`} className="group flex flex-col items-center rounded-md px-2 pt-1 text-ink">
                <AppleIcon variant="gold" className="size-11" />
                <span className="mt-1 font-sans text-xs font-bold tracking-widest text-ink-subtle">GOAL {goal.numeral}</span>
                <span className="font-bold group-hover:text-brand">{goal.title}</span>
              </Link>
              <span aria-hidden className="my-2 h-4 w-px bg-rule-strong" />
              {own.length ? (
                <ul className={titles ? "w-full space-y-1.5 text-left" : "flex max-w-56 flex-wrap justify-center gap-1.5"}>
                  {own.map((p) => (
                    <li key={p.id}>
                      <ProblemApple problem={p} titled={titles} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-subtle">No problems yet</p>
              )}
            </li>
          );
        })}
      </ol>
      <Legend />
    </div>
  );
}

function ProblemApple({ problem: p, titled }: { problem: Problem; titled?: boolean }) {
  const label = `Problem ${p.number}: ${p.title} (${PROBLEM_STATUS_LABELS[p.status]})`;
  if (titled)
    return (
      <Link href={`/problems/${p.slug}`} className="group flex items-start gap-2 rounded px-1.5 py-1 text-[0.95rem]/snug text-ink hover:bg-surface">
        <StatusIcon status={p.status} additional={!p.published} className="mt-0.5 size-5 flex-none" />
        <span className="min-w-0">
          <span className="font-bold tabular-nums">{p.number}.</span> <span className="group-hover:text-brand">{p.title}</span>
        </span>
      </Link>
    );
  return (
    <Link href={`/problems/${p.slug}`} title={label} aria-label={label} className="group relative flex flex-col items-center rounded px-1 py-0.5 text-ink hover:bg-surface">
      <StatusIcon status={p.status} additional={!p.published} className="size-8 transition group-hover:-translate-y-0.5" />
      <span className="font-sans text-xs font-bold tabular-nums text-ink-muted group-hover:text-brand">{p.number}</span>
    </Link>
  );
}

function Legend() {
  return (
    <p className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-ink-subtle">
      <span className="inline-flex items-center gap-1.5">
        <AppleIcon variant="gold" /> long-term goal
      </span>
      <span className="inline-flex items-center gap-1.5">
        <AppleIcon variant="red" /> open
      </span>
      <span className="inline-flex items-center gap-1.5">
        <AppleIcon variant="outline" /> under revision
      </span>
      <span className="inline-flex items-center gap-1.5">
        <AppleIcon variant="grey" /> solved
      </span>
    </p>
  );
}
