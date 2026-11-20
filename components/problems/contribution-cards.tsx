// The contributions to a problem as they are listed on its page and on /problems/<slug>/contributions: results as
// cards, with their votes and newest comments, and suggested references as single lines. Rendered inside cached
// pages; the votes and comment forms they hold load what depends on the visitor in the browser.
import Link from "next/link";
import { CitationText } from "@/components/markdown/citation-text";
import { type CitableReferences, MarkdownContent } from "@/components/markdown/markdown";
import { CommentThread } from "@/components/problems/comment-thread";
import { contributionLook, KindTag } from "@/components/problems/kind-tag";
import { VoteControl } from "@/components/problems/votes";
import { CommentButton } from "@/components/submissions/comment-button";
import { Clamped, CommentIcon, toneColors } from "@/components/ui";
import { cn } from "@/lib/cn";
import { AI_USE_LABELS, type ContributionKind } from "@/lib/constants";
import type { ApprovedContribution } from "@/lib/data/community";
import { excerpt } from "@/lib/excerpt";
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

/**
 * About how much of a result's summary its card carries, in characters of markdown. The card shows a few lines; the
 * rest, often pages of math, would only make the page slow, and is on the result's own page.
 */
const CARD_SUMMARY = 1200;

/** How many of a result's comments its card shows; the rest are on its own page. */
const PREVIEW_COMMENTS = 5;

/**
 * One result, laid out like an answer on a forum: a strip along the top tinted in the colour of its kind (see
 * contributionLook), with its permanent key and date; the votes and the number of comments in a column on the
 * left; the title, who takes responsibility, the summary and its link. All of that opens the result's own page.
 * Below it, the newest comments. `references`: the problem's, which the texts cite.
 */
export function ResultCard({ item: c, references }: { item: ApprovedContribution; references: CitableReferences }) {
  const page = c.key && permalinkPath(c.key);
  const look = contributionLook(c.kind);
  const tone = toneColors[look.tone];
  const summary = page ? excerpt(c.summary, CARD_SUMMARY) : { text: c.summary, cut: false };
  return (
    <li className="overflow-hidden rounded-md border border-rule bg-paper">
      {/* The other links and buttons inside sit above the title's link, which covers the card. */}
      <div className={cn("relative", page && "group/card transition-colors hover:bg-surface/60 [&_a:not([data-cover])]:relative [&_a:not([data-cover])]:z-10 [&_button]:relative [&_button]:z-10")}>
        <div className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b px-4 py-2", tone.tint, look.strong ? tone.border : "border-rule")}>
          <KindTag look={look} />
          {c.key && <span className="font-sans text-xs font-bold text-ink-subtle tabular-nums">{SITE.name} {c.key}</span>}
          <span className="ml-auto text-sm text-ink-subtle">{formatDate(c.createdAt)}</span>
        </div>
        <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 px-4 pt-3 pb-3.5">
          <div className="relative z-10 flex flex-col items-center gap-2 self-start">
            <VoteControl id={c.id} votes={c.votes} />
            {page && (
              <span className="flex items-center gap-1 font-sans text-xs text-ink-subtle tabular-nums" title={plural(c.comments.length, "comment")}>
                <CommentIcon className="size-3.5" />
                {c.comments.length}
                <span className="sr-only"> comments</span>
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-[1.1rem]/snug font-bold">
              {page ? (
                <Link href={page} data-cover className="text-ink group-hover/card:text-brand after:absolute after:inset-0">
                  {c.title}
                </Link>
              ) : (
                c.title
              )}
            </h3>
            <p className="mt-0.5 text-sm text-ink-subtle">
              by {c.credit} · {AI_USE_LABELS[c.aiUse]}
            </p>
            <Clamped lines={4} more={(summary.cut && page) || undefined} className="mt-2">
              <MarkdownContent source={summary.text} untrusted references={references} className="text-[0.98rem] [&>*:last-child]:mb-0" />
            </Clamped>
            {(c.url || page) && (
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {c.url && (
                  <a href={c.url} rel="nofollow ugc noopener noreferrer" className="min-w-0 max-w-full truncate text-brand hover:underline">
                    ↗ {LINK_LABELS[c.kind]}: <span className="text-ink-subtle">{displayUrl(c.url)}</span>
                  </a>
                )}
                {page && (
                  <span aria-hidden className="ml-auto shrink-0 font-sans text-xs font-bold text-ink-subtle transition group-hover/card:text-brand">
                    Open, discuss and cite <span className="inline-block transition group-hover/card:translate-x-0.5">→</span>
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
      {c.key && <CardComments item={c} contributionKey={c.key} references={references} />}
    </li>
  );
}

/**
 * The newest comments on a result, in the style of the discussion below, a little smaller, with the button to add
 * one. The full discussion is on the result's own page.
 */
function CardComments({ item: c, contributionKey, references }: { item: ApprovedContribution; contributionKey: string; references: CitableReferences }) {
  const page = permalinkPath(contributionKey);
  const on = { type: "contribution", key: contributionKey } as const;
  const threads = c.comments.filter((x) => !x.parentId);
  // Oldest first under each comment, as in a conversation.
  const replies = Map.groupBy(c.comments.toReversed().filter((x) => x.parentId), (x) => x.parentId);
  const shown = threads.slice(0, PREVIEW_COMMENTS);
  return (
    <div className="border-t border-rule px-4 pt-3 pb-3">
      {shown.length > 0 && (
        <ol aria-label="Newest comments" className="mb-2 space-y-3.5">
          {shown.map((x) => (
            <CommentThread key={x.id} comment={x} replies={replies.get(x.id) ?? []} on={on} references={references} compact />
          ))}
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

/**
 * A suggested reference, as a slim line in the same list as the results: the citation with its link, who
 * suggested it and when, and why it is relevant on request. References get no votes, comments or permanent link.
 */
export function ReferenceLine({ item: c, references }: { item: ApprovedContribution; references: CitableReferences }) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 px-1 py-1">
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
