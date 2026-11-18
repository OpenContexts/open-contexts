"use server";

import { eq, sql } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireModerator } from "@/lib/auth/session";
import { CONTRIBUTION_HISTORY_KINDS, CONTRIBUTION_KIND_LABELS, MODERATION_ACTIONS, type ModerationAction, SUBMISSION_TYPES, type SubmissionType } from "@/lib/constants";
import { BLOG_TAG } from "@/lib/data/blog";
import { COUNTS_TAG, communityTag } from "@/lib/data/community";
import { MODERATORS_TAG } from "@/lib/data/moderators";
import {
  amendLatestVersion,
  contributionPermalink,
  nextVersion,
  PERMALINKS_TAG,
  postPermalink,
  problemPermalink,
  type Query,
  runBatch,
  versionQuery,
} from "@/lib/data/permalinks";
import { nextProblemNumber, slugify, today, uniqueSlug } from "@/lib/data/problem-writes";
import { readProblem } from "@/lib/data/problems";
import { db } from "@/lib/db";
import { activityLog, blogPost, comment, contribution, problem, problemProposal, problemRevision, type Reference } from "@/lib/db/schema";
import { withKeys } from "@/lib/references";

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

/** `problemId`: the problem an approved proposal created. `slug` and `publishedAt`: a blog post's, set on its first approval. */
function reviewQuery(type: SubmissionType, id: string, review: Review & { problemId?: string; slug?: string; publishedAt?: Date }) {
  switch (type) {
    case "comment":
      return db.update(comment).set(review).where(eq(comment.id, id));
    case "contribution":
      return db.update(contribution).set(review).where(eq(contribution.id, id));
    case "revision":
      return db.update(problemRevision).set(review).where(eq(problemRevision.id, id));
    case "proposal":
      return db.update(problemProposal).set(review).where(eq(problemProposal.id, id));
    case "post":
      return db.update(blogPost).set(review).where(eq(blogPost.id, id));
    default:
      throw new Error(`Unknown submission type: ${type satisfies never}`);
  }
}

/** URL names that are routes of their own under /blog. */
const RESERVED_POST_SLUGS = new Set(["new"]);

/**
 * What approving a blog post sets: on its first approval a free URL name and today's date. A post that was
 * approved before keeps both, so reopening and approving it again does not move it.
 */
async function postPublication(id: string): Promise<{ slug?: string; publishedAt?: Date }> {
  const post = await db.query.blogPost.findFirst({ where: eq(blogPost.id, id), columns: { title: true, slug: true, publishedAt: true } });
  if (!post) throw new Error("Blog post not found.");
  if (post.slug && post.publishedAt) return {};
  const taken = new Set((await db.select({ slug: blogPost.slug }).from(blogPost)).map((r) => r.slug));
  const start = slugify(post.title) || "post";
  let slug = start;
  for (let i = 2; taken.has(slug) || RESERVED_POST_SLUGS.has(slug); i++) slug = `${start}-${i}`;
  return { slug: post.slug ?? slug, publishedAt: post.publishedAt ?? new Date() };
}

// The three helpers below return their queries wrapped in an object: returning a Drizzle query from an
// async function would run it right away, outside the decision's batch.

