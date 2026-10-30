// Reads for the admin dashboard. Callers must have checked requireModerator().
import "server-only";
import { asc, count, desc, eq, sql } from "drizzle-orm";
import { connection } from "next/server";
import { AI_USE_LABELS, CONTRIBUTION_KIND_LABELS, LINK_RELATION_LABELS, type LogTargetType, type ModerationStatus, type SubmissionType } from "@/lib/constants";
import { getProblems, problemLabel } from "@/lib/data/problems";
import { db } from "@/lib/db";
import { comment, contribution, moderationLog, problemLink, problemProposal, problemRevision } from "@/lib/db/schema";

export async function getPendingCounts(): Promise<Record<SubmissionType, number>> {
  await connection();
  const [[c], [k], [l], [r], [p]] = await db.batch([
    db.select({ n: count() }).from(comment).where(eq(comment.status, "pending")),
    db.select({ n: count() }).from(contribution).where(eq(contribution.status, "pending")),
    db.select({ n: count() }).from(problemLink).where(eq(problemLink.status, "pending")),
    db.select({ n: count() }).from(problemRevision).where(eq(problemRevision.status, "pending")),
    db.select({ n: count() }).from(problemProposal).where(eq(problemProposal.status, "pending")),
  ]);
  return { comment: c.n, contribution: k.n, link: l.n, revision: r.n, proposal: p.n };
}

const author = { columns: { name: true, email: true } } as const;
/** Edits and proposals outlive their author's account (author_id is set to null). */
const DELETED_AUTHOR = { name: "Deleted account", email: "—" };

/** Full rows with their author, per submission type. */
async function findMany(type: SubmissionType, status: ModerationStatus, limit: number) {
  // Pending work is handled oldest first; decided items are browsed newest first.
  const order = status === "pending" ? asc : desc;
  switch (type) {
    case "comment":
      return { type, rows: await db.query.comment.findMany({ where: eq(comment.status, status), with: { author }, orderBy: order(comment.createdAt), limit }) };
    case "contribution":
      return { type, rows: await db.query.contribution.findMany({ where: eq(contribution.status, status), with: { author }, orderBy: order(contribution.createdAt), limit }) };
    case "link":
      return { type, rows: await db.query.problemLink.findMany({ where: eq(problemLink.status, status), with: { proposedBy: author }, orderBy: order(problemLink.createdAt), limit }) };
    case "revision":
      return { type, rows: await db.query.problemRevision.findMany({ where: eq(problemRevision.status, status), with: { author }, orderBy: order(problemRevision.createdAt), limit }) };
    case "proposal":
      return { type, rows: await db.query.problemProposal.findMany({ where: eq(problemProposal.status, status), with: { author }, orderBy: order(problemProposal.createdAt), limit }) };
  }
}

export type QueueItem = {
  id: string;
  title: string;
  excerpt?: string;
  /** Full markdown text, for deciding straight from the list. */
  body?: string;
  details?: string[];
  url?: string;
  problemId: string | null;
  /** "Problem 2: Black hole information". */
  problemLabel: string | null;
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
  const [result, problems] = await Promise.all([findMany(type, status, limit), getProblems()]);
  const byId = new Map(problems.map((p) => [p.id, p]));
  const shortTitle = (id: string | null) => (id && byId.get(id)?.title) ?? "a deleted problem";
  const problem = (id: string | null) => ({ problemId: id, problemLabel: id && byId.has(id) ? problemLabel(byId.get(id)!) : null });

  switch (result.type) {
    case "comment":
      return result.rows.map((r) => ({
        id: r.id,
        title: `On ${problem(r.problemId).problemLabel ?? "a deleted problem"}`,
        excerpt: excerpt(r.body),
        body: r.body,
        ...problem(r.problemId),
        author: r.author,
        createdAt: r.createdAt,
      }));
    case "contribution":
      return result.rows.map((r) => ({
        id: r.id,
        title: r.title,
        excerpt: excerpt(r.summary),
        body: r.summary,
        details: [CONTRIBUTION_KIND_LABELS[r.kind], AI_USE_LABELS[r.aiUse], `credit: ${r.credit}`],
        url: r.url ?? undefined,
        ...problem(r.problemId),
        author: r.author,
        createdAt: r.createdAt,
      }));
    case "link":
      return result.rows.map((r) => {
        const target = r.toProblemId ? shortTitle(r.toProblemId) : (r.label ?? r.url ?? "");
        return {
          id: r.id,
          title: `${shortTitle(r.fromProblemId)} ${LINK_RELATION_LABELS[r.relation]} ${target}`,
          excerpt: r.note ?? undefined,
          body: r.note ?? undefined,
          url: r.url ?? undefined,
          ...problem(r.fromProblemId),
          author: r.proposedBy,
          createdAt: r.createdAt,
        };
      });
    case "revision":
      return result.rows.map((r) => ({ id: r.id, title: r.changeSummary, excerpt: r.title, ...problem(r.problemId), author: r.author ?? DELETED_AUTHOR, createdAt: r.createdAt }));
    case "proposal":
      return result.rows.map((r) => ({ id: r.id, title: r.title, excerpt: excerpt(r.statement), ...problem(r.problemId), author: r.author ?? DELETED_AUTHOR, createdAt: r.createdAt }));
  }
}

