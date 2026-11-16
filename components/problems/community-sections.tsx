// The parts of a problem page that users add to: contributions and the discussion.
// They render data passed in by ProblemContent, which caches them; only CommentBox reads the session.
import Link from "next/link";
import type { ReactNode } from "react";
import { type CitableReferences, MarkdownContent } from "@/components/markdown/markdown";
import { contributionLook, KindTag } from "@/components/problems/kind-tag";
import { CommentForm, type CommentTarget } from "@/components/submissions/comment-form";
import { Clamped, ExpandableList, PartTitle, toneColors } from "@/components/ui";
import { AI_USE_LABELS, type ContributionKind } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth/session";
import type { getApprovedComments, getApprovedContributions } from "@/lib/data/community";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { permalinkPath } from "@/lib/permalinks";
import { SITE } from "@/lib/site";

type Contribution = Awaited<ReturnType<typeof getApprovedContributions>>[number];
type Comment = Awaited<ReturnType<typeof getApprovedComments>>[number];

/** "https://www.arxiv.org/abs/2401.1234" → "arxiv.org/abs/2401.1234" */
const displayUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

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
 * Newest first, as cards: results with their permanent key and links, and suggested references, which point to
 * the literature and so show the citation and why it matters instead. `references`: the problem's, which the
 * summaries cite with \cite{key}.
 */
export function ContributionsSection({ items, references }: { items: Contribution[]; references: CitableReferences }) {
  return (
    <>
      <PartTitle>Contributions</PartTitle>
      {items.length ? (
        <ExpandableList limit={5} noun={["contribution", "contributions"]} className="space-y-5">
          {items.map((c) => (c.kind === "reference" ? <ReferenceCard key={c.id} item={c} references={references} /> : <ResultCard key={c.id} item={c} references={references} />))}
        </ExpandableList>
      ) : (
        <p className="text-ink-muted">No contributions recorded yet.</p>
      )}
    </>
  );
}

/** The kind and date in a strip along the top of a card, tinted for the outcomes that matter (see contributionLook). */
function CardHeader({ item: c, children }: { item: Contribution; children?: ReactNode }) {
  const look = contributionLook(c.kind);
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-rule px-4 py-2", look.strong ? toneColors[look.tone].tint : "bg-surface")}>
      <KindTag look={look} />
      <span className="text-sm text-ink-subtle">{formatDate(c.createdAt)}</span>
      {children}
    </div>
  );
}

/** A suggested reference: the citation itself as the title, linked to the source, and why it is relevant. */
function ReferenceCard({ item: c, references }: { item: Contribution; references: CitableReferences }) {
  return (
    <li className="overflow-hidden rounded-md border border-rule bg-paper">
      <CardHeader item={c} />
      <div className="px-4 pt-3 pb-3.5">
        <p className="font-bold">
          {c.url ? (
            <a href={c.url} rel="nofollow ugc noopener noreferrer" className="text-ink hover:text-brand hover:underline">
              {c.title} <span aria-hidden className="font-normal text-brand">↗</span>
            </a>
          ) : (
            c.title
          )}
        </p>
        <Clamped lines={3} className="mt-1.5">
          <MarkdownContent source={c.summary} untrusted references={references} className="text-[0.98rem] text-ink-muted [&>*:last-child]:mb-0" />
        </Clamped>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="text-ink-subtle">Suggested by {c.credit}</span>
          {c.url && (
            <a href={c.url} rel="nofollow ugc noopener noreferrer" className="min-w-0 max-w-full truncate text-brand hover:underline">
              ↗ {LINK_LABELS[c.kind]}: <span className="text-ink-subtle">{displayUrl(c.url)}</span>
            </a>
          )}
        </p>
      </div>
    </li>
  );
}

/**
 * One result: the header with its permanent key, then the title, who takes responsibility, the summary and
 * its links.
 */
function ResultCard({ item: c, references }: { item: Contribution; references: CitableReferences }) {
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
      <div className="px-4 pt-3 pb-3.5">
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
    </li>
  );
}

/**
 * The comment box first (`commentBox`, rendered per visitor), then the comments, newest first. They cite the
 * `references` of the problem or blog post they are on; `empty` is shown while there are none.
 */
export function DiscussionSection({
  comments,
  commentBox,
  references,
  empty = "No comments yet. Questions about the statement and informal remarks are welcome here.",
}: {
  comments: Comment[];
  commentBox: ReactNode;
  references: CitableReferences;
  empty?: string;
}) {
  return (
    <>
      <PartTitle id="discussion">
        Discussion
      </PartTitle>
      {commentBox}
      {comments.length ? (
        <ExpandableList limit={10} noun={["older comment", "older comments"]} className="mt-6 border-b border-rule">
          {comments.map((c) => (
            <li key={c.id} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3.5 border-t border-rule py-4">
              <Initials name={c.author.name} />
              <div className="min-w-0">
                <p className="text-sm text-ink-subtle">
                  <strong className="text-[0.95rem] text-ink">{c.author.name}</strong> · {formatDate(c.createdAt)}
                </p>
                <MarkdownContent source={c.body} untrusted references={references} className="mt-1 text-[0.98rem] [&>*:last-child]:mb-0" />
              </div>
            </li>
          ))}
        </ExpandableList>
      ) : (
        <p className="mt-5 text-ink-muted">{empty}</p>
      )}
    </>
  );
}

function Initials({ name }: { name: string }) {
  const letters = name.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <span aria-hidden className="flex size-9 items-center justify-center rounded-full bg-surface font-sans text-[0.8rem] font-bold text-ink-muted ring-1 ring-rule-strong">
      {letters}
    </span>
  );
}

/** The comment form for a problem or blog post, or a sign-in link. Reads the session. */
export async function CommentBox({ on, references }: { on: CommentTarget; references: CitableReferences }) {
  if (await getCurrentUser()) return <CommentForm on={on} references={references} />;
  return <SignInToComment page={on.type === "problem" ? `/problems/${on.slug}` : `/blog/${on.slug}`} />;
}

function SignInToComment({ page }: { page: string }) {
  return (
    <p className="text-[0.95rem]">
      <Link href={`/sign-in?next=${encodeURIComponent(`${page}#discussion`)}`} className="text-brand hover:underline">
        Sign in
      </Link>{" "}
      to join the discussion.
    </p>
  );
}
