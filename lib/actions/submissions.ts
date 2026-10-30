"use server";

// Every user submission enters the database as `pending`. Nothing here publishes anything;
// moderators do that in app/admin.
import { and, count, eq } from "drizzle-orm";
import { type CurrentUser, getCurrentUser } from "@/lib/auth/session";
import { getProblem, type Problem, readProblem } from "@/lib/data/problems";
import { db } from "@/lib/db";
import { comment, contribution, problemLink, problemProposal, problemRevision } from "@/lib/db/schema";
import {
  commentSchema,
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
    db.select({ n: count() }).from(problemLink).where(and(eq(problemLink.proposedById, userId), eq(problemLink.status, "pending"))),
    db.select({ n: count() }).from(problemRevision).where(and(eq(problemRevision.authorId, userId), eq(problemRevision.status, "pending"))),
    db.select({ n: count() }).from(problemProposal).where(and(eq(problemProposal.authorId, userId), eq(problemProposal.status, "pending"))),
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

export async function submitComment(_: FormState, formData: FormData): Promise<FormState> {
  const values = readForm(formData);
  const parsed = commentSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);
  const { user, problem, error } = await guardProblem(values, parsed.data.problemSlug);
  if (error) return error;

  return save(values, () => db.insert(comment).values({ body: parsed.data.body, problemId: problem.id, authorId: user.id }));
}

export async function submitResult(_: FormState, formData: FormData): Promise<FormState> {
  const values = readForm(formData);
  const parsed = resultSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);
  const { user, problem, error } = await guardProblem(values, parsed.data.problemSlug);
  if (error) return error;

  const { kind, title, summary, url, aiUse, credit } = parsed.data;
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
  const { title, statement, body, changeSummary, baseVersion } = parsed.data;
  if (title === current.title && statement === current.statement.trim() && body === current.body.trim()) {
    return { status: "error", message: "You have not changed anything yet.", values };
  }
  return save(values, () =>
    db.insert(problemRevision).values({ problemId: problem.id, baseVersion, title, statement, body, changeSummary, authorId: user.id }),
  );
}

export async function submitProposal(_: FormState, formData: FormData): Promise<FormState> {
  const values = readForm(formData);
  const parsed = proposalSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);
  const { user, error } = await guard(values);
  if (error) return error;

  const { "areas[]": areas, ...rest } = parsed.data;
  return save(values, () => db.insert(problemProposal).values({ ...rest, areas, authorId: user.id }));
}
