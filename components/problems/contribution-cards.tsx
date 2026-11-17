// The contributions to a problem as they are listed on its page and on /problems/<slug>/contributions: results as
// cards, with their votes and newest comments, and suggested references as single lines. Rendered inside cached
// pages; the votes and comment forms they hold load what depends on the visitor in the browser.
import Link from "next/link";
import type { ReactNode } from "react";
import { CitationText } from "@/components/markdown/citation-text";
import { type CitableReferences, MarkdownContent } from "@/components/markdown/markdown";
import { contributionLook, KindTag } from "@/components/problems/kind-tag";
import { VoteControl } from "@/components/problems/votes";
import { CommentButton } from "@/components/submissions/comment-button";
import { Clamped, toneColors } from "@/components/ui";
import { cn } from "@/lib/cn";
import { AI_USE_LABELS, type ContributionKind } from "@/lib/constants";
import type { ApprovedContribution, Comment } from "@/lib/data/community";
import { formatDate, plural } from "@/lib/format";
import { permalinkPath } from "@/lib/permalinks";
import { displayUrl } from "@/lib/references";
import { SITE } from "@/lib/site";

/** What a result's link leads to, by kind: a write-up for most, code and data for computational evidence. */
const LINK_LABELS: Record<ContributionKind, string> = {
  claim: "Solution",
  partial: "Write-up",
  negative: "Write-up",
  reformulation: "Write-up",
  decomposition: "Write-up",
  evidence: "Code and data",
  verification: "Verification",
  exposition: "Exposition",
  challenge: "Write-up",
  reference: "Source",
};

/** How many of a result's comments its card shows; the rest are on its own page. */
const PREVIEW_COMMENTS = 5;

/** The kind and date in a strip along the top of a card, tinted for the outcomes that matter (see contributionLook). */
function CardHeader({ item: c, children }: { item: ApprovedContribution; children?: ReactNode }) {
  const look = contributionLook(c.kind);
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-rule px-4 py-2", look.strong ? toneColors[look.tone].tint : "bg-surface")}>
      <KindTag look={look} />
      <span className="text-sm text-ink-subtle">{formatDate(c.createdAt)}</span>
      {children}
    </div>
  );
}

/**
 * One result: the header with its permanent key; its votes beside the title, who takes responsibility, the
 * summary and its links; then its newest comments. `references`: the problem's, which the texts cite.
 */
export function ResultCard({ item: c, references }: { item: ApprovedContribution; references: CitableReferences }) {
  const page = c.key && permalinkPath(c.key);
  return (
    <li className="overflow-hidden rounded-md border border-rule bg-paper">
      <CardHeader item={c}>
        {page && (
          <Link href={page} className="ml-auto font-sans text-xs font-bold text-ink-subtle tabular-nums hover:text-brand" title="Permanent link to this contribution">
            {SITE.name} {c.key}
          </Link>
        )}
      </CardHeader>
      <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 px-4 pt-3 pb-3.5">
        <VoteControl id={c.id} votes={c.votes} className="-ml-1" />
        <div className="min-w-0">
          <h3 className="text-[1.08rem] font-bold">
            {page ? (
              <Link href={page} className="text-ink hover:text-brand">
                {c.title}
              </Link>
            ) : (
              c.title
            )}
          </h3>
          <p className="mt-0.5 text-sm text-ink-subtle">
            by {c.credit} · {AI_USE_LABELS[c.aiUse]}
          </p>
          <Clamped lines={5} className="mt-2">
            <MarkdownContent source={c.summary} untrusted references={references} className="text-[0.98rem] [&>*:last-child]:mb-0" />
          </Clamped>
          {(c.url || page) && (
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {c.url && (
                <a href={c.url} rel="nofollow ugc noopener noreferrer" className="min-w-0 max-w-full truncate text-brand hover:underline">
                  ↗ {LINK_LABELS[c.kind]}: <span className="text-ink-subtle">{displayUrl(c.url)}</span>
                </a>
              )}
              {page && (
                <Link href={page} className="ml-auto shrink-0 text-brand hover:underline">
                  Open and cite →
                </Link>
              )}
            </p>
          )}
        </div>
      </div>
      {c.key && <CardComments item={c} contributionKey={c.key} references={references} />}
    </li>
  );
}

