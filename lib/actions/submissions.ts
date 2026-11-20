"use server";

// Every user submission enters the database as `pending`. Nothing here publishes anything;
// moderators do that in app/admin.
import { and, count, eq, isNull } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { type CurrentUser, getCurrentUser } from "@/lib/auth/session";
import { getPost } from "@/lib/data/blog";
import { communityTag } from "@/lib/data/community";
import { existingKey, type Query, runBatch } from "@/lib/data/permalinks";
import { withdrawalEntry } from "@/lib/data/problem-writes";
import { getProblem, getProblemById, type Problem, readProblem } from "@/lib/data/problems";
import { db } from "@/lib/db";
import { unknownCitesError } from "@/lib/references";
import { canWithdraw, PROBLEM_STATUS_LABELS, RESULT_KINDS_BY_STATUS, STATEMENT_EDITABLE, TARGETED_KINDS } from "@/lib/constants";
import { activityLog, blogPost, comment, contribution, permalink, problem, problemProposal, problemRevision } from "@/lib/db/schema";
import {
  commentSchema,
  postSchema,
  proposalSchema,
  referenceSchema,
  resultSchema,
  revisionSchema,
} from "@/lib/validation/submissions";
import { type FormState, invalid, readForm } from "./form-state";

/** Pending submissions one person may have at once, to keep the queue usable. */
const MAX_PENDING = 20;

async function pendingCount(userId: string): Promise<number> {
  const counts = await db.batch([
    db.select({ n: count() }).from(comment).where(and(eq(comment.authorId, userId), eq(comment.status, "pending"))),
    db.select({ n: count() }).from(contribution).where(and(eq(contribution.authorId, userId), eq(contribution.status, "pending"), isNull(contribution.withdrawnAt))),
    db.select({ n: count() }).from(problemRevision).where(and(eq(problemRevision.authorId, userId), eq(problemRevision.status, "pending"))),
    db.select({ n: count() }).from(problemProposal).where(and(eq(problemProposal.authorId, userId), eq(problemProposal.status, "pending"))),
    db.select({ n: count() }).from(blogPost).where(and(eq(blogPost.authorId, userId), eq(blogPost.status, "pending"))),
  ]);
  return counts.reduce((sum, [row]) => sum + row.n, 0);
}

/** Shared checks: signed in and under the pending limit. */
async function guard(values: FormState["values"]): Promise<{ user: CurrentUser; error?: never } | { error: FormState; user?: never }> {
  const user = await getCurrentUser();
  if (!user) return { error: { status: "error", message: "Please sign in to contribute.", values } satisfies FormState };
  if ((await pendingCount(user.id)) >= MAX_PENDING) {
    return {
      error: {
        status: "error",
        message: `You already have ${MAX_PENDING} submissions waiting for review. Please wait until some of them have been reviewed.`,
        values,
      } satisfies FormState,
    };
  }
  return { user };
}

/** `guard`, plus: the problem exists. */
async function guardProblem(
  values: FormState["values"],
  problemSlug: string,
): Promise<{ user: CurrentUser; problem: Problem; error?: never } | { error: FormState; user?: never; problem?: never }> {
  const { user, error } = await guard(values);
  if (error) return { error };
  const problem = await getProblem(problemSlug);
  if (!problem) return { error: { status: "error", message: "This problem does not exist.", values } };
  return { user, problem };
}

const success: FormState = { status: "success" };

/** An error for the fields that cite keys (\cite{key}) not among the problem's (or post's) references, or undefined. */
function citeErrors(values: FormState["values"], cited: Pick<Problem, "references">, fields: Record<string, string>): FormState | undefined {
  const errors: NonNullable<FormState["errors"]> = {};
  for (const [name, value] of Object.entries(fields)) {
    const message = unknownCitesError(value, cited.references);
    if (message) errors[name] = [message];
  }
  if (!Object.keys(errors).length) return undefined;
  return { status: "error", message: "Please check the highlighted fields.", errors, values };
}

/** Runs the insert; a database failure becomes a message in the form instead of an error page. */
async function save(values: FormState["values"], insert: () => Promise<unknown>): Promise<FormState> {
  try {
    await insert();
    return success;
  } catch (error) {
    console.error("Saving a submission failed", error);
    return { status: "error", message: "Your submission could not be saved. Please try again in a moment.", values };
  }
}

/** Where a comment goes: a problem's own discussion, a blog post, or a contribution to a problem. */
type Discussion = { problemId: string } | { postId: string } | { contributionId: string };

