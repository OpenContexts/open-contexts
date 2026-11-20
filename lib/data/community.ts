// Public reads of user submissions. Only `approved` rows ever leave this module.
// The problem and blog post pages cache what these return (see ProblemContent) under communityTag(id);
// moderation decisions invalidate that tag, so the queries run again only after something changed.
import "server-only";
import { and, count, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, isDbConfigured } from "@/lib/db";
import type { ContributionKind } from "@/lib/constants";
import { comment, contribution, contributionVote, permalink, user } from "@/lib/db/schema";

/**
 * Cache tag for everything users added to one problem (comments, contributions, comments on these and votes) or
 * blog post (comments).
 */
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
    // The problem's own discussion: comments on its contributions are counted with those.
    db
      .select({ id: comment.problemId, n: count() })
      .from(comment)
      .where(and(eq(comment.status, "approved"), isNotNull(comment.problemId), isNull(comment.contributionId)))
      .groupBy(comment.problemId),
    db.select({ id: comment.postId, n: count() }).from(comment).where(and(eq(comment.status, "approved"), isNotNull(comment.postId))).groupBy(comment.postId),
  ]);
  const counts: CommunityCounts = {};
  const entry = (id: string) => (counts[id] ??= { contributions: 0, comments: 0 });
  for (const { id, n } of contributions) entry(id).contributions = n;
  for (const { id, n } of [...problemComments, ...postComments]) if (id) entry(id).comments = n;
  return counts;
}

/** The comments on a problem's own discussion, on a blog post or on a contribution, newest first. */
export async function getApprovedComments(on: "problem" | "post" | "contribution", id: string) {
  const target = on === "problem" ? and(eq(comment.problemId, id), isNull(comment.contributionId)) : eq(on === "post" ? comment.postId : comment.contributionId, id);
  return db.query.comment.findMany({
    where: and(target, eq(comment.status, "approved")),
    with: { author: { columns: { name: true } } },
    orderBy: desc(comment.createdAt),
  });
}

export type Comment = Awaited<ReturnType<typeof getApprovedComments>>[number];

/** Up- and downvotes of a contribution. Its score is the difference. */
export type Votes = { up: number; down: number };

export const NO_VOTES: Votes = { up: 0, down: 0 };

/** The votes on the given contributions, by id, without those of blocked accounts. */
export async function getVoteTotals(ids: string[]): Promise<Map<string, Votes>> {
  if (!ids.length) return new Map();
  const rows = await db
    .select({
      id: contributionVote.contributionId,
      up: sql<number>`count(*) filter (where ${contributionVote.value} > 0)`.mapWith(Number),
      down: sql<number>`count(*) filter (where ${contributionVote.value} < 0)`.mapWith(Number),
    })
    .from(contributionVote)
    .innerJoin(user, eq(user.id, contributionVote.userId))
    .where(and(inArray(contributionVote.contributionId, ids), sql`${user.banned} is not true`))
    .groupBy(contributionVote.contributionId);
  return new Map(rows.map(({ id, ...votes }) => [id, votes]));
}

/** An accepted result as other results refer to it: what a verification or challenge is about, or one that is. */
export type LinkedResult = { id: string; key: string; kind: ContributionKind; title: string; credit: string; withdrawn: boolean };

/** How the accepted results of one problem refer to each other: the one each is about, and those about each. */
export function linkResults<R extends { id: string; key?: string; kind: ContributionKind; title: string; credit: string; targetId: string | null; withdrawnAt: Date | null }>(rows: R[]) {
  const linked = new Map(
    rows.flatMap((r) => (r.key ? [[r.id, { id: r.id, key: r.key, kind: r.kind, title: r.title, credit: r.credit, withdrawn: !!r.withdrawnAt }] as const] : [])),
  );
  const about = Map.groupBy(
    rows.filter((r) => r.targetId && linked.has(r.id)),
    (r) => r.targetId!,
  );
  return {
    /** The result this one verifies or challenges, if it is public. */
    target: (r: R) => (r.targetId ? linked.get(r.targetId) : undefined),
    /** The verifications and challenges of this one, oldest first. */
    responses: (r: R) => (about.get(r.id) ?? []).map((x) => linked.get(x.id)!).toReversed(),
  };
}

/**
 * Newest first, each with its permanent key ("12.3") if its kind gets one (PERMALINK_KINDS), its votes and its
 * comments, newest first, the result it verifies or challenges (`target`) and the verifications and challenges of
 * it (`responses`). References get neither votes nor comments.
 */
export async function getApprovedContributions(problemId: string) {
  const rows = await db.query.contribution.findMany({
    where: and(eq(contribution.problemId, problemId), eq(contribution.status, "approved")),
    orderBy: desc(contribution.createdAt),
  });
  const ids = rows.map((r) => r.id);
  const results = rows.filter((r) => r.kind !== "reference").map((r) => r.id);
  const [links, votes, comments] = await Promise.all([
    ids.length ? db.select({ id: permalink.targetId, key: permalink.key }).from(permalink).where(and(eq(permalink.target, "contribution"), inArray(permalink.targetId, ids))) : [],
    getVoteTotals(results),
    results.length
      ? db.query.comment.findMany({
          where: and(inArray(comment.contributionId, results), eq(comment.status, "approved")),
          with: { author: { columns: { name: true } } },
          orderBy: desc(comment.createdAt),
        })
      : [],
  ]);
  const keys = new Map(links.map((l) => [l.id, l.key]));
  const byContribution = Map.groupBy(comments, (c) => c.contributionId);
  const withKeys = rows.map((r) => ({ ...r, key: keys.get(r.id) }));
  const { target, responses } = linkResults(withKeys);
  return withKeys.map((r) => ({ ...r, votes: votes.get(r.id) ?? NO_VOTES, comments: byContribution.get(r.id) ?? [], target: target(r), responses: responses(r) }));
}

export type ApprovedContribution = Awaited<ReturnType<typeof getApprovedContributions>>[number];

/** linkResults for the accepted results of one problem, without their texts, votes and comments: for a single result's page. */
export async function getResultLinks(problemId: string) {
  const rows = await db
    .select({ id: contribution.id, kind: contribution.kind, title: contribution.title, credit: contribution.credit, targetId: contribution.targetId, withdrawnAt: contribution.withdrawnAt, key: permalink.key })
    .from(contribution)
    .innerJoin(permalink, and(eq(permalink.target, "contribution"), eq(permalink.targetId, contribution.id)))
    .where(and(eq(contribution.problemId, problemId), eq(contribution.status, "approved")))
    .orderBy(desc(contribution.createdAt));
  const links = linkResults(rows);
  const byId = new Map(rows.map((r) => [r.id, r]));
  return {
    target: (id: string) => {
      const r = byId.get(id);
      return r && links.target(r);
    },
    responses: (id: string) => {
      const r = byId.get(id);
      return r ? links.responses(r) : [];
    },
  };
}

/** getApprovedContributions, cached like the problem page, for the pages that list them (/problems/<slug>/contributions). */
export async function getCachedContributions(problemId: string): Promise<ApprovedContribution[]> {
  "use cache";
  cacheLife("max");
  cacheTag(communityTag(problemId), "community");
  return isDbConfigured() ? getApprovedContributions(problemId) : [];
}
