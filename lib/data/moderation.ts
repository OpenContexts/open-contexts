// Reads for the admin dashboard. Callers must have checked requireModerator().
import "server-only";
import { asc, count, desc, eq, sql } from "drizzle-orm";
import { connection } from "next/server";
import { type AiUse, type ContributionKind, type LogTargetType, type ModerationStatus, type SubmissionType } from "@/lib/constants";
import { getPermalinkKeys } from "@/lib/data/permalinks";
import { getProblems, problemLabel } from "@/lib/data/problems";
import { db } from "@/lib/db";
import { activityLog, blogPost, comment, contribution, problemProposal, problemRevision, type Reference } from "@/lib/db/schema";
import { permalinkPath } from "@/lib/permalinks";

export async function getPendingCounts(): Promise<Record<SubmissionType, number>> {
  await connection();
  const [[c], [k], [r], [p], [b]] = await db.batch([
    db.select({ n: count() }).from(comment).where(eq(comment.status, "pending")),
    db.select({ n: count() }).from(contribution).where(eq(contribution.status, "pending")),
    db.select({ n: count() }).from(problemRevision).where(eq(problemRevision.status, "pending")),
    db.select({ n: count() }).from(problemProposal).where(eq(problemProposal.status, "pending")),
    db.select({ n: count() }).from(blogPost).where(eq(blogPost.status, "pending")),
  ]);
  return { comment: c.n, contribution: k.n, revision: r.n, proposal: p.n, post: b.n };
}

// id, role and banned let an admin block the author from the review page.
const author = { columns: { id: true, name: true, email: true, role: true, banned: true } } as const;
type Author = { id: string | null; name: string; email: string; role: string | null; banned: boolean | null };
/** Edits, proposals and blog posts outlive their author's account (author_id is set to null). */
const DELETED_AUTHOR: Author = { id: null, name: "Deleted account", email: "—", role: null, banned: null };

/** Full rows with their author, per submission type. */
async function findMany(type: SubmissionType, status: ModerationStatus, limit: number) {
  // Pending work is handled oldest first; decided items are browsed newest first.
  const order = status === "pending" ? asc : desc;
  switch (type) {
    case "comment":
      return {
        type,
        rows: await db.query.comment.findMany({ where: eq(comment.status, status), with: { author, contribution: { columns: { title: true } } }, orderBy: order(comment.createdAt), limit }),
      };
    case "contribution":
      return { type, rows: await db.query.contribution.findMany({ where: eq(contribution.status, status), with: { author }, orderBy: order(contribution.createdAt), limit }) };
    case "revision":
      return { type, rows: await db.query.problemRevision.findMany({ where: eq(problemRevision.status, status), with: { author }, orderBy: order(problemRevision.createdAt), limit }) };
    case "proposal":
      return { type, rows: await db.query.problemProposal.findMany({ where: eq(problemProposal.status, status), with: { author }, orderBy: order(problemProposal.createdAt), limit }) };
    case "post":
      return { type, rows: await db.query.blogPost.findMany({ where: eq(blogPost.status, status), with: { author }, orderBy: order(blogPost.createdAt), limit }) };
    default:
      throw new Error(`Unknown submission type: ${type satisfies never}`);
  }
}

/** Every blog post with what comments on it need: its title, its page once published, and the references they cite. */
async function postTargets() {
  const rows = await db.select({ id: blogPost.id, title: blogPost.title, slug: blogPost.slug, status: blogPost.status, references: blogPost.references }).from(blogPost);
  return new Map(rows.map((r) => [r.id, r]));
}

export type QueueItem = {
  id: string;
  title: string;
  excerpt?: string;
  /** Full markdown text, for deciding straight from the list. */
  body?: string;
  /** Contributions: what kind of material, how much AI was used, and who is credited. */
  kind?: ContributionKind;
  aiUse?: AiUse;
  credit?: string;
  url?: string;
  /** What it belongs to, e.g. "Problem 2: Black hole information", with its public page if it has one. Null for new problems and posts, and when the problem is gone. */
  on: { label: string; href?: string } | null;
  /** What its text cites with \cite{key}: the references of its problem or post. */
  references?: Reference[];
  author: { name: string; email: string };
  createdAt: Date;
};

const excerpt = (s: string, n = 140) => {
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length > n ? `${flat.slice(0, n).trimEnd()}…` : flat;
};

