// A user's own submissions, for /me. Includes pending and rejected ones.
import "server-only";
import { desc, eq } from "drizzle-orm";
import type { ModerationStatus, SubmissionType } from "@/lib/constants";
import { db } from "@/lib/db";
import { comment, contribution, problemLink, problemProposal, problemRevision } from "@/lib/db/schema";

export type MySubmission = {
  type: SubmissionType;
  id: string;
  title: string;
  problemId: string | null;
  status: ModerationStatus;
  reviewNote: string | null;
  createdAt: Date;
};

const excerpt = (s: string, n = 90) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s);

/** `titles` maps problem ids to their titles, for describing links. */
export async function getMySubmissions(userId: string, titles: Map<string, string>): Promise<MySubmission[]> {
  const [comments, contributions, links, revisions, proposals] = await db.batch([
    db.select().from(comment).where(eq(comment.authorId, userId)).orderBy(desc(comment.createdAt)),
    db.select().from(contribution).where(eq(contribution.authorId, userId)).orderBy(desc(contribution.createdAt)),
    db.select().from(problemLink).where(eq(problemLink.proposedById, userId)).orderBy(desc(problemLink.createdAt)),
    db.select().from(problemRevision).where(eq(problemRevision.authorId, userId)).orderBy(desc(problemRevision.createdAt)),
    db.select().from(problemProposal).where(eq(problemProposal.authorId, userId)).orderBy(desc(problemProposal.createdAt)),
  ]);
  const common = (r: { id: string; status: ModerationStatus; reviewNote: string | null; createdAt: Date }) => ({
    id: r.id,
    status: r.status,
    reviewNote: r.reviewNote,
    createdAt: r.createdAt,
  });
  return [
    ...comments.map((r) => ({ ...common(r), type: "comment" as const, title: excerpt(r.body), problemId: r.problemId })),
    ...contributions.map((r) => ({ ...common(r), type: "contribution" as const, title: r.title, problemId: r.problemId })),
    ...links.map((r) => ({ ...common(r), type: "link" as const, title: `Link to ${(r.toProblemId && titles.get(r.toProblemId)) ?? r.url ?? "a problem"}`, problemId: r.fromProblemId })),
    ...revisions.map((r) => ({ ...common(r), type: "revision" as const, title: r.changeSummary, problemId: r.problemId })),
    ...proposals.map((r) => ({ ...common(r), type: "proposal" as const, title: r.title, problemId: r.problemId })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
