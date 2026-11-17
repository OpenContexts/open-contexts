import Link from "next/link";
import { Tag } from "@/components/ui";
import { cn } from "@/lib/cn";
import { AI_USE_LABELS } from "@/lib/constants";
import type { VersionSummary } from "@/lib/data/permalinks";
import { formatDate } from "@/lib/format";
import { permalinkPath } from "@/lib/permalinks";

/**
 * Who made the change that started a version: "by Jane Doe · no AI assistance", or "by the editors" when no one
 * is credited. Not for the first version, whose text is the problem as posed.
 */
export function versionCredit(v: Pick<VersionSummary, "credit" | "aiUse">): string {
  if (!v.credit) return "by the editors";
  return v.aiUse ? `by ${v.credit} · ${AI_USE_LABELS[v.aiUse]}` : `by ${v.credit}`;
}

/**
 * A problem's versions, newest first: each with its permanent link, the day it started, what changed and who
 * changed it.
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
            {v.version > 1 && <p className="mt-0.5 text-sm text-ink-subtle">{versionCredit(v)}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
