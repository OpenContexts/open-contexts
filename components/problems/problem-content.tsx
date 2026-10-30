// The cached body of a problem page: everything except the parts that depend on who is looking.
import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import type { ReactNode } from "react";
import { MarkdownContent, MarkdownInline } from "@/components/markdown/markdown";
import { ContributionsSection, DiscussionSection, RelatedSection } from "@/components/problems/community-sections";
import { HistoryKindTag } from "@/components/problems/kind-tag";
import { ProblemBox } from "@/components/problems/problem-box";
import { StatusBadge } from "@/components/problems/status";
import { ContributeOptions } from "@/components/submissions/contribute-options";
import { Chip, ChipList, ExpandableList, PartTitle } from "@/components/ui";
import { getArea } from "@/lib/areas";
import { communityTag, getApprovedComments, getApprovedContributions, getApprovedLinks } from "@/lib/data/community";
import { getProblemById, getProblems, problemLabel, statusSince } from "@/lib/data/problems";
import { formatDate, formatNames } from "@/lib/format";

/**
 * Rendered once and reused for every visitor until something on the page changes: the problem
 * (tag "problems", from getProblems) or what users added to it (communityTag, invalidated by
 * moderation decisions). `commentBox` is passed through uncached, so it can depend on the visitor.
 */
export async function ProblemContent({ id, commentBox }: { id: string; commentBox: ReactNode }) {
  "use cache";
  cacheLife("max");
  cacheTag(communityTag(id), "community");

  const [problem, all, contributions, links, comments] = await Promise.all([
    getProblemById(id),
    getProblems(),
    getApprovedContributions(id),
    getApprovedLinks(id),
    getApprovedComments(id),
  ]);
  // The page checked that the problem exists just before; this only covers a deletion in between.
  if (!problem) return null;

  const others = new Map(all.map((p) => [p.id, { slug: p.slug, label: problemLabel(p) }]));
  const areas = problem.areas.map(getArea).filter((a) => a !== undefined);
  const history = problem.history.toSorted((a, b) => b.date.localeCompare(a.date));

  return (
    <article>
      <ProblemBox problem={problem} heading />

      <div className="mb-5 flex flex-wrap items-baseline justify-center gap-x-5 gap-y-1.5 text-[0.95rem] text-ink-muted">
        <span>
          <StatusBadge status={problem.status} /> <span className="text-sm">since {formatDate(statusSince(problem))}</span>
        </span>
        <span>
          <b className="text-ink">Area{areas.length === 1 ? "" : "s"}:</b>{" "}
          {areas.map((a, i) => (
            <span key={a.id}>
              {i > 0 && ", "}
              <Link href={`/problems?area=${a.id}`} className="text-brand hover:underline">
                {a.numeral}. {a.title}
              </Link>
            </span>
          ))}
        </span>
        {problem.posedBy.length > 0 && (
          <span>
            <b className="text-ink">Posed by:</b> {formatNames(problem.posedBy)}
          </span>
        )}
        <span>
          <b className="text-ink">Updated:</b> {formatDate(problem.updated)}
        </span>
      </div>

      <MarkdownContent source={problem.body} className="lettered" />

      {problem.tags.length > 0 && (
        <ChipList className="mt-6">
          {problem.tags.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </ChipList>
      )}

      {problem.references.length > 0 && (
        <>
          <PartTitle count={problem.references.length}>References</PartTitle>
          <ExpandableList limit={10} noun={["reference", "references"]} ordered className="list-decimal pl-6">
            {problem.references.map((r) => (
              <li key={r.text} className="my-1.5">
                {r.url ? (
                  <a href={r.url} rel="noopener" className="text-brand hover:underline">
                    {r.text}
                  </a>
                ) : (
                  r.text
                )}
              </li>
            ))}
          </ExpandableList>
        </>
      )}

      <RelatedSection problemId={problem.id} links={links} others={others} />

      <PartTitle>Progress and history</PartTitle>
      {history.length ? (
        <ul>
          {history.map((h, i) => (
            <li key={i} className="grid grid-cols-[6.4rem_minmax(0,1fr)] gap-x-4 border-t border-dotted border-rule-strong py-2 last:border-b max-sm:grid-cols-1">
              <span className="text-[0.95rem] text-ink-subtle tabular-nums">{formatDate(h.date)}</span>
              <span>
                <HistoryKindTag entry={h} className="relative -top-px mr-2" />
                <MarkdownInline source={h.text} />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink-muted">No entries yet.</p>
      )}

      <ContributionsSection items={contributions} />

      <section className="mt-8 rounded border border-rule bg-surface px-5 pt-4 pb-3.5">
        <h3 className="mb-3 font-sans text-sm font-bold">Contribute to this problem</h3>
        <ContributeOptions slug={problem.slug} />
        <p className="mt-2.5 text-sm text-ink-subtle">
          You need to be signed in. Every contribution is reviewed by a moderator before it appears, and is credited
          to the people you name.
        </p>
      </section>

      <DiscussionSection comments={comments} commentBox={commentBox} />
    </article>
  );
}
