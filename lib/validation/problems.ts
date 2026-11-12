// Validation for the admin problem editor (app/admin/problems).
import { z } from "zod";
import { AGENDA_IDS } from "@/lib/agenda";
import { HISTORY_KINDS, type HistoryKind, PROBLEM_STATUSES, type ProblemStatus } from "@/lib/constants";
import type { HistoryEntry } from "@/lib/db/schema";
import { citeIssues, commaList, referenceRows, text, toReferences } from "./fields";

const PARTIAL_DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/;

/** The history rows of the editor, one array per column (see HistoryField). */
const historyRows = {
  "historyDate[]": z.array(z.string().trim()).default([]),
  "historyKind[]": z.array(z.string()).default([]),
  "historyText[]": z.array(z.string().trim()).default([]),
  "historyStatus[]": z.array(z.string()).default([]),
};

export const problemSchema = z
  .object({
    title: text(3, 200, "a title"),
    /** New problems only: a preferred URL name, e.g. from an imported file. Made unique if taken. */
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .optional()
      .transform((v) => (v && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) ? v.slice(0, 80) : undefined)),
    status: z.enum(PROBLEM_STATUSES),
    "agenda[]": z.array(z.enum(AGENDA_IDS)).min(1, "Please choose at least one agenda item."),
    posed: z.string().trim().regex(PARTIAL_DATE, "Please enter a year, or a date like 1976-11 or 1976-11-15."),
    posedBy: commaList,
    tags: commaList,
    statement: text(10, 10_000, "the statement"),
    body: text(0, 100_000, "the text"),
    ...referenceRows,
    note: text(0, 10_000, "the note"),
    ...historyRows,
    /** New problems only: the checkbox to publish it in the list right away instead of as a candidate. */
    publish: z
      .string()
      .optional()
      .transform((v) => v === "on"),
    /** Edits only: added to the history as an `edit` entry. */
    changeSummary: z.string().trim().max(1_000).optional(),
  })
  .transform(({ "historyDate[]": dates, "historyKind[]": kinds, "historyText[]": texts, "historyStatus[]": statuses, "referenceText[]": refTexts, "referenceUrl[]": refUrls, "referenceKey[]": refKeys, ...rest }, ctx) => {
    const history: HistoryEntry[] = [];
    dates.forEach((date, i) => {
      const kind = kinds[i] as HistoryKind;
      const entryText = texts[i] ?? "";
      const status = statuses[i] as ProblemStatus | "";
      const problem = !PARTIAL_DATE.test(date)
        ? "needs a date like 2019, 2019-07 or 2019-07-04"
        : !HISTORY_KINDS.includes(kind)
          ? "needs a kind"
          : !entryText
            ? "needs a text"
            : null;
      if (problem) ctx.issues.push({ code: "custom", path: ["history"], message: `Entry ${i + 1} ${problem}.`, input: date });
      else history.push({ date, kind, text: entryText, ...(status && PROBLEM_STATUSES.includes(status) && { status }) });
    });
    const { references, errors } = toReferences(refTexts, refUrls, refKeys);
    if (errors.length) ctx.issues.push({ code: "custom", path: ["references"], message: errors.join(" "), input: refTexts });
    else citeIssues(ctx, { statement: rest.statement, body: rest.body, note: rest.note }, references);
    return { ...rest, history, references };
  });

export type ProblemInput = z.infer<typeof problemSchema>;
