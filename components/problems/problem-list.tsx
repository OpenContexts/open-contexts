import Link from "next/link";
import { MarkdownInline } from "@/components/markdown/markdown";
import { ChipLink } from "@/components/ui";
import { getArea } from "@/lib/areas";
import { type CommunityCounts, getCommunityCounts } from "@/lib/data/community";
import { type Problem, statusSince } from "@/lib/data/problems";
import { formatDate, formatNames, plural } from "@/lib/format";
import { StatusBadge, StatusIcon } from "./status";

/**
 * One problem in a list: number, title and status, the start of the statement, then areas, who posed it and
 * how much the community has added (approved contributions and comments).
 * The whole row opens the problem (the title link covers it); the area chips stay separate links above that.
 */
export function ProblemRow({ problem: p, counts }: { problem: Problem; counts?: CommunityCounts[string] }) {
  const decided = p.status !== "open" && (p.status === "solved" ? "solved" : "under revision since");
  return (
    <li className="group relative grid grid-cols-[3.8rem_minmax(0,1fr)] gap-x-3 border-t border-rule px-2 py-4 transition-colors hover:bg-surface max-sm:grid-cols-[3rem_minmax(0,1fr)] max-sm:px-0">
      <span className="flex items-center gap-1.5 self-start text-[1.3rem]/[1.6rem] font-bold tabular-nums max-sm:text-[1.1rem]">
        <StatusIcon status={p.status} className="size-[0.8em]" />
        {p.number}
      </span>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-4">
          {/* The counts follow the title on the same line; on phones they get a line of their own below it. */}
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-0.5">
            <Link href={`/problems/${p.slug}`} className="text-[1.12rem]/[1.6rem] font-bold text-ink group-hover:text-brand after:absolute after:inset-0">
              {p.title}
            </Link>
            {counts && (counts.contributions > 0 || counts.comments > 0) && (
              <span className="text-xs text-ink-muted max-sm:basis-full">
                {[counts.contributions && plural(counts.contributions, "contribution"), counts.comments && plural(counts.comments, "comment")].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
          <StatusBadge status={p.status} className="mt-0.5 shrink-0 max-sm:hidden" />
        </div>
        {/* The statement's first paragraph, cut after two lines; display math is set inline here. */}
        <div className="mt-1 line-clamp-2 text-[0.95rem] text-ink-muted [&_.katex-display]:my-0 [&_.katex-display]:inline">
          <MarkdownInline source={p.statement.trim().split(/\n\s*\n/)[0]} />
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-ink-subtle">
          <StatusBadge status={p.status} className="sm:hidden" />
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
          {p.posedBy.length > 0 && <span>posed by {formatNames(p.posedBy)}, {p.posed.slice(0, 4)}</span>}
          {decided && (
            <span>
              {decided} {formatDate(statusSince(p))}
            </span>
          )}
        </p>
      </div>
    </li>
  );
}

export async function ProblemList({ problems, empty = "Nothing here yet." }: { problems: Problem[]; empty?: React.ReactNode }) {
  if (!problems.length) return <p className="py-4 text-ink-muted">{empty}</p>;
  const counts = await getCommunityCounts();
  return (
    <ul className="border-b border-rule">
      {problems.map((p) => (
        <ProblemRow key={p.id} problem={p} counts={counts[p.id]} />
      ))}
    </ul>
  );
}