/** One submission with everything the review page needs. */
export async function getSubmission(type: SubmissionType, id: string) {
  await connection();
  switch (type) {
    case "comment": {
      const row = await db.query.comment.findFirst({ where: eq(comment.id, id), with: { author } });
      return row && { type, row };
    }
    case "contribution": {
      const row = await db.query.contribution.findFirst({ where: eq(contribution.id, id), with: { author } });
      return row && { type, row };
    }
    case "link": {
      const row = await db.query.problemLink.findFirst({ where: eq(problemLink.id, id), with: { proposedBy: author } });
      return row && { type, row: { ...row, author: row.proposedBy } };
    }
    case "revision": {
      const row = await db.query.problemRevision.findFirst({ where: eq(problemRevision.id, id), with: { author } });
      return row && { type, row: { ...row, author: row.author ?? DELETED_AUTHOR } };
    }
    case "proposal": {
      const row = await db.query.problemProposal.findFirst({ where: eq(problemProposal.id, id), with: { author } });
      return row && { type, row: { ...row, author: row.author ?? DELETED_AUTHOR } };
    }
  }
}

export type Submission = NonNullable<Awaited<ReturnType<typeof getSubmission>>>;

export async function getRecentDecisions(limit = 50) {
  await connection();
  return db.query.moderationLog.findMany({
    with: { moderator: { columns: { name: true } } },
    orderBy: desc(moderationLog.createdAt),
    limit,
  });
}

/** Where an activity-log entry points to in the dashboard. */
export const logTargetHref = (type: LogTargetType, id: string) => (type === "problem" ? `/admin/problems/${id}` : `/admin/review/${type}/${id}`);

export async function getDecisionsFor(type: LogTargetType, id: string) {
  await connection();
  return db.query.moderationLog.findMany({
    where: (log, { and }) => and(eq(log.targetType, type), eq(log.targetId, id)),
    with: { moderator: { columns: { name: true } } },
    orderBy: desc(moderationLog.createdAt),
  });
}

export type ProblemActivity = { comments: number; contributions: number; links: number; edits: number; pending: number };

/** Per problem: how much is attached to it (what deleting it would remove), and how much awaits review. */
export async function getProblemActivity(): Promise<Map<string, ProblemActivity>> {
  await connection();
  const pending = sql<number>`count(*) filter (where status = 'pending')::int`;
  const [comments, contributions, linksFrom, linksTo, edits] = await db.batch([
    db.select({ id: comment.problemId, n: count(), pending }).from(comment).groupBy(comment.problemId),
    db.select({ id: contribution.problemId, n: count(), pending }).from(contribution).groupBy(contribution.problemId),
    db.select({ id: problemLink.fromProblemId, n: count(), pending }).from(problemLink).groupBy(problemLink.fromProblemId),
    db.select({ id: problemLink.toProblemId, n: count(), pending: sql<number>`0` }).from(problemLink).groupBy(problemLink.toProblemId),
    db.select({ id: problemRevision.problemId, n: count(), pending }).from(problemRevision).groupBy(problemRevision.problemId),
  ]);
  const activity = new Map<string, ProblemActivity>();
  const add = (rows: { id: string | null; n: number; pending: number }[], key: Exclude<keyof ProblemActivity, "pending">) => {
    for (const { id, n, pending } of rows) {
      if (!id) continue;
      const a = activity.get(id) ?? { comments: 0, contributions: 0, links: 0, edits: 0, pending: 0 };
      a[key] += n;
      a.pending += Number(pending);
      activity.set(id, a);
    }
  };
  add(comments, "comments");
  add(contributions, "contributions");
  add(linksFrom, "links");
  add(linksTo, "links");
  add(edits, "edits");
  return activity;
}
