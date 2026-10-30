import Link from "next/link";
import { MarkdownInline } from "@/components/markdown/markdown";
import { ChipLink } from "@/components/ui";
import { getArea } from "@/lib/areas";
import { type Problem, statusSince } from "@/lib/data/problems";
import { formatDate, formatNames } from "@/lib/format";
import { StatusBadge, StatusIcon } from "./status";

/**
 * One problem in a list: number, title, the start of the statement, and its details. The whole row
 * opens the problem (the title link covers it); the area chips stay separate links above that.
 */
export function ProblemRow({ problem: p }: { problem: Problem }) {
  return (
    <li className="group relative grid grid-cols-[3.4rem_minmax(0,1fr)_auto] gap-x-3 border-t border-rule px-2 py-3 transition-colors hover:bg-surface max-sm:grid-cols-[2.9rem_minmax(0,1fr)] max-sm:px-0">
      <span className="flex items-center gap-1.5 self-start pt-0.5 font-bold tabular-nums">
        <StatusIcon status={p.status} />
        {p.number}
      </span>
      <div className="min-w-0">
        <Link href={`/problems/${p.slug}`} className="font-bold text-ink group-hover:text-brand after:absolute after:inset-0">
          {p.title}
        </Link>
        {/* The statement's first paragraph, cut after two lines; display math is set inline here. */}
        <div className="mt-0.5 line-clamp-2 text-[0.95rem] text-ink-muted [&_.katex-display]:my-0 [&_.katex-display]:inline">
          <MarkdownInline source={p.statement.trim().split(/\n\s*\n/)[0]} />
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-subtle">
          <span className="relative z-10 flex gap-1">
            {p.areas.map((id) => {
              const area = getArea(id);
              return area ? (
                <ChipLink key={id} shape="square" href={`/problems?area=${id}`} title={area.title} className="px-1 py-0 text-xs">
                  {area.numeral}
                </ChipLink>
              ) : null;
            })}
          </span>
          {p.posedBy.length > 0 && <span>posed by {formatNames(p.posedBy)}</span>}
          <span>status since {formatDate(statusSince(p))}</span>
          <span className="sm:hidden">
            <StatusBadge status={p.status} />
          </span>
        </p>
      </div>
      <span className="self-start pt-0.5 max-sm:hidden">
        <StatusBadge status={p.status} />
      </span>
    </li>
  );
}

export function ProblemList({ problems, empty = "Nothing here yet." }: { problems: Problem[]; empty?: React.ReactNode }) {
  if (!problems.length) return <p className="py-4 text-ink-muted">{empty}</p>;
  return (
    <ul className="border-b border-rule">
      {problems.map((p) => (
        <ProblemRow key={p.id} problem={p} />
      ))}
    </ul>
  );
}
