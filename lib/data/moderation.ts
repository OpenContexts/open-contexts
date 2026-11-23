// Reads for the admin dashboard. Callers must have checked requireModerator().
import "server-only";
import { and, asc, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { connection } from "next/server";
import { type ContributionKind, type LogTargetType, type ModerationStatus, type SubmissionType } from "@/lib/constants";
import { getPermalinkKeys } from "@/lib/data/permalinks";
import { getProblems, problemLabel } from "@/lib/data/problems";
import { db } from "@/lib/db";
import { activityLog, blogPost, comment, contribution, problemProposal, problemRevision, type Reference } from "@/lib/db/schema";
import { permalinkPath } from "@/lib/permalinks";

/** Contributions with this status; those waiting for review only while their author has not withdrawn them. */
const waitingContributions = (status: ModerationStatus) => (status === "pending" ? and(eq(contribution.status, status), isNull(contribution.withdrawnAt)) : eq(contribution.status, status));

export async function getPendingCounts(): Promise<Record<SubmissionType, number>> {
  await connection();
  const [[c], [k], [r], [p], [b]] = await db.batch([
    db.select({ n: count() }).from(comment).where(eq(comment.status, "pending")),
    db.select({ n: count() }).from(contribution).where(waitingContributions("pending")),
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

/** Submissions per page in the queue lists. */
export const QUEUE_PER_PAGE = 25;

/** The submissions of one type with this status, in the order the queue lists them. */
function whereStatus(type: SubmissionType, status: ModerationStatus) {
  switch (type) {
    case "comment":
      return eq(comment.status, status);
    case "contribution":
      return waitingContributions(status);
    case "revision":
      return eq(problemRevision.status, status);
    case "proposal":
      return eq(problemProposal.status, status);
    case "post":
      return eq(blogPost.status, status);
  }
}

const TABLES = { comment, contribution, revision: problemRevision, proposal: problemProposal, post: blogPost } as const;

/**
 * One page of rows with their author, per submission type: only the columns the lists show. Contributions are
 * listed by title, kind and problem; their text is read on the review page.
 */
async function findPage(type: SubmissionType, status: ModerationStatus, page: number) {
  // Pending work is handled oldest first; decided items are browsed newest first.
  const order = status === "pending" ? asc : desc;
  const where = whereStatus(type, status);
  const window = { limit: QUEUE_PER_PAGE, offset: (page - 1) * QUEUE_PER_PAGE };
  const name = { columns: { name: true, email: true } } as const;
  switch (type) {
    case "comment":
      return {
        type,
        rows: await db.query.comment.findMany({
          where,
          columns: { id: true, body: true, parentId: true, problemId: true, postId: true, contributionId: true, createdAt: true },
          with: { author: name, contribution: { columns: { title: true } } },
          orderBy: [order(comment.createdAt), order(comment.id)],
          ...window,
        }),
      };
    case "contribution":
      return {
        type,
        rows: await db.query.contribution.findMany({
          where,
          columns: { id: true, title: true, kind: true, problemId: true, createdAt: true },
          with: { author: name },
          orderBy: [order(contribution.createdAt), order(contribution.id)],
          ...window,
        }),
      };
    case "revision":
      return {
        type,
        rows: await db.query.problemRevision.findMany({
          where,
          columns: { id: true, changeSummary: true, title: true, problemId: true, createdAt: true },
          with: { author: name },
          orderBy: [order(problemRevision.createdAt), order(problemRevision.id)],
          ...window,
        }),
      };
    case "proposal":
      return {
        type,
        rows: await db.query.problemProposal.findMany({
          where,
          columns: { id: true, title: true, statement: true, problemId: true, createdAt: true },
          with: { author: name },
          orderBy: [order(problemProposal.createdAt), order(problemProposal.id)],
          ...window,
        }),
      };
    case "post":
      return {
        type,
        rows: await db.query.blogPost.findMany({
          where,
          columns: { id: true, title: true, body: true, slug: true, status: true, createdAt: true },
          with: { author: name },
          orderBy: [order(blogPost.createdAt), order(blogPost.id)],
          ...window,
        }),
      };
    default:
      throw new Error(`Unknown submission type: ${type satisfies never}`);
  }
}

/** Every blog post with what comments on it need: its title, its page once published, and the references they cite. */
async function postTargets(ids: string[]) {
  if (!ids.length) return new Map();
  const rows = await db
    .select({ id: blogPost.id, title: blogPost.title, slug: blogPost.slug, status: blogPost.status, references: blogPost.references })
    .from(blogPost)
    .where(inArray(blogPost.id, ids));
  return new Map(rows.map((r) => [r.id, r]));
}

export type QueueItem = {
  id: string;
  title: string;
  excerpt?: string;
  /** Comments: the full markdown text, to decide on straight from the list. */
  body?: string;
  /** Comments: whether it answers another comment. */
  reply?: boolean;
  /** Contributions: what kind of material. */
  kind?: ContributionKind;
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

/** One page of the queue list for a type, in one shape for every type, with how many there are in all. */
export async function listSubmissions(type: SubmissionType, status: ModerationStatus, page = 1): Promise<{ items: QueueItem[]; total: number; pages: number }> {
  await connection();
  const [result, [{ total }], problems] = await Promise.all([
    findPage(type, status, page),
    db.select({ total: count() }).from(TABLES[type]).where(whereStatus(type, status)),
    getProblems(),
  ]);
  const byId = new Map(problems.map((p) => [p.id, p]));
  const problem = (id: string | null) => {
    const p = id ? byId.get(id) : undefined;
    return { on: p ? { label: problemLabel(p), href: `/problems/${p.slug}` } : null, references: p?.references };
  };
  const items = await toItems(result, problem);
  return { items, total, pages: Math.max(1, Math.ceil(total / QUEUE_PER_PAGE)) };
}

async function toItems(
  result: Awaited<ReturnType<typeof findPage>>,
  problem: (id: string | null) => Pick<QueueItem, "on" | "references">,
): Promise<QueueItem[]> {
  const author = (a: { name: string; email: string } | null) => a ?? DELETED_AUTHOR;
  switch (result.type) {
    case "comment": {
      const [keys, posts] = await Promise.all([
        getPermalinkKeys("contribution", result.rows.flatMap((r) => (r.contributionId ? [r.contributionId] : []))),
        postTargets(result.rows.flatMap((r) => (r.postId ? [r.postId] : []))),
      ]);
      const onPost = (id: string) => {
        const p = posts.get(id);
        return { on: p ? { label: `Blog post: ${p.title}`, href: p.status === "approved" && p.slug ? `/blog/${p.slug}` : undefined } : null, references: p?.references };
      };
      // Comments on a contribution are shown with it, under its permanent link.
      const onContribution = (r: (typeof result.rows)[number]) => {
        const { on, references } = problem(r.problemId);
        const key = r.contributionId && keys.get(r.contributionId);
        return { on: on && r.contribution ? { label: `${on.label}, on “${r.contribution.title}”`, href: key ? permalinkPath(key) : on.href } : on, references };
      };
      return result.rows.map((r) => ({
        id: r.id,
        title: r.parentId ? "Reply" : "Comment",
        body: r.body,
        reply: !!r.parentId,
        ...(r.postId ? onPost(r.postId) : onContribution(r)),
        author: r.author,
        createdAt: r.createdAt,
      }));
    }
    case "contribution":
      return result.rows.map((r) => ({ id: r.id, title: r.title, kind: r.kind, on: problem(r.problemId).on, author: r.author, createdAt: r.createdAt }));
    case "revision":
      return result.rows.map((r) => ({ id: r.id, title: r.changeSummary, excerpt: r.title, on: problem(r.problemId).on, author: author(r.author), createdAt: r.createdAt }));
    case "proposal":
      return result.rows.map((r) => ({ id: r.id, title: r.title, excerpt: excerpt(r.statement), on: problem(r.problemId).on, author: author(r.author), createdAt: r.createdAt }));
    case "post":
      return result.rows.map((r) => ({
        id: r.id,
        title: r.title,
        excerpt: excerpt(r.body),
        on: r.status === "approved" && r.slug ? { label: "Blog post", href: `/blog/${r.slug}` } : null,
        author: author(r.author),
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
      // A verification or challenge is reviewed with the result it is about.
      const row = await db.query.contribution.findFirst({
        where: eq(contribution.id, id),
        with: { author, target: { columns: { id: true, kind: true, title: true, status: true, withdrawnAt: true } } },
      });
      const targetKey = row?.target && (await getPermalinkKeys("contribution", [row.target.id])).get(row.target.id);
      return row && { type, row: { ...row, targetKey } };
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

/** Entries per page in the activity log. */
export const ACTIVITY_PER_PAGE = 50;

/** One page of the activity log, newest first, with how many entries there are in all. */
export async function getActivityPage(page: number) {
  await connection();
  const [rows, [{ total }]] = await Promise.all([
    db.query.activityLog.findMany({
      with: { moderator: { columns: { name: true } } },
      orderBy: [desc(activityLog.createdAt), desc(activityLog.id)],
      limit: ACTIVITY_PER_PAGE,
      offset: (page - 1) * ACTIVITY_PER_PAGE,
    }),
    db.select({ total: count() }).from(activityLog),
  ]);
  return { rows, total, pages: Math.max(1, Math.ceil(total / ACTIVITY_PER_PAGE)) };
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
    db
      .select({ id: contribution.problemId, n: count(), pending: sql<number>`count(*) filter (where status = 'pending' and withdrawn_at is null)::int` })
      .from(contribution)
      .groupBy(contribution.problemId),
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
