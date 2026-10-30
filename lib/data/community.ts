// Public reads of user submissions. Only `approved` rows ever leave this module.
// The problem page caches what these return (see ProblemContent) under communityTag(problemId);
// moderation decisions invalidate that tag, so the queries run again only after something changed.
import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, isDbConfigured } from "@/lib/db";
import { comment, contribution } from "@/lib/db/schema";

/** Cache tag for everything users added to one problem: comments and contributions. */
export const communityTag = (problemId: string) => `community:${problemId}`;

/** Cache tag for the counts in the problem lists (getCommunityCounts). */
export const COUNTS_TAG = "community-counts";

export type CommunityCounts = Record<string, { contributions: number; comments: number }>;

/** Approved contributions and comments per problem id, for the problem lists. */
export async function getCommunityCounts(): Promise<CommunityCounts> {
  "use cache";
  cacheLife("max");
  cacheTag(COUNTS_TAG, "community");
  if (!isDbConfigured()) return {};
  const [contributions, comments] = await db.batch([
    db.select({ id: contribution.problemId, n: count() }).from(contribution).where(eq(contribution.status, "approved")).groupBy(contribution.problemId),
    db.select({ id: comment.problemId, n: count() }).from(comment).where(eq(comment.status, "approved")).groupBy(comment.problemId),
  ]);
  const counts: CommunityCounts = {};
  const entry = (id: string) => (counts[id] ??= { contributions: 0, comments: 0 });
  for (const { id, n } of contributions) entry(id).contributions = n;
  for (const { id, n } of comments) entry(id).comments = n;
  return counts;
}

/** Newest first. */
export async function getApprovedComments(problemId: string) {
  return db.query.comment.findMany({
    where: and(eq(comment.problemId, problemId), eq(comment.status, "approved")),
    with: { author: { columns: { name: true } } },
    orderBy: desc(comment.createdAt),
  });
}

export async function getApprovedContributions(problemId: string) {
  return db.query.contribution.findMany({
    where: and(eq(contribution.problemId, problemId), eq(contribution.status, "approved")),
    orderBy: desc(contribution.createdAt),
  });
}
