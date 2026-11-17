"use server";

// Votes on contributions (see contributionVote). Not moderated: they count at once. The problem's pages are
// cached; a vote marks them for a background refresh, while the voter's own page shows the totals returned here.
import { and, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { communityTag, getVoteTotals, NO_VOTES, type Votes } from "@/lib/data/community";
import { db } from "@/lib/db";
import { contribution, contributionVote } from "@/lib/db/schema";

export type VoteResult = { votes: Votes; mine: Vote } | { error: string };

/** Up, down, or taken back. */
export type Vote = -1 | 0 | 1;

/**
 * What /api/votes returns for a problem: every contribution's votes as they are now, and the visitor's own votes
 * and contributions (on which they cannot vote).
 */
export type VotesSnapshot = { signedIn: boolean; votes: Record<string, Votes>; mine: Record<string, -1 | 1>; own: string[] };

const voteSchema = z.object({ contributionId: z.uuid(), value: z.union([z.literal(-1), z.literal(0), z.literal(1)]) });

export async function castVote(contributionId: string, value: Vote): Promise<VoteResult> {
  const parsed = voteSchema.safeParse({ contributionId, value });
  if (!parsed.success) return { error: "This vote could not be read." };
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to vote." };

  const target = await db.query.contribution.findFirst({
    where: eq(contribution.id, contributionId),
    columns: { problemId: true, authorId: true, kind: true, status: true },
  });
  if (!target || target.status !== "approved" || target.kind === "reference") return { error: "This contribution can no longer be voted on." };
  if (target.authorId === user.id) return { error: "You cannot vote on your own contribution." };

  const mine = and(eq(contributionVote.contributionId, contributionId), eq(contributionVote.userId, user.id));
  if (value === 0) await db.delete(contributionVote).where(mine);
  else
    await db
      .insert(contributionVote)
      .values({ contributionId, userId: user.id, value })
      .onConflictDoUpdate({ target: [contributionVote.contributionId, contributionVote.userId], set: { value, createdAt: new Date() } });

  revalidateTag(communityTag(target.problemId), "max");
  return { votes: (await getVoteTotals([contributionId])).get(contributionId) ?? NO_VOTES, mine: value };
}
