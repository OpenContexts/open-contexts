// Public reads of user submissions. Only `approved` rows ever leave this module.
// The problem and blog post pages cache what these return (see ProblemContent) under communityTag(id);
// moderation decisions invalidate that tag, so the queries run again only after something changed.
import "server-only";
import { and, count, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, isDbConfigured } from "@/lib/db";
import { comment, contribution, permalink } from "@/lib/db/schema";

/** Cache tag for everything users added to one problem (comments and contributions) or blog post (comments). */
export const communityTag = (id: string) => `community:${id}`;

/** Cache tag for the counts in the problem and blog lists (getCommunityCounts). */
export const COUNTS_TAG = "community-counts";

export type CommunityCounts = Record<string, { contributions: number; comments: number }>;

/** Approved contributions and comments per problem id and per blog post id, for the lists. */
export async function getCommunityCounts(): Promise<CommunityCounts> {
  "use cache";
  cacheLife("max");
  cacheTag(COUNTS_TAG, "community");
  if (!isDbConfigured()) return {};
  const [contributions, problemComments, postComments] = await db.batch([
    db.select({ id: contribution.problemId, n: count() }).from(contribution).where(eq(contribution.status, "approved")).groupBy(contribution.problemId),
    db.select({ id: comment.problemId, n: count() }).from(comment).where(and(eq(comment.status, "approved"), isNotNull(comment.problemId))).groupBy(comment.problemId),
    db.select({ id: comment.postId, n: count() }).from(comment).where(and(eq(comment.status, "approved"), isNotNull(comment.postId))).groupBy(comment.postId),
  ]);
  const counts: CommunityCounts = {};
  const entry = (id: string) => (counts[id] ??= { contributions: 0, comments: 0 });
  for (const { id, n } of contributions) entry(id).contributions = n;
  for (const { id, n } of [...problemComments, ...postComments]) if (id) entry(id).comments = n;
  return counts;
}

/** The comments on a problem or on a blog post, newest first. */
export async function getApprovedComments(on: "problem" | "post", id: string) {
  return db.query.comment.findMany({
    where: and(eq(on === "problem" ? comment.problemId : comment.postId, id), eq(comment.status, "approved")),
    with: { author: { columns: { name: true } } },
    orderBy: desc(comment.createdAt),
  });
}

/** Newest first, each with its permanent key ("12.3") if its kind gets one (PERMALINK_KINDS). */
export async function getApprovedContributions(problemId: string) {
  const rows = await db.query.contribution.findMany({
    where: and(eq(contribution.problemId, problemId), eq(contribution.status, "approved")),
    orderBy: desc(contribution.createdAt),
  });
  const ids = rows.map((r) => r.id);
  const links = ids.length
    ? await db.select({ id: permalink.targetId, key: permalink.key }).from(permalink).where(and(eq(permalink.target, "contribution"), inArray(permalink.targetId, ids)))
    : [];
  const keys = new Map(links.map((l) => [l.id, l.key]));
  return rows.map((r) => ({ ...r, key: keys.get(r.id) }));
}