/** Approving an edit writes its snapshot into the problem, records it in the history and starts a new version. */
async function applyRevision(id: string) {
  const revision = await db.query.problemRevision.findFirst({ where: eq(problemRevision.id, id) });
  const current = revision && (await readProblem(revision.problemId));
  if (!revision || !current) throw new Error("The edit or its problem no longer exists.");
  const text = { title: revision.title, statement: revision.statement, body: revision.body, references: current.references };
  const version = await nextVersion(current.id);
  return {
    queries: [
      db
        .update(problem)
        .set({
          title: text.title,
          statement: text.statement,
          body: text.body,
          history: [...current.history, { date: today(), kind: "edit", text: revision.changeSummary, version }],
          version: sql`${problem.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(problem.id, current.id)),
      // Credited to the names the edit gives, with its statement on AI use.
      versionQuery(current, version, text, { changeSummary: revision.changeSummary, credit: revision.credit, aiUse: revision.aiUse, revisionId: revision.id }),
    ],
  };
}

/**
 * A reference contribution with a link is also cited on the problem itself: approving it adds it to the problem's
 * references (unless the same text or link is already there), reopening it removes it again.
 * Returns undefined when the references stay as they are.
 */
async function citeReference(problemId: string, ref: Reference, change: "add" | "remove") {
  const current = await readProblem(problemId);
  if (!current) return undefined;
  const references =
    change === "add"
      ? current.references.some((r) => r.text === ref.text || (ref.url && r.url === ref.url))
        ? undefined
        : withKeys([...current.references, ref])
      : current.references.some((r) => r.text === ref.text && r.url === ref.url)
        ? current.references.filter((r) => !(r.text === ref.text && r.url === ref.url))
        : undefined;
  // An added or removed reference is not a new version of the problem: it amends the latest one.
  return (
    references && {
      queries: [db.update(problem).set({ references, updatedAt: new Date() }).where(eq(problem.id, problemId)), amendLatestVersion(problemId, { references })],
    }
  );
}

/**
 * An accepted contribution is recorded in its problem's "Progress and history", as the kind of entry its kind
 * makes (CONTRIBUTION_HISTORY_KINDS), linked by its key, which shows who made it. Reopening it takes the entry out
 * again; accepting it again puts it back with the new date. Returns undefined when the history stays as it is.
 */
async function recordInHistory(contributionId: string, key: string, change: "add" | "remove") {
  const row = await db.query.contribution.findFirst({ where: eq(contribution.id, contributionId), columns: { problemId: true, kind: true, title: true } });
  const kind = row && CONTRIBUTION_HISTORY_KINDS[row.kind];
  const current = kind ? await readProblem(row.problemId) : undefined;
  if (!row || !kind || !current) return undefined;
  const others = current.history.filter((h) => h.contribution !== key);
  if (change === "remove" && others.length === current.history.length) return undefined;
  const label = CONTRIBUTION_KIND_LABELS[row.kind].replace(/^./, (c) => c.toUpperCase());
  const history = change === "add" ? [...others, { date: today(), kind, text: `${label}: ${row.title}`, contribution: key }] : others;
  return { queries: [db.update(problem).set({ history, ...(change === "add" && { updatedAt: new Date() }) }).where(eq(problem.id, row.problemId))] };
}

/** Approving a proposal creates the problem, with the next free number, its first version and its key. */
async function publishProposal(id: string, problemId: string) {
  const proposal = await db.query.problemProposal.findFirst({ where: eq(problemProposal.id, id) });
  if (!proposal) throw new Error("Proposal not found.");
  const values = {
    id: problemId,
    number: await nextProblemNumber(),
    slug: await uniqueSlug(slugify(proposal.title)),
    title: proposal.title,
    status: "open",
    agenda: proposal.agenda,
    tags: proposal.tags,
    posedBy: proposal.posedBy,
    posed: today(),
    statement: proposal.statement,
    body: proposal.body,
    history: [{ date: today(), kind: "posed", text: "Proposed by the community and accepted by the moderators." }],
    references: withKeys(proposal.references),
    createdById: proposal.authorId,
  } satisfies typeof problem.$inferInsert;
  return { queries: [db.insert(problem).values(values), versionQuery(values, 1, values), problemPermalink(problemId, values.number)] };
}

/** The submission's status; `pages`: the problem pages that show it once approved; `reference`: what an approved reference adds to its problem. */
async function currentState(type: SubmissionType, id: string): Promise<{ status: Review["status"]; pages: string[]; reference?: Reference } | undefined> {
  const columns = { status: true } as const;
  switch (type) {
    case "comment": {
      const row = await db.query.comment.findFirst({ where: eq(comment.id, id), columns: { ...columns, problemId: true, postId: true } });
      // On a problem or on a blog post: exactly one of the two is set.
      return row && { status: row.status, pages: [row.problemId ?? row.postId].filter((page) => page !== null) };
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
    // Blog posts are cached under BLOG_TAG.
    case "post": {
      const row = await db.query.blogPost.findFirst({ where: eq(blogPost.id, id), columns });
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

  const problemChange = action === "approve" ? "add" : current.status === "approved" ? "remove" : undefined;
  const cite = current.reference && problemChange ? await citeReference(current.pages[0], current.reference, problemChange) : undefined;

  const publication = type === "post" && action === "approve" ? await postPublication(id) : {};
  // Accepted contributions (of the kinds in PERMALINK_KINDS) and posts get their permanent key on the first approval.
  // Reopening looks the contribution's key up too, to take its entry out of the history.
  const contributionKey = type === "contribution" && problemChange ? await contributionPermalink(id) : undefined;
  const key = contributionKey ?? (type === "post" && action === "approve" ? await postPermalink(id) : undefined);
  const history = contributionKey && problemChange ? await recordInHistory(id, contributionKey.key, problemChange) : undefined;
  const update = reviewQuery(type, id, { ...review, ...(problemId && { problemId }), ...publication });
  const log = db.insert(activityLog).values({ targetType: type, targetId: id, action, moderatorId: moderator.id, note: note || null });
  // Publishing runs first: the proposal's problem_id must point at an existing problem.
  // An approved edit or proposal changes the problem, and so does an approved contribution: a reference its
  // references, any other kind its history.
  const change: Query[] = publish?.queries ?? cite?.queries ?? history?.queries ?? [];
  await runBatch([...change, update, log, ...(key?.query ? [key.query] : [])]);

  // Problem pages are cached until something on them changes: an approval adds to them, reopening an
  // approved submission takes it off again. Rejecting a pending one changes nothing that is public.
  if (action === "approve" || current.status === "approved") {
    if (type === "revision" || type === "proposal" || cite || history) updateTag("problems");
    if (key?.query || type === "proposal") updateTag(PERMALINKS_TAG);
    if (type === "post") updateTag(BLOG_TAG);
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
  updateTag(BLOG_TAG);
  updateTag("community");
  updateTag(MODERATORS_TAG);
}