/** One list shape for every type, for the queue lists. */
export async function listSubmissions(type: SubmissionType, status: ModerationStatus, limit = 100): Promise<QueueItem[]> {
  await connection();
  const [result, problems, posts] = await Promise.all([findMany(type, status, limit), getProblems(), type === "comment" ? postTargets() : undefined]);
  const byId = new Map(problems.map((p) => [p.id, p]));
  const problem = (id: string | null) => {
    const p = id ? byId.get(id) : undefined;
    return { on: p ? { label: problemLabel(p), href: `/problems/${p.slug}` } : null, references: p?.references };
  };
  const post = (id: string) => {
    const p = posts?.get(id);
    return { on: p ? { label: `Blog post: ${p.title}`, href: p.status === "approved" && p.slug ? `/blog/${p.slug}` : undefined } : null, references: p?.references };
  };

  switch (result.type) {
    case "comment": {
      // Comments on a contribution are shown with it, under its permanent link.
      const keys = await getPermalinkKeys("contribution", result.rows.flatMap((r) => (r.contributionId ? [r.contributionId] : [])));
      const onContribution = (r: (typeof result.rows)[number]) => {
        const { on, references } = problem(r.problemId);
        const key = r.contributionId && keys.get(r.contributionId);
        return { on: on && r.contribution ? { label: `${on.label}, on “${r.contribution.title}”`, href: key ? permalinkPath(key) : on.href } : on, references };
      };
      return result.rows.map((r) => ({
        id: r.id,
        title: r.parentId ? "Reply" : "Comment",
        excerpt: excerpt(r.body),
        body: r.body,
        ...(r.postId ? post(r.postId) : onContribution(r)),
        author: r.author,
        createdAt: r.createdAt,
      }));
    }
    case "contribution":
      return result.rows.map((r) => ({
        id: r.id,
        title: r.title,
        excerpt: excerpt(r.summary),
        body: r.summary,
        kind: r.kind,
        aiUse: r.aiUse,
        credit: r.credit,
        url: r.url ?? undefined,
        ...problem(r.problemId),
        author: r.author,
        createdAt: r.createdAt,
      }));
    case "revision":
      return result.rows.map((r) => ({ id: r.id, title: r.changeSummary, excerpt: r.title, ...problem(r.problemId), author: r.author ?? DELETED_AUTHOR, createdAt: r.createdAt }));
    case "proposal":
      return result.rows.map((r) => ({ id: r.id, title: r.title, excerpt: excerpt(r.statement), ...problem(r.problemId), author: r.author ?? DELETED_AUTHOR, createdAt: r.createdAt }));
    case "post":
      return result.rows.map((r) => ({
        id: r.id,
        title: r.title,
        excerpt: excerpt(r.body),
        on: r.status === "approved" && r.slug ? { label: "Blog post", href: `/blog/${r.slug}` } : null,
        author: r.author ?? DELETED_AUTHOR,
        createdAt: r.createdAt,
      }));
  }
}

/** One submission with everything the review page needs. */
export async function getSubmission(type: SubmissionType, id: string) {
  await connection();
  switch (type) {
    case "comment": {
      // A reply is reviewed with the comment it answers; a comment on a contribution, with that contribution.
      const row = await db.query.comment.findFirst({
        where: eq(comment.id, id),
        with: {
          author,
          parent: { columns: { body: true, status: true }, with: { author: { columns: { name: true } } } },
          contribution: { columns: { id: true, title: true, status: true } },
        },
      });
      return row && { type, row };
    }
    case "contribution": {
      const row = await db.query.contribution.findFirst({ where: eq(contribution.id, id), with: { author } });
      return row && { type, row };
    }
    case "revision": {
      const row = await db.query.problemRevision.findFirst({ where: eq(problemRevision.id, id), with: { author } });
      return row && { type, row: { ...row, author: row.author ?? DELETED_AUTHOR } };
    }
    case "proposal": {
      const row = await db.query.problemProposal.findFirst({ where: eq(problemProposal.id, id), with: { author } });
      return row && { type, row: { ...row, author: row.author ?? DELETED_AUTHOR } };
    }
    case "post": {
      const row = await db.query.blogPost.findFirst({ where: eq(blogPost.id, id), with: { author } });
      return row && { type, row: { ...row, author: row.author ?? DELETED_AUTHOR } };
    }
  }
}

/** A blog post in any state, for the dashboard (e.g. the post a comment belongs to). */
export async function getPostRow(id: string) {
  await connection();
  return db.query.blogPost.findFirst({ where: eq(blogPost.id, id) });
}

export type Submission = NonNullable<Awaited<ReturnType<typeof getSubmission>>>;

/** Newest first: decisions on submissions and changes to problems. */
export async function getRecentActivity(limit = 50) {
  await connection();
  return db.query.activityLog.findMany({
    with: { moderator: { columns: { name: true } } },
    orderBy: desc(activityLog.createdAt),
    limit,
  });
}

/** Where an activity-log entry points to in the dashboard. */
export const logTargetHref = (type: LogTargetType, id: string) => (type === "problem" ? `/admin/problems/${id}` : `/admin/review/${type}/${id}`);

export async function getActivityFor(type: LogTargetType, id: string) {
  await connection();
  return db.query.activityLog.findMany({
    where: (log, { and }) => and(eq(log.targetType, type), eq(log.targetId, id)),
    with: { moderator: { columns: { name: true } } },
    orderBy: desc(activityLog.createdAt),
  });
}

export type ProblemActivity = { comments: number; contributions: number; edits: number; pending: number };

/** Per problem: how much is attached to it (what deleting it would remove), and how much awaits review. */
export async function getProblemActivity(): Promise<Map<string, ProblemActivity>> {
  await connection();
  const pending = sql<number>`count(*) filter (where status = 'pending')::int`;
  const [comments, contributions, edits] = await db.batch([
    db.select({ id: comment.problemId, n: count(), pending }).from(comment).groupBy(comment.problemId),
    db.select({ id: contribution.problemId, n: count(), pending }).from(contribution).groupBy(contribution.problemId),
    db.select({ id: problemRevision.problemId, n: count(), pending }).from(problemRevision).groupBy(problemRevision.problemId),
  ]);
  const activity = new Map<string, ProblemActivity>();
  const add = (rows: { id: string | null; n: number; pending: number }[], key: Exclude<keyof ProblemActivity, "pending">) => {
    for (const { id, n, pending } of rows) {
      if (!id) continue;
      const a = activity.get(id) ?? { comments: 0, contributions: 0, edits: 0, pending: 0 };
      a[key] += n;
      a.pending += Number(pending);
      activity.set(id, a);
    }
  };
  add(comments, "comments");
  add(contributions, "contributions");
  add(edits, "edits");
  return activity;
}
