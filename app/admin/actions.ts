"use server";

import { eq, sql } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireModerator } from "@/lib/auth/session";
import { MODERATION_ACTIONS, type ModerationAction, SUBMISSION_TYPES, type SubmissionType } from "@/lib/constants";
import { COUNTS_TAG, communityTag } from "@/lib/data/community";
import { changeEntries, nextProblemNumber, slugify, today, uniqueSlug } from "@/lib/data/problem-writes";
import { readProblem } from "@/lib/data/problems";
import { db } from "@/lib/db";
import { comment, contribution, moderationLog, problem, problemProposal, problemRevision, type Reference } from "@/lib/db/schema";

const decisionSchema = z.object({
  type: z.enum(SUBMISSION_TYPES),
  id: z.uuid(),
  action: z.enum(MODERATION_ACTIONS),
  note: z.string().trim().max(2000).optional(),
});

type Review = {
  status: "pending" | "approved" | "rejected";
  reviewedById: string | null;
  reviewedAt: Date | null;
  reviewNote: string | null;
};

function reviewQuery(type: SubmissionType, id: string, review: Review & { problemId?: string }) {
  switch (type) {
    case "comment":
      return db.update(comment).set(review).where(eq(comment.id, id));
    case "contribution":
      return db.update(contribution).set(review).where(eq(contribution.id, id));
    case "revision":
      return db.update(problemRevision).set(review).where(eq(problemRevision.id, id));
    case "proposal":
      return db.update(problemProposal).set(review).where(eq(problemProposal.id, id));
    default:
      throw new Error(`Unknown submission type: ${type satisfies never}`);
  }
}

// The two helpers below return their query wrapped in an object: awaiting a Drizzle query
// directly would run it right away, outside the batch.

/** Approving an edit writes its snapshot into the problem and records it in the history. */
async function applyRevision(id: string) {
  const revision = await db.query.problemRevision.findFirst({ where: eq(problemRevision.id, id) });
  const current = revision && (await readProblem(revision.problemId));
  if (!revision || !current) throw new Error("The edit or its problem no longer exists.");
  const status = revision.problemStatus ?? current.status;
  return {
    query: db
      .update(problem)
      .set({
      title: revision.title,
      statement: revision.statement,
      body: revision.body,
      status,
      history: [...current.history, ...changeEntries({ summary: revision.changeSummary, from: current.status, to: status })],
      version: sql`${problem.version} + 1`,
      updatedAt: new Date(),
      })
      .where(eq(problem.id, current.id)),
  };
}

/**
 * A reference contribution with a link is also cited on the problem itself: approving it adds it to the problem's
 * references (unless the same text or link is already there), reopening it removes it again.
 * Returns undefined when the references stay as they are. The query is wrapped so that returning it from
 * this async function does not run it: it runs in the decision's batch.
 */
async function citeReference(problemId: string, ref: Reference, change: "add" | "remove") {
  const current = await readProblem(problemId);
  if (!current) return undefined;
  const references =
    change === "add"
      ? current.references.some((r) => r.text === ref.text || (ref.url && r.url === ref.url))
        ? undefined
        : [...current.references, ref]
      : current.references.some((r) => r.text === ref.text && r.url === ref.url)
        ? current.references.filter((r) => !(r.text === ref.text && r.url === ref.url))
        : undefined;
  return references && { query: db.update(problem).set({ references, updatedAt: new Date() }).where(eq(problem.id, problemId)) };
}

/** Approving a proposal creates the problem, with the next free number. */
async function publishProposal(id: string, problemId: string) {
  const proposal = await db.query.problemProposal.findFirst({ where: eq(problemProposal.id, id) });
  if (!proposal) throw new Error("Proposal not found.");
  const values = {
    id: problemId,
    number: await nextProblemNumber(),
    slug: await uniqueSlug(slugify(proposal.title)),
    title: proposal.title,
    status: "open",
    areas: proposal.areas,
    tags: proposal.tags,
    posedBy: proposal.posedBy,
    posed: today(),
    statement: proposal.statement,
    body: proposal.body,
    history: [{ date: today(), kind: "posed", text: "Proposed by the community and accepted by the moderators." }],
    references: proposal.references,
    createdById: proposal.authorId,
  } satisfies typeof problem.$inferInsert;
  return { query: db.insert(problem).values(values) };
}