/** How many replies to each previewed comment its card shows. */
const PREVIEW_REPLIES = 3;

/**
 * The newest comments on a result, each shortened, with its first replies and a button to reply, and the button
 * to add a comment. The full discussion is on the result's own page.
 */
function CardComments({ item: c, contributionKey, references }: { item: ApprovedContribution; contributionKey: string; references: CitableReferences }) {
  const page = permalinkPath(contributionKey);
  const on = { type: "contribution", key: contributionKey } as const;
  const threads = c.comments.filter((x) => !x.parentId);
  // Oldest first under each comment, as in a conversation.
  const replies = Map.groupBy(c.comments.toReversed().filter((x) => x.parentId), (x) => x.parentId);
  const shown = threads.slice(0, PREVIEW_COMMENTS);
  return (
    <div className="border-t border-rule bg-surface/50 px-4 pt-2.5 pb-3">
      {shown.length > 0 && (
        <ol aria-label="Newest comments" className="mb-1.5 divide-y divide-rule">
          {shown.map((x) => {
            const answers = replies.get(x.id) ?? [];
            return (
              <li key={x.id} className="py-2.5 first:pt-0.5">
                <PreviewComment comment={x} references={references} />
                {answers.length > 0 && (
                  <ol aria-label={`Replies to ${x.author.name}`} className="mt-2 space-y-2 pl-5">
                    {answers.slice(0, PREVIEW_REPLIES).map((r) => (
                      <li key={r.id}>
                        <PreviewComment comment={r} references={references} />
                      </li>
                    ))}
                    {answers.length > PREVIEW_REPLIES && (
                      <li>
                        <Link href={`${page}#comment-${x.id}`} className="font-sans text-xs text-brand hover:underline">
                          {plural(answers.length - PREVIEW_REPLIES, "more reply", "more replies")} →
                        </Link>
                      </li>
                    )}
                  </ol>
                )}
                <CommentButton on={on} replyTo={{ id: x.id, author: x.author.name }} references={references} />
              </li>
            );
          })}
        </ol>
      )}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <CommentButton on={on} references={references} formClassName="basis-full" />
        {c.comments.length > shown.length && (
          <Link href={`${page}#discussion`} className="font-sans text-xs font-bold text-brand hover:underline">
            All {plural(c.comments.length, "comment")} →
          </Link>
        )}
      </div>
    </div>
  );
}

/** One comment in a card: who, when, and the text shortened to a few lines. */
function PreviewComment({ comment: x, references }: { comment: Comment; references: CitableReferences }) {
  return (
    <>
      <p className="text-sm text-ink-subtle">
        <strong className="text-ink">{x.author.name}</strong> · {formatDate(x.createdAt)}
      </p>
      <Clamped lines={3}>
        <MarkdownContent source={x.body} untrusted references={references} className="text-[0.95rem] [&>*:last-child]:mb-0" />
      </Clamped>
    </>
  );
}

/**
 * A suggested reference, as a slim card in the same list as the results: the citation with its link, who
 * suggested it and when, and why it is relevant on request. References get no votes, comments or permanent link.
 */
export function ReferenceLine({ item: c, references }: { item: ApprovedContribution; references: CitableReferences }) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 rounded-md border border-rule bg-paper px-4 py-2.5">
      <KindTag look={contributionLook("reference")} className="relative -top-px" />
      <div className="min-w-0">
        <p className="text-[0.98rem]">
          <CitationText text={c.title} url={c.url} untrusted />
        </p>
        <details className="group mt-0.5 text-sm">
          <summary className="cursor-pointer list-none text-ink-subtle hover:text-ink">
            Suggested by {c.credit} · {formatDate(c.createdAt)} · <span className="text-brand group-open:hidden">Why it is relevant ▾</span>
            <span className="hidden text-brand group-open:inline">Hide ▴</span>
          </summary>
          <MarkdownContent source={c.summary} untrusted references={references} className="mt-1.5 text-[0.95rem] text-ink-muted [&>*:last-child]:mb-0" />
        </details>
      </div>
    </li>
  );
}

/** A contribution in a list: a result as a card, a suggested reference as a slim one. */
export function ContributionItem({ item, references }: { item: ApprovedContribution; references: CitableReferences }) {
  return item.kind === "reference" ? <ReferenceLine item={item} references={references} /> : <ResultCard item={item} references={references} />;
}
