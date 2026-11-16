// A user's own submissions, for /me. Includes pending and rejected ones.
import "server-only";
import { desc, eq, inArray } from "drizzle-orm";
import type { ContributionKind, ModerationStatus, SubmissionType } from "@/lib/constants";
import { db } from "@/lib/db";
import { blogPost, comment, contribution, permalink, problemProposal, problemRevision } from "@/lib/db/schema";

export type MySubmission = {
  type: SubmissionType;
  id: string;
  title: string;
  /** For contributions: what kind of material it is. */
  kind?: ContributionKind;
  problemId: string | null;
  /** The blog post it is (a post) or is on (a comment on a post). */
  postId: string | null;
  status: ModerationStatus;
  reviewNote: string | null;
  createdAt: Date;
  /** The permanent key of an accepted contribution or post ("12.3", "blog.7"), if it has one. */
  key?: string;
};

const excerpt = (s: string, n = 90) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s);

export async function getMySubmissions(userId: string): Promise<MySubmission[]> {
  const [comments, contributions, revisions, proposals, posts] = await db.batch([
    db.select().from(comment).where(eq(comment.authorId, userId)).orderBy(desc(comment.createdAt)),
    db.select().from(contribution).where(eq(contribution.authorId, userId)).orderBy(desc(contribution.createdAt)),
    db.select().from(problemRevision).where(eq(problemRevision.authorId, userId)).orderBy(desc(problemRevision.createdAt)),
    db.select().from(problemProposal).where(eq(problemProposal.authorId, userId)).orderBy(desc(problemProposal.createdAt)),
    db.select().from(blogPost).where(eq(blogPost.authorId, userId)).orderBy(desc(blogPost.createdAt)),
  ]);
  const linkable = [...contributions, ...posts].map((r) => r.id);
  const links = linkable.length ? await db.select({ id: permalink.targetId, key: permalink.key }).from(permalink).where(inArray(permalink.targetId, linkable)) : [];
  const keys = new Map(links.map((l) => [l.id, l.key]));
  const common = (r: { id: string; status: ModerationStatus; reviewNote: string | null; createdAt: Date }) => ({
    id: r.id,
    status: r.status,
    reviewNote: r.reviewNote,
    createdAt: r.createdAt,
    // A reopened or rejected submission keeps its key, but its page is not public then.
    key: r.status === "approved" ? keys.get(r.id) : undefined,
  });
  return [
    ...comments.map((r) => ({ ...common(r), type: "comment" as const, title: excerpt(r.body), problemId: r.problemId, postId: r.postId })),
    ...contributions.map((r) => ({ ...common(r), type: "contribution" as const, title: r.title, kind: r.kind, problemId: r.problemId, postId: null })),
    ...revisions.map((r) => ({ ...common(r), type: "revision" as const, title: r.changeSummary, problemId: r.problemId, postId: null })),
    ...proposals.map((r) => ({ ...common(r), type: "proposal" as const, title: r.title, problemId: r.problemId, postId: null })),
    ...posts.map((r) => ({ ...common(r), type: "post" as const, title: r.title, problemId: null, postId: r.id })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
