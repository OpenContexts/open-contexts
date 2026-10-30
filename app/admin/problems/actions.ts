"use server";

import { eq, sql } from "drizzle-orm";
import matter from "gray-matter";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ProblemFormValues } from "@/components/admin/problem-form";
import { type FormState, invalid, readForm } from "@/lib/actions/form-state";
import { AREA_IDS, type AreaId } from "@/lib/areas";
import { requireModerator } from "@/lib/auth/session";
import { HISTORY_KINDS, type HistoryKind, PROBLEM_STATUSES, type ProblemStatus } from "@/lib/constants";
import { db } from "@/lib/db";
import { type HistoryEntry, moderationLog, problem } from "@/lib/db/schema";
import { changeEntries, nextProblemNumber, slugify, uniqueSlug } from "@/lib/data/problem-writes";
import { problemLabel, readProblem } from "@/lib/data/problems";
import { type ProblemInput, problemSchema, referencesToText } from "@/lib/validation/problems";

/** The stored columns that the editor changes. Number and URL name are set once, when a problem is created. */
function fields(i: ProblemInput) {
  const { title, status, posed, posedBy, tags, statement, body, references, history } = i;
  return { title, status, areas: i["areas[]"], posed, posedBy, tags, statement, body, references, history };
}

export async function createProblem(_: FormState, formData: FormData): Promise<FormState> {
  const moderator = await requireModerator();
  const values = readForm(formData);
  const parsed = problemSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);

  const input = parsed.data;
  const id = crypto.randomUUID();
  const number = await nextProblemNumber();
  const slug = await uniqueSlug(input.slug ?? slugify(input.title));
  try {
    await db.batch([
      db.insert(problem).values({ ...fields(input), id, number, slug, createdById: moderator.id }),
      db.insert(moderationLog).values({ targetType: "problem", targetId: id, action: "create", moderatorId: moderator.id, note: problemLabel({ number, title: input.title }) }),
    ]);
  } catch (error) {
    // Most likely someone else published a problem with the same number at the same moment.
    console.error("Creating a problem failed", error);
    return { status: "error", message: "The problem could not be saved. Please try again.", values };
  }
  updateTag("problems");
  redirect(`/admin/problems/${id}?saved=created`);
}

const updateSchema = z.object({ id: z.uuid(), version: z.coerce.number().int() });

export async function updateProblem(_: FormState, formData: FormData): Promise<FormState> {
  const moderator = await requireModerator();
  const values = readForm(formData);
  const { id, version } = updateSchema.parse(values);
  const parsed = problemSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error, values);

  const current = await readProblem(id);
  if (!current) return { status: "error", message: "This problem has been deleted in the meantime.", values };
  // Someone else saved (or an edit was approved) since this form was opened: don't overwrite it unseen.
  if (current.version !== version) {
    return { status: "error", message: "This problem was changed by someone else while you were editing. Copy your changes, reload the page and apply them again.", values };
  }

  const input = parsed.data;
  const history = [...input.history, ...changeEntries({ summary: input.changeSummary, from: current.status, to: input.status })];
  await db.batch([
    db
      .update(problem)
      .set({ ...fields(input), history, version: sql`${problem.version} + 1`, updatedAt: new Date() })
      .where(eq(problem.id, id)),
    db.insert(moderationLog).values({ targetType: "problem", targetId: id, action: "update", moderatorId: moderator.id, note: input.changeSummary || problemLabel(current) }),
  ]);
  updateTag("problems");
  redirect(`/admin/problems/${id}?saved=updated`);
}

/** Deletes the problem and, through the foreign keys, its comments, results, links and suggested edits. */
export async function deleteProblem(id: string): Promise<{ error?: string }> {
  const moderator = await requireModerator();
  const current = await readProblem(z.uuid().parse(id));
  if (!current) return { error: "This problem has already been deleted." };
  await db.batch([
    db.delete(problem).where(eq(problem.id, id)),
    db.insert(moderationLog).values({ targetType: "problem", targetId: id, action: "delete", moderatorId: moderator.id, note: problemLabel(current) }),
  ]);
  updateTag("problems");
  redirect("/admin/problems?deleted=1");
}

/** YAML turns 1976 into a number and 1976-11-15 into a Date. */
const dateText = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : v == null ? "" : String(v));
const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : typeof v === "string" ? v.split(",").map((s) => s.trim()) : []).filter(Boolean);

/**
 * Reads a problem file (the format of "Download .md") into the new-problem form, so it can be
 * checked before publishing. Lenient on purpose: anything missing or invalid is left for the form to flag.
 */
export async function parseProblemFile(file: { name: string; text: string }): Promise<{ values?: ProblemFormValues; error?: string }> {
  await requireModerator();
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(file.text);
  } catch {
    return { error: "The file's frontmatter (the part between the --- lines) is not valid YAML." };
  }
  const data = parsed.data as Record<string, unknown>;
  if (!data.title && !data.statement && !parsed.content.trim()) return { error: "This does not look like a problem file: it has no title, statement or text." };

  const history: HistoryEntry[] = (Array.isArray(data.history) ? data.history : []).map((h: Record<string, unknown>) => ({
    date: dateText(h.date),
    kind: (HISTORY_KINDS.includes(h.kind as HistoryKind) ? h.kind : "note") as HistoryKind,
    text: String(h.text ?? ""),
    ...(PROBLEM_STATUSES.includes(h.status as ProblemStatus) && { status: h.status as ProblemStatus }),
  }));
  const references = (Array.isArray(data.references) ? data.references : []).map((r: Record<string, unknown> | string) =>
    typeof r === "string" ? { text: r } : { text: String(r.text ?? ""), ...(typeof r.url === "string" && { url: r.url }) },
  );

  return {
    values: {
      title: String(data.title ?? ""),
      slug: typeof data.slug === "string" ? data.slug : file.name.replace(/\.(md|markdown)$/i, ""),
      status: PROBLEM_STATUSES.includes(data.status as ProblemStatus) ? (data.status as ProblemStatus) : "open",
      areas: list(data.areas).filter((a): a is AreaId => AREA_IDS.includes(a as AreaId)),
      posed: dateText(data.posed),
      posedBy: list(data.posedBy).join(", "),
      tags: list(data.tags).join(", "),
      statement: String(data.statement ?? "").trim(),
      body: parsed.content.trim(),
      references: referencesToText(references),
      history,
    },
  };
}
