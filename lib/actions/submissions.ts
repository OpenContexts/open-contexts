"use server";

// Every user submission enters the database as `pending`. Nothing here publishes anything;
// moderators do that in app/admin.
import { and, count, eq } from "drizzle-orm";
import { type CurrentUser, getCurrentUser } from "@/lib/auth/session";
import { getPost } from "@/lib/data/blog";
import { getProblem, type Problem, readProblem } from "@/lib/data/problems";
import { db } from "@/lib/db";
import { unknownCitesError } from "@/lib/references";
import { blogPost, comment, contribution, problemProposal, problemRevision } from "@/lib/db/schema";
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
    db.select({ n: count() }).from(contribution).where(and(eq(contribution.authorId, userId), eq(contribution.status, "pending"))),
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

/**
 * The comment a reply goes under: a published comment on the same page. A reply to a reply goes under the
 * comment that one answers, so threads stay one level deep. Undefined if there is no such comment.
 */
async function replyParent(parentId: string, on: { problemId: string } | { postId: string }): Promise<string | undefined> {
  const parent = await db.query.comment.findFirst({ where: eq(comment.id, parentId), columns: { id: true, parentId: true, problemId: true, postId: true, status: true } });
  if (!parent || parent.status !== "approved") return undefined;
  const samePage = "problemId" in on ? parent.problemId === on.problemId : parent.postId === on.postId;
  return samePage ? (parent.parentId ?? parent.id) : undefined;
}

const NO_PARENT = "The comment you are replying to is no longer available.";

/** A comment on a problem or on a published blog post, or a reply to one. */
export async function submitComment(_: FormState, formData: FormData): Promise<FormState> {
  const values = readForm(formData);
  const parsed = commentSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);
  const { problemSlug, postSlug, body } = parsed.data;

  if (postSlug) {
    const { user, error } = await guard(values);
    if (error) return error;
    const post = await getPost(postSlug);
    if (!post) return { status: "error", message: "This blog post does not exist.", values };
    const citeError = citeErrors(values, post, { body });
    if (citeError) return citeError;
    const parentId = parsed.data.parentId ? await replyParent(parsed.data.parentId, { postId: post.id }) : null;
    if (parentId === undefined) return { status: "error", message: NO_PARENT, values };
    return save(values, () => db.insert(comment).values({ body, postId: post.id, parentId, authorId: user.id }));
  }

  const { user, problem, error } = await guardProblem(values, problemSlug ?? "");
  if (error) return error;
  const citeError = citeErrors(values, problem, { body });
  if (citeError) return citeError;
  const parentId = parsed.data.parentId ? await replyParent(parsed.data.parentId, { problemId: problem.id }) : null;
  if (parentId === undefined) return { status: "error", message: NO_PARENT, values };
  return save(values, () => db.insert(comment).values({ body, problemId: problem.id, parentId, authorId: user.id }));
}

export async function submitResult(_: FormState, formData: FormData): Promise<FormState> {
  const values = readForm(formData);
  const parsed = resultSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);
  const { user, problem, error } = await guardProblem(values, parsed.data.problemSlug);
  if (error) return error;

  const { kind, title, summary, url, aiUse, credit } = parsed.data;
  const citeError = citeErrors(values, problem, { summary });
  if (citeError) return citeError;
  return save(values, () => db.insert(contribution).values({ kind, title, summary, url, aiUse, credit, problemId: problem.id, authorId: user.id }));
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