/**
 * The comment a reply goes under: a published comment in the same discussion. A reply to a reply goes under the
 * comment that one answers, so threads stay one level deep. Undefined if there is no such comment.
 */
async function replyParent(parentId: string, on: Discussion): Promise<string | undefined> {
  const parent = await db.query.comment.findFirst({
    where: eq(comment.id, parentId),
    columns: { id: true, parentId: true, problemId: true, postId: true, contributionId: true, status: true },
  });
  if (!parent || parent.status !== "approved") return undefined;
  const same =
    "contributionId" in on
      ? parent.contributionId === on.contributionId
      : "postId" in on
        ? parent.postId === on.postId
        : parent.problemId === on.problemId && !parent.contributionId;
  return same ? (parent.parentId ?? parent.id) : undefined;
}

const NO_PARENT = "The comment you are replying to is no longer available.";

/**
 * The accepted result with this key ("12.3") on the given problem, if a verification or challenge can be about it:
 * not a reference, and not withdrawn.
 */
async function targetableResult(key: string, problemId: string) {
  const link = await db.query.permalink.findFirst({ where: and(eq(permalink.key, key), eq(permalink.target, "contribution")) });
  const row = link && (await db.query.contribution.findFirst({ where: eq(contribution.id, link.targetId), columns: { id: true, problemId: true, kind: true, status: true, withdrawnAt: true } }));
  return row && row.problemId === problemId && row.status === "approved" && row.kind !== "reference" && !row.withdrawnAt ? row : undefined;
}

/** The accepted contribution with this key ("12.3"), if it can be commented on: not a reference. */
async function commentableContribution(key: string) {
  const link = await db.query.permalink.findFirst({ where: and(eq(permalink.key, key), eq(permalink.target, "contribution")) });
  const row = link && (await db.query.contribution.findFirst({ where: eq(contribution.id, link.targetId), columns: { id: true, problemId: true, kind: true, status: true } }));
  return row && row.status === "approved" && row.kind !== "reference" ? row : undefined;
}

/**
 * The discussion a comment goes to, the columns that place it there, and the references it may cite (the post's
 * or the problem's); or why there is none.
 */
async function findDiscussion({ problemSlug, postSlug, contributionKey }: { problemSlug?: string; postSlug?: string; contributionKey?: string }): Promise<
  { on: Discussion; columns: Pick<typeof comment.$inferInsert, "problemId" | "postId" | "contributionId">; cited: Pick<Problem, "references"> } | { error: string }
> {
  if (postSlug) {
    const post = await getPost(postSlug);
    return post ? { on: { postId: post.id }, columns: { postId: post.id }, cited: post } : { error: "This blog post does not exist." };
  }
  if (contributionKey) {
    const target = await commentableContribution(contributionKey);
    const problem = target && (await getProblemById(target.problemId));
    if (!target || !problem) return { error: "This contribution is no longer available." };
    return { on: { contributionId: target.id }, columns: { problemId: problem.id, contributionId: target.id }, cited: problem };
  }
  const problem = await getProblem(problemSlug ?? "");
  return problem ? { on: { problemId: problem.id }, columns: { problemId: problem.id }, cited: problem } : { error: "This problem does not exist." };
}

/** A comment on a problem, a published blog post or an accepted contribution, or a reply to one. */
export async function submitComment(_: FormState, formData: FormData): Promise<FormState> {
  const values = readForm(formData);
  const parsed = commentSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);
  const { user, error } = await guard(values);
  if (error) return error;

  const discussion = await findDiscussion(parsed.data);
  if ("error" in discussion) return { status: "error", message: discussion.error, values };
  const { body } = parsed.data;
  const citeError = citeErrors(values, discussion.cited, { body });
  if (citeError) return citeError;
  const parentId = parsed.data.parentId ? await replyParent(parsed.data.parentId, discussion.on) : null;
  if (parentId === undefined) return { status: "error", message: NO_PARENT, values };
  return save(values, () => db.insert(comment).values({ body, ...discussion.columns, parentId, authorId: user.id }));
}

