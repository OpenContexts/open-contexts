// A user's own submissions, for /me. Includes pending and rejected ones.
import "server-only";
import { and, count, desc, eq, inArray, ne, sql } from "drizzle-orm";
import type { ContributionKind, ModerationStatus, SubmissionType } from "@/lib/constants";
import { db } from "@/lib/db";
import { blogPost, comment, contribution, permalink, problemProposal, problemRevision, problemVersion, submissionsSeen } from "@/lib/db/schema";
import { versionKey } from "@/lib/permalinks";

export type MySubmission = {
  type: SubmissionType;
  id: string;
  title: string;
  /** For contributions: what kind of material it is. */
  kind?: ContributionKind;
  problemId: string | null;
  /** The blog post it is (a post) or is on (a comment on a post). */
  postId: string | null;
  /** For comments: whether it replies to another comment. */
  reply?: boolean;
  status: ModerationStatus;
  reviewNote: string | null;
  createdAt: Date;
  /** When the moderators decided on it; null while pending. */
  reviewedAt: Date | null;
  /** The permanent key of an accepted contribution or post ("12.3", "blog.7"), or of the version an accepted edit started ("12v3"). */
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
  const edits = revisions.map((r) => r.id);
  const [links, versions] = await Promise.all([
    linkable.length ? db.select({ id: permalink.targetId, key: permalink.key }).from(permalink).where(inArray(permalink.targetId, linkable)) : [],
    // An accepted edit is linked by the version of the problem it started ("12v3").
    edits.length
      ? db
          .select({ id: problemVersion.revisionId, number: problemVersion.problemNumber, version: problemVersion.version })
          .from(problemVersion)
          .where(inArray(problemVersion.revisionId, edits))
      : [],
  ]);
  const keys = new Map([...links.map((l) => [l.id, l.key] as const), ...versions.flatMap((v) => (v.id ? [[v.id, versionKey(v.number, v.version)] as const] : []))]);
  const common = (r: { id: string; status: ModerationStatus; reviewNote: string | null; createdAt: Date; reviewedAt: Date | null }) => ({
    id: r.id,
    status: r.status,
    reviewNote: r.reviewNote,
    createdAt: r.createdAt,
    reviewedAt: r.status === "pending" ? null : r.reviewedAt,
    // A reopened or rejected submission keeps its key, but its page is not public then.
    key: r.status === "approved" ? keys.get(r.id) : undefined,
  });
  return [
    ...comments.map((r) => ({ ...common(r), type: "comment" as const, title: excerpt(r.body), reply: !!r.parentId, problemId: r.problemId, postId: r.postId })),
    ...contributions.map((r) => ({ ...common(r), type: "contribution" as const, title: r.title, kind: r.kind, problemId: r.problemId, postId: null })),
    ...revisions.map((r) => ({ ...common(r), type: "revision" as const, title: r.changeSummary, problemId: r.problemId, postId: null })),
    ...proposals.map((r) => ({ ...common(r), type: "proposal" as const, title: r.title, problemId: r.problemId, postId: null })),
    ...posts.map((r) => ({ ...common(r), type: "post" as const, title: r.title, problemId: null, postId: r.id })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ---------------------------------------------------------------------------------------------------------------
// Decisions the user has not seen yet: made since they last opened /me, counted in the account menu.

type Moderated = typeof comment | typeof contribution | typeof problemRevision | typeof problemProposal | typeof blogPost;

/** The user's submissions in `t` decided since they last looked (ever, if they never have). */
function decidedSince(t: Moderated, userId: string) {
  const seen = sql`coalesce((select ${submissionsSeen.seenAt} from ${submissionsSeen} where ${submissionsSeen.userId} = ${userId}), '-infinity'::timestamptz)`;
  return db
    .select({ n: count() })
    .from(t)
    .where(and(eq(t.authorId, userId), ne(t.status, "pending"), sql`${t.reviewedAt} > ${seen}`));
}

/** How many of the user's submissions were decided on since they last opened /me. One round trip. */
export async function countNewDecisions(userId: string): Promise<number> {
  const counts = await db.batch([
    decidedSince(comment, userId),
    decidedSince(contribution, userId),
    decidedSince(problemRevision, userId),
    decidedSince(problemProposal, userId),
    decidedSince(blogPost, userId),
  ]);
  return counts.reduce((sum, [row]) => sum + (row?.n ?? 0), 0);
}

/** Records that the user looked at their submissions now, and returns when they last did before (null: never). */
export async function markSubmissionsSeen(userId: string): Promise<Date | null> {
  const [before] = await db.batch([
    db.select({ seenAt: submissionsSeen.seenAt }).from(submissionsSeen).where(eq(submissionsSeen.userId, userId)),
    db.insert(submissionsSeen).values({ userId }).onConflictDoUpdate({ target: submissionsSeen.userId, set: { seenAt: sql`now()` } }),
  ]);
  return before[0]?.seenAt ?? null;
}
