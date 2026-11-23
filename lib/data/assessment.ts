// Where the case study stands against the targets of its one-year assessment (companion paper; /progress):
// how many researchers contributed, from how many institutions, and how many problems on the list got a
// submission or comment. Counts of accepted submissions only, and of accounts that are not blocked.
import "server-only";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { institutionOf } from "@/lib/auth/institutional";
import { BLOG_TAG } from "@/lib/data/blog";
import { COUNTS_TAG } from "@/lib/data/community";
import { db, isDbConfigured } from "@/lib/db";
import { blogPost, comment, contribution, problemProposal, problemRevision, user } from "@/lib/db/schema";

export type AssessmentFigures = {
  /** Accounts with at least one accepted comment, result, edit, proposal or blog post. */
  researchers: number;
  /** The institutions of their email addresses (institutionOf); those without one are not counted. */
  institutions: number;
  /** Problems on the list with an accepted result, edit or comment, of `problems`. */
  active: number;
  problems: number;
};

/** The figures for the problems on the list (`problemIds`); recomputed hourly and after moderation decisions. */
export async function getAssessmentFigures(problemIds: string[]): Promise<AssessmentFigures> {
  "use cache";
  cacheLife("hours");
  cacheTag(COUNTS_TAG, "problems", BLOG_TAG);
  const figures = { researchers: 0, institutions: 0, active: 0, problems: problemIds.length };
  if (!isDbConfigured()) return figures;

  const [comments, contributions, revisions, proposals, posts] = await db.batch([
    db.selectDistinct({ author: comment.authorId, problem: comment.problemId }).from(comment).where(eq(comment.status, "approved")),
    db.selectDistinct({ author: contribution.authorId, problem: contribution.problemId }).from(contribution).where(eq(contribution.status, "approved")),
    db.selectDistinct({ author: problemRevision.authorId, problem: problemRevision.problemId }).from(problemRevision).where(eq(problemRevision.status, "approved")),
    db.selectDistinct({ author: problemProposal.authorId }).from(problemProposal).where(eq(problemProposal.status, "approved")),
    db.selectDistinct({ author: blogPost.authorId }).from(blogPost).where(eq(blogPost.status, "approved")),
  ]);

  const authors = [...new Set([...comments, ...contributions, ...revisions, ...proposals, ...posts].flatMap((r) => (r.author ? [r.author] : [])))];
  const people = authors.length
    ? await db
        .select({ email: user.email })
        .from(user)
        .where(and(inArray(user.id, authors), or(isNull(user.banned), eq(user.banned, false))))
    : [];
  const listed = new Set(problemIds);
  const active = new Set([...comments, ...contributions, ...revisions].flatMap((r) => (r.problem && listed.has(r.problem) ? [r.problem] : [])));
  return {
    ...figures,
    researchers: people.length,
    institutions: new Set(people.flatMap((p) => institutionOf(p.email) ?? [])).size,
    active: active.size,
  };
}