export async function submitResult(_: FormState, formData: FormData): Promise<FormState> {
  const values = readForm(formData);
  const parsed = resultSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);
  const { user, problem, error } = await guardProblem(values, parsed.data.problemSlug);
  if (error) return error;

  const { kind, title, summary, url, aiUse, credit, target } = parsed.data;
  // The form only offers what the problem's status allows, but it may have changed since the form was opened.
  if (!RESULT_KINDS_BY_STATUS[problem.status].includes(kind)) {
    return { status: "error", message: `This problem is now ${PROBLEM_STATUS_LABELS[problem.status]}, so it no longer takes this kind of result.`, errors: { kind: ["Please choose another kind."] }, values };
  }
  let targetId: string | null = null;
  if (TARGETED_KINDS.includes(kind)) {
    const row = target ? await targetableResult(target, problem.id) : undefined;
    if (!row) return { status: "error", message: "Please check the highlighted fields.", errors: { target: ["Please choose the result this is about."] }, values };
    targetId = row.id;
  }
  const citeError = citeErrors(values, problem, { summary });
  if (citeError) return citeError;
  return save(values, () => db.insert(contribution).values({ kind, title, summary, url, aiUse, credit, targetId, problemId: problem.id, authorId: user.id }));
}

export async function submitReference(_: FormState, formData: FormData): Promise<FormState> {
  const values = readForm(formData);
  const parsed = referenceSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);
  const { user, problem, error } = await guardProblem(values, parsed.data.problemSlug);
  if (error) return error;

  const { title, url, summary } = parsed.data;
  return save(values, () =>
    db.insert(contribution).values({ title, url, summary, kind: "reference", aiUse: "none", credit: user.name, problemId: problem.id, authorId: user.id }),
  );
}

export async function submitRevision(_: FormState, formData: FormData): Promise<FormState> {
  const values = readForm(formData);
  const parsed = revisionSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);
  const { user, problem, error } = await guardProblem(values, parsed.data.problemSlug);
  if (error) return error;

  // Compared with the stored row, not the cached list, so a just-saved change counts.
  const current = (await readProblem(problem.id)) ?? problem;
  const { title, statement, body, changeSummary, baseVersion, credit, aiUse } = parsed.data;
  if (title === current.title && statement === current.statement.trim() && body === current.body.trim()) {
    return { status: "error", message: "You have not changed anything yet.", values };
  }
  if (!STATEMENT_EDITABLE[current.status] && statement !== current.statement.trim()) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      errors: { statement: [`The statement stays as it is while the problem is ${PROBLEM_STATUS_LABELS[current.status]}. If it is flawed, please say so in the discussion or submit a challenge.`] },
      values,
    };
  }
  const citeError = citeErrors(values, current, { statement, body });
  if (citeError) return citeError;
  return save(values, () =>
    db.insert(problemRevision).values({ problemId: problem.id, baseVersion, title, statement, body, changeSummary, credit, aiUse, authorId: user.id }),
  );
}

export async function submitProposal(_: FormState, formData: FormData): Promise<FormState> {
  const values = readForm(formData);
  const parsed = proposalSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);
  const { user, error } = await guard(values);
  if (error) return error;

  const { "agenda[]": agenda, ...rest } = parsed.data;
  return save(values, () => db.insert(problemProposal).values({ ...rest, agenda, authorId: user.id }));
}

export async function submitPost(_: FormState, formData: FormData): Promise<FormState> {
  const values = readForm(formData);
  const parsed = postSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);
  const { user, error } = await guard(values);
  if (error) return error;

  return save(values, () => db.insert(blogPost).values({ ...parsed.data, authorId: user.id }));
}

/**
 * The author withdraws one of their contributions. One waiting for review leaves the queue. An accepted result
 * stays on its problem, marked as withdrawn, with a dated entry in the history; as the guidelines say, it keeps
 * the credit it earned, and a withdrawn claim does not by itself change the problem's status, which the
 * moderators then reconsider. Accepted references are part of the problem's list and stay.
 */
export async function withdrawContribution(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!user || !id.success) return;
  const row = await db.query.contribution.findFirst({ where: eq(contribution.id, id.data) });
  if (!row || row.authorId !== user.id || row.withdrawnAt || !canWithdraw(row)) return;

  const withdrawnAt = new Date();
  const queries: Query[] = [
    db.update(contribution).set({ withdrawnAt }).where(eq(contribution.id, row.id)),
    db.insert(activityLog).values({ targetType: "contribution", targetId: row.id, action: "withdraw", moderatorId: user.id }),
  ];
  const key = row.status === "approved" ? await existingKey("contribution", row.id) : undefined;
  const current = key ? await readProblem(row.problemId) : undefined;
  if (key && current) {
    const history = [...current.history, withdrawalEntry({ ...row, withdrawnAt }, key)];
    queries.push(db.update(problem).set({ history, updatedAt: withdrawnAt }).where(eq(problem.id, row.problemId)));
  }
  await runBatch(queries);
  if (row.status === "approved") {
    updateTag("problems");
    updateTag(communityTag(row.problemId));
  }
  refresh();
}
