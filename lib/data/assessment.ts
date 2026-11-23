// Where the case study stands against the targets of its one-year assessment (companion paper; /progress):
// how many researchers contributed, from how many institutions, and how many problems on the list got a
// submission or comment. Counts of accepted submissions only, and of accounts that are not blocked.
import "server-only";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { institutionOf } from "@/lib/auth/institutional";
import { countryOf } from "@/lib/geo/countries";
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
  /** By country (ISO 3166 alpha-2, countryOf): how many of the researchers, from how many institutions. */
  countries: Record<string, { researchers: number; institutions: number }>;
  /** Researchers whose address names no country, so are not on the map. */
  unplaced: number;
};

/** The figures for the problems on the list (`problemIds`); recomputed hourly and after moderation decisions. */
export async function getAssessmentFigures(problemIds: string[]): Promise<AssessmentFigures> {
  "use cache";
  cacheLife("hours");
  cacheTag(COUNTS_TAG, "problems", BLOG_TAG);
  const figures = { researchers: 0, institutions: 0, active: 0, problems: problemIds.length, countries: {}, unplaced: 0 };
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
  // Each researcher in the country of their address's institution, each institution counted once there.
  const institutions = people.map((p) => institutionOf(p.email));
  const countries: AssessmentFigures["countries"] = {};
  const seen = new Set<string>();
  let unplaced = 0;
  for (const institution of institutions) {
    const country = institution && countryOf(institution);
    if (!country) {
      unplaced++;
      continue;
    }
    const entry = (countries[country] ??= { researchers: 0, institutions: 0 });
    entry.researchers++;
    if (!seen.has(institution)) entry.institutions++;
    seen.add(institution);
  }
  const active = new Set([...comments, ...contributions, ...revisions].flatMap((r) => (r.problem && listed.has(r.problem) ? [r.problem] : [])));
  return {
    ...figures,
    researchers: people.length,
    institutions: new Set(institutions.filter((i) => i !== undefined)).size,
    active: active.size,
    countries,
    unplaced,
  };
}
