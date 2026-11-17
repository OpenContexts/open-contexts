// The votes on a problem's contributions as they are now, and the visitor's own: what they voted, and which
// contributions are theirs (they cannot vote on those). The problem's pages are cached for everyone; their vote
// controls read this when they load (components/problems/votes.tsx).
import { and, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import type { VotesSnapshot } from "@/lib/actions/votes";
import { getVoteTotals, NO_VOTES } from "@/lib/data/community";
import { db } from "@/lib/db";
import { contribution, contributionVote } from "@/lib/db/schema";

export async function GET(request: Request) {
  const problemId = z.uuid().safeParse(new URL(request.url).searchParams.get("problem"));
  if (!problemId.success) return Response.json({ error: "Unknown problem." }, { status: 400 });

  const [user, rows] = await Promise.all([
    getCurrentUser(),
    db
      .select({ id: contribution.id, authorId: contribution.authorId })
      .from(contribution)
      .where(and(eq(contribution.problemId, problemId.data), eq(contribution.status, "approved"), ne(contribution.kind, "reference"))),
  ]);
  const ids = rows.map((r) => r.id);
  const [totals, mine] = await Promise.all([
    getVoteTotals(ids),
    user && ids.length
      ? db
          .select({ id: contributionVote.contributionId, value: contributionVote.value })
          .from(contributionVote)
          .where(and(eq(contributionVote.userId, user.id), inArray(contributionVote.contributionId, ids)))
      : [],
  ]);

  const snapshot: VotesSnapshot = {
    signedIn: !!user,
    // Every contribution, so a cached score that is out of date is replaced, also by zero.
    votes: Object.fromEntries(ids.map((id) => [id, totals.get(id) ?? NO_VOTES])),
    mine: Object.fromEntries(mine.map((v) => [v.id, v.value > 0 ? 1 : -1])),
    own: user ? rows.filter((r) => r.authorId === user.id).map((r) => r.id) : [],
  };
  return Response.json(snapshot, { headers: { "Cache-Control": "private, no-store" } });
}
