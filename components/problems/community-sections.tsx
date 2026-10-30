// The parts of a problem page that users add to: contributions, related problems and the discussion.
// They render data passed in by ProblemContent, which caches them; only CommentBox reads the session.
import Link from "next/link";
import type { ReactNode } from "react";
import { MarkdownContent } from "@/components/markdown/markdown";
import { ContributionKindTag } from "@/components/problems/kind-tag";
import { CommentForm } from "@/components/submissions/comment-form";
import { Clamped, ExpandableList, PartTitle } from "@/components/ui";
import { AI_USE_LABELS, LINK_RELATION_LABELS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth/session";
import type { getApprovedComments, getApprovedContributions, getApprovedLinks } from "@/lib/data/community";
import { formatDate } from "@/lib/format";

type Contribution = Awaited<ReturnType<typeof getApprovedContributions>>[number];
type ProblemLink = Awaited<ReturnType<typeof getApprovedLinks>>[number];
type Comment = Awaited<ReturnType<typeof getApprovedComments>>[number];

/** "https://www.arxiv.org/abs/2401.1234" → "arxiv.org/abs/2401.1234" */
const displayUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

export function ContributionsSection({ items }: { items: Contribution[] }) {
  return (
    <>
      <PartTitle count={items.length}>Contributions</PartTitle>
      {items.length ? (
        <ExpandableList limit={5} noun={["contribution", "contributions"]}>
          {items.map((c) => (
            <li key={c.id} className="border-t border-dotted border-rule-strong py-3.5 last:border-b">
              <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <ContributionKindTag kind={c.kind} className="relative -top-px" />
                <span className="font-bold">{c.title}</span>
              </p>
              <p className="mt-0.5 text-sm text-ink-subtle">
                {c.credit} · {AI_USE_LABELS[c.aiUse]} · {formatDate(c.createdAt)}
              </p>
              {c.url && (
                <p className="mt-0.5 truncate text-sm">
                  <a href={c.url} rel="nofollow ugc noopener noreferrer" className="text-brand hover:underline">
                    ↗ {displayUrl(c.url)}
                  </a>
                </p>
              )}
              <Clamped lines={5} className="mt-1.5">
                <MarkdownContent source={c.summary} untrusted className="text-[0.98rem]" />
              </Clamped>
            </li>
          ))}
        </ExpandableList>
      ) : (
        <p className="text-ink-muted">No contributions recorded yet.</p>
      )}
    </>
  );
}

/** `others` maps problem ids to their slug and label. Renders nothing without links. */
export function RelatedSection({ problemId, links, others }: { problemId: string; links: ProblemLink[]; others: Map<string, { slug: string; label: string }> }) {
  if (!links.length) return null;
  return (
    <>
      <PartTitle>Related problems</PartTitle>
      <ul className="prose-oc list-disc pl-6">
        {links.map((l) => {
          const outgoing = l.fromProblemId === problemId;
          const other = others.get((outgoing ? l.toProblemId : l.fromProblemId) ?? "");
          return (
            <li key={l.id}>
              {outgoing ? `This problem ${LINK_RELATION_LABELS[l.relation]} ` : `Linked from `}
              {other ? (
                <Link href={`/problems/${other.slug}`}>{other.label}</Link>
              ) : (
                l.url && <a href={l.url} rel="nofollow ugc noopener noreferrer">{l.label ?? l.url}</a>
              )}
              {l.note && <span className="text-ink-muted"> — {l.note}</span>}
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** The comment box first (`commentBox`, rendered per visitor), then the comments, newest first. */
export function DiscussionSection({ comments, commentBox }: { comments: Comment[]; commentBox: ReactNode }) {
  return (
    <>
      <PartTitle id="discussion" count={comments.length}>
        Discussion
      </PartTitle>
      {commentBox}
      {comments.length ? (
        <ExpandableList limit={10} noun={["older comment", "older comments"]} className="mt-6">
          {comments.map((c) => (
            <li key={c.id} className="border-t border-rule py-3 last:border-b">
              <p className="mb-1 text-sm text-ink-subtle">
                <strong className="text-ink">{c.author.name}</strong> · {formatDate(c.createdAt)}
              </p>
              <MarkdownContent source={c.body} untrusted className="text-[0.98rem]" />
            </li>
          ))}
        </ExpandableList>
      ) : (
        <p className="mt-5 text-ink-muted">No comments yet. Questions about the statement and informal remarks are welcome here.</p>
      )}
    </>
  );
}

/** The comment form, or a sign-in link. Reads the session, so render it inside <Suspense>. */
export async function CommentBox({ slug }: { slug: string }) {
  if (await getCurrentUser()) return <CommentForm problemSlug={slug} />;
  return <SignInToComment slug={slug} />;
}

/** Also the <Suspense> fallback of CommentBox: most visitors are signed out, so nothing moves for them. */
export function SignInToComment({ slug }: { slug: string }) {
  return (
    <p className="text-[0.95rem]">
      <Link href={`/sign-in?next=${encodeURIComponent(`/problems/${slug}#discussion`)}`} className="text-brand hover:underline">
        Sign in
      </Link>{" "}
      to join the discussion.
    </p>
  );
}
