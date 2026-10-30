// Public reads of user submissions. Only `approved` rows ever leave this module.
// The problem page caches what these return (see ProblemContent) under communityTag(problemId);
// moderation decisions invalidate that tag, so the queries run again only after something changed.
import "server-only";
import { and, asc, desc, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { comment, contribution, problemLink } from "@/lib/db/schema";

/** Cache tag for everything users added to one problem: comments, contributions and links. */
export const communityTag = (problemId: string) => `community:${problemId}`;

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

/** Links in either direction, so a link from A to B also shows on B. */
export async function getApprovedLinks(problemId: string) {
  return db.query.problemLink.findMany({
    where: and(
      or(eq(problemLink.fromProblemId, problemId), eq(problemLink.toProblemId, problemId)),
      eq(problemLink.status, "approved"),
    ),
    orderBy: asc(problemLink.createdAt),
  });
}