/** The submission's status, and the problem pages it appears on once approved. */
/** `pages`: the problem pages that show the submission. `reference`: what an approved reference adds to its problem. */
async function currentState(type: SubmissionType, id: string): Promise<{ status: Review["status"]; pages: string[]; reference?: Reference } | undefined> {
  const columns = { status: true } as const;
  switch (type) {
    case "comment": {
      const row = await db.query.comment.findFirst({ where: eq(comment.id, id), columns: { ...columns, problemId: true } });
      return row && { status: row.status, pages: [row.problemId] };
    }
    case "contribution": {
      const row = await db.query.contribution.findFirst({ where: eq(contribution.id, id), columns: { ...columns, problemId: true, kind: true, title: true, url: true } });
      // Only references with a link are cited on the problem; without one they stay a contribution.
      const reference = row?.kind === "reference" && row.url ? { text: row.title, url: row.url } : undefined;
      return row && { status: row.status, pages: [row.problemId], reference };
    }
    // Edits and proposals change the problems themselves, which are cached under the "problems" tag.
    case "revision": {
      const row = await db.query.problemRevision.findFirst({ where: eq(problemRevision.id, id), columns });
      return row && { status: row.status, pages: [] };
    }
    case "proposal": {
      const row = await db.query.problemProposal.findFirst({ where: eq(problemProposal.id, id), columns });
      return row && { status: row.status, pages: [] };
    }
    default:
      throw new Error(`Unknown submission type: ${type satisfies never}`);
  }
}

/**
 * Approve, reject or reopen one submission; the decision is logged in the same transaction.
 * Returns false if the submission is gone or was already decided (e.g. by another moderator).
 */
async function applyDecision(formData: FormData): Promise<{ type: SubmissionType; action: ModerationAction; applied: boolean }> {
  const moderator = await requireModerator();
  const { type, id, action, note } = decisionSchema.parse(Object.fromEntries(formData));

  const current = await currentState(type, id);
  if (!current || (action === "reopen") !== (current.status !== "pending")) return { type, action, applied: false };
  // Approved edits and proposals have changed the problem itself; undo those in the problem editor.
  if (action === "reopen" && current.status === "approved" && (type === "revision" || type === "proposal")) return { type, action, applied: false };

  const review: Review =
    action === "reopen"
      ? { status: "pending", reviewedById: null, reviewedAt: null, reviewNote: null }
      : { status: action === "approve" ? "approved" : "rejected", reviewedById: moderator.id, reviewedAt: new Date(), reviewNote: note || null };
  const problemId = type === "proposal" && action === "approve" ? crypto.randomUUID() : undefined;
  const publish = action !== "approve" ? undefined : type === "revision" ? await applyRevision(id) : problemId ? await publishProposal(id, problemId) : undefined;

  const referenceChange = action === "approve" ? "add" : current.status === "approved" ? "remove" : undefined;
  const cite = current.reference && referenceChange ? await citeReference(current.pages[0], current.reference, referenceChange) : undefined;

  const update = reviewQuery(type, id, { ...review, ...(problemId && { problemId }) });
  const log = db.insert(moderationLog).values({ targetType: type, targetId: id, action, moderatorId: moderator.id, note: note || null });
  // Publishing runs first: the proposal's problem_id must point at an existing problem.
  // An approved edit or proposal changes the problem, and so may an approved reference (never both at once).
  const change = publish?.query ?? cite?.query;
  await (change ? db.batch([change, update, log]) : db.batch([update, log]));

  // Problem pages are cached until something on them changes: an approval adds to them, reopening an
  // approved submission takes it off again. Rejecting a pending one changes nothing that is public.
  if (action === "approve" || current.status === "approved") {
    if (type === "revision" || type === "proposal" || cite) updateTag("problems");
    for (const problemId of current.pages) updateTag(communityTag(problemId));
    if (current.pages.length) updateTag(COUNTS_TAG); // the counts in the problem lists
  }
  return { type, action, applied: true };
}

/** From the review page: back to the queue after a decision, stay on the page after reopening. */
export async function decide(formData: FormData) {
  const { type, action } = await applyDecision(formData);
  if (action === "reopen") refresh();
  else redirect(`/admin/queue/${type}`);
}

/** From the queue list: decide without leaving the list, which re-renders without the item. */
export async function quickDecide(formData: FormData) {
  await applyDecision(formData);
  refresh();
}

/**
 * Throws away every cached page and list built from problems or submissions, so the site shows the
 * database as it is. Only needed after changing data directly in the database (e.g. Drizzle Studio):
 * changes made through the site refresh exactly the pages they affect by themselves.
 */
export async function refreshSiteCache() {
  await requireAdmin();
  updateTag("problems");
  updateTag("community");
}
