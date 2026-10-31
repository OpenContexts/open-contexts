// Validation for the admin problem editor (app/admin/problems).
import { z } from "zod";
import { AREA_IDS } from "@/lib/areas";
import { HISTORY_KINDS, type HistoryKind, PROBLEM_STATUSES, type ProblemStatus } from "@/lib/constants";
import type { HistoryEntry, Reference } from "@/lib/db/schema";
import { commaList, referenceLines, text } from "./fields";

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
    "areas[]": z.array(z.enum(AREA_IDS)).min(1, "Please choose at least one area."),
    posed: z.string().trim().regex(PARTIAL_DATE, "Please enter a year, or a date like 1976-11 or 1976-11-15."),
    posedBy: commaList,
    tags: commaList,
    statement: text(10, 10_000, "the statement"),
    body: text(0, 100_000, "the text"),
    references: referenceLines,
    ...historyRows,
    /** Edits only: added to the history as an `edit` entry. */
    changeSummary: z.string().trim().max(1_000).optional(),
  })
  .transform(({ "historyDate[]": dates, "historyKind[]": kinds, "historyText[]": texts, "historyStatus[]": statuses, ...rest }, ctx) => {
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
    return { ...rest, history };
  });

export type ProblemInput = z.infer<typeof problemSchema>;

/** The inverse of `referenceLines`, to fill the textarea. */
export const referencesToText = (refs: Reference[]) => refs.map((r) => (r.url ? `${r.text} ${r.url}` : r.text)).join("\n");

