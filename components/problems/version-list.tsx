import Link from "next/link";
import { Tag } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { VersionSummary } from "@/lib/data/permalinks";
import { formatDate } from "@/lib/format";
import { permalinkPath } from "@/lib/permalinks";

/**
 * A problem's versions, newest first: each with its permanent link, the day it started and what changed.
 * `shown`: the version on the page, marked as such.
 */
export function VersionList({ versions, shown }: { versions: VersionSummary[]; shown?: number }) {
  const latest = versions.at(-1)?.version;
  return (
    <ol className="border-b border-rule">
      {versions.toReversed().map((v) => (
        <li key={v.version} className="grid grid-cols-[6.6rem_minmax(0,1fr)] gap-x-5 border-t border-rule py-3 max-sm:grid-cols-[4.8rem_minmax(0,1fr)] max-sm:gap-x-3">
          <span className="text-right text-[0.95rem] text-ink-subtle tabular-nums max-sm:text-sm">{formatDate(v.created)}</span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <Link href={permalinkPath(v.key)} className={cn("text-brand tabular-nums hover:underline", v.version === shown && "font-bold")}>
                Version {v.version}
              </Link>
              <span className="text-sm text-ink-subtle tabular-nums">{v.key}</span>
              {v.version === latest && <Tag tone="success">Current</Tag>}
              {v.version === shown && <Tag>Shown here</Tag>}
            </p>
            <p className="mt-0.5 text-[0.98rem]">{v.changeSummary ?? (v.version === 1 ? "First recorded version." : "No summary recorded.")}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
