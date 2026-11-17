// The parts of a problem page that users add to: contributions (see contribution-cards.tsx) and the discussion.
// They render data passed in by ProblemContent, which caches them; only CommentBox reads the session.
import Link from "next/link";
import type { ReactNode } from "react";
import { type CitableReferences, MarkdownContent } from "@/components/markdown/markdown";
import { ContributionItem } from "@/components/problems/contribution-cards";
import { CommentForm, type CommentTarget, discussionPage } from "@/components/submissions/comment-form";
import { CommentButton } from "@/components/submissions/comment-button";
import { ButtonLink, ExpandableList, PartTitle } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/session";
import type { ApprovedContribution as Contribution, Comment } from "@/lib/data/community";
import { cn } from "@/lib/cn";
import { formatDate, plural } from "@/lib/format";

/**
 * How much of the list the problem page shows: the newest contributions until it has shown this many results,
 * with the references suggested in between; never more than PREVIEW_ITEMS. All are on the contributions page.
 */
const PREVIEW_RESULTS = 4;
const PREVIEW_ITEMS = 7;

/** The newest contributions, as many as the problem page shows (see PREVIEW_RESULTS). */
function preview(items: Contribution[]): Contribution[] {
  const shown: Contribution[] = [];
  let results = 0;
  for (const c of items) {
    if (results === PREVIEW_RESULTS || shown.length === PREVIEW_ITEMS) break;
    shown.push(c);
    if (c.kind !== "reference") results++;
  }
  return shown;
}

/**
 * The newest contributions in one list: results as cards, with their votes and comments, and the references
 * suggested in between as slim ones; then the way to all of them (/problems/<slug>/contributions).
 * `references`: the problem's, which the texts cite with \cite{key}.
 */
export function ContributionsSection({ items, references, slug }: { items: Contribution[]; references: CitableReferences; slug: string }) {
  return (
    <>
      <PartTitle>Contributions</PartTitle>
      {items.length ? (
        <>
          <ol className="space-y-4">
            {preview(items).map((c) => (
              <ContributionItem key={c.id} item={c} references={references} />
            ))}
          </ol>
          <p className="mt-5 text-right">
            <ButtonLink href={`/problems/${slug}/contributions`} variant="quiet" size="sm">
              All {plural(items.length, "contribution")} →
            </ButtonLink>
          </p>
        </>
      ) : (
        <p className="text-ink-muted">No contributions recorded yet.</p>
      )}
    </>
  );
}

/**
 * The comment box first (`commentBox`, rendered per visitor), then the comments, newest first, each with its
 * replies below it, oldest first, and a button to reply. They cite the `references` of the problem or blog post
 * they are `on`; `empty` is shown while there are none.
 */
export function DiscussionSection({
  on,
  comments,
  commentBox,
  references,
  empty = "No comments yet. Questions about the statement and informal remarks are welcome here.",
}: {
  on: CommentTarget;
  comments: Comment[];
  commentBox: ReactNode;
  references: CitableReferences;
  empty?: string;
}) {
  const threads = comments.filter((c) => !c.parentId);
  // A reply whose comment was taken down again goes with it.
  const replies = Map.groupBy(comments.toReversed().filter((c) => c.parentId), (c) => c.parentId);
  return (
    <>
      <PartTitle id="discussion">
        Discussion
      </PartTitle>
      {commentBox}
      {threads.length ? (
        <ExpandableList limit={10} noun={["older comment", "older comments"]} className="mt-6 border-b border-rule">
          {threads.map((c) => (
            <li key={c.id} id={`comment-${c.id}`} className="grid scroll-mt-6 grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3.5 border-t border-rule py-4">
              <Initials name={c.author.name} />
              <div className="min-w-0">
                <CommentBody comment={c} references={references} />
                {replies.has(c.id) && (
                  <ol aria-label={`Replies to ${c.author.name}`} className="mt-3 space-y-3.5">
                    {replies.get(c.id)!.map((r) => (
                      <li key={r.id} id={`comment-${r.id}`} className="grid scroll-mt-6 grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3">
                        <Initials name={r.author.name} small />
                        <div className="min-w-0">
                          <CommentBody comment={r} references={references} />
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
                <CommentButton on={on} replyTo={{ id: c.id, author: c.author.name }} references={references} />
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

function CommentBody({ comment: c, references }: { comment: Comment; references: CitableReferences }) {
  return (
    <>
      <p className="text-sm text-ink-subtle">
        <strong className="text-[0.95rem] text-ink">{c.author.name}</strong> · {formatDate(c.createdAt)}
      </p>
      <MarkdownContent source={c.body} untrusted references={references} className="mt-1 text-[0.98rem] [&>*:last-child]:mb-0" />
    </>
  );
}

function Initials({ name, small }: { name: string; small?: boolean }) {
  const letters = name.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <span
      aria-hidden
      className={cn(
        "flex items-center justify-center rounded-full bg-surface font-sans font-bold text-ink-muted ring-1 ring-rule-strong",
        small ? "size-7 text-[0.68rem]" : "size-9 text-[0.8rem]",
      )}
    >
      {letters}
    </span>
  );
}

/** The comment form for a problem or blog post, or a sign-in link. Reads the session. */
export async function CommentBox({ on, references }: { on: CommentTarget; references: CitableReferences }) {
  if (await getCurrentUser()) return <CommentForm on={on} references={references} />;
  return <SignInToComment page={discussionPage(on)} />;
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
