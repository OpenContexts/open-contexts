// The parts of a problem page that users add to: contributions and the discussion.
// They render data passed in by ProblemContent, which caches them; only CommentBox reads the session.
import Link from "next/link";
import type { ReactNode } from "react";
import { type CitableReferences, MarkdownContent } from "@/components/markdown/markdown";
import { contributionLook, KindTag } from "@/components/problems/kind-tag";
import { CommentForm } from "@/components/submissions/comment-form";
import { Clamped, ExpandableList, PartTitle, toneColors } from "@/components/ui";
import { AI_USE_LABELS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth/session";
import type { getApprovedComments, getApprovedContributions } from "@/lib/data/community";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

type Contribution = Awaited<ReturnType<typeof getApprovedContributions>>[number];
type Comment = Awaited<ReturnType<typeof getApprovedComments>>[number];

/** "https://www.arxiv.org/abs/2401.1234" → "arxiv.org/abs/2401.1234" */
const displayUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/**
 * Newest first. Each entry is edged in the colour of its kind, so the kinds can be told apart at a glance.
 * `references`: the problem's, which the summaries cite with \cite{key}.
 */
export function ContributionsSection({ items, references }: { items: Contribution[]; references: CitableReferences }) {
  return (
    <>
      <PartTitle>Contributions</PartTitle>
      {items.length ? (
        <ExpandableList limit={5} noun={["contribution", "contributions"]} className="space-y-6">
          {items.map((c) => {
            const look = contributionLook(c.kind);
            return (
              <li key={c.id} className={cn("border-l-[3px] py-0.5 pl-4", toneColors[look.tone].border)}>
                <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <KindTag look={look} />
                  <span className="text-sm text-ink-subtle">{formatDate(c.createdAt)}</span>
                </p>
                <h3 className="mt-1.5 text-[1.08rem] font-bold">{c.title}</h3>
                <Clamped lines={5} className="mt-1">
                  <MarkdownContent source={c.summary} untrusted references={references} className="text-[0.98rem]" />
                </Clamped>
                <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-ink-subtle">
                  <span>
                    by {c.credit} · {AI_USE_LABELS[c.aiUse]}
                  </span>
                  {c.url && (
                    <a href={c.url} rel="nofollow ugc noopener noreferrer" className="max-w-full truncate text-brand hover:underline">
                      ↗ {displayUrl(c.url)}
                    </a>
                  )}
                </p>
              </li>
            );
          })}
        </ExpandableList>
      ) : (
        <p className="text-ink-muted">No contributions recorded yet.</p>
      )}
    </>
  );
}

/** The comment box first (`commentBox`, rendered per visitor), then the comments, newest first. They cite the problem's `references`. */
export function DiscussionSection({ comments, commentBox, references }: { comments: Comment[]; commentBox: ReactNode; references: CitableReferences }) {
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
        <p className="mt-5 text-ink-muted">No comments yet. Questions about the statement and informal remarks are welcome here.</p>
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

/** The comment form, or a sign-in link. Reads the session. */
export async function CommentBox({ slug, references }: { slug: string; references: CitableReferences }) {
  if (await getCurrentUser()) return <CommentForm problemSlug={slug} references={references} />;
  return <SignInToComment slug={slug} />;
}

function SignInToComment({ slug }: { slug: string }) {
  return (
    <p className="text-[0.95rem]">
      <Link href={`/sign-in?next=${encodeURIComponent(`/problems/${slug}#discussion`)}`} className="text-brand hover:underline">
        Sign in
      </Link>{" "}
      to join the discussion.
    </p>
  );
}
