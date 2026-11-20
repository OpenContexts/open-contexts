// What a moderator changed in the problem editor, compared with the problem as it is saved: for the dialog that
// asks what the save needs (SaveDialog). Mirrors what updateProblem does with a change: the title, statement, text
// and references make up a version of the problem; the note is content but no part of it; the rest are details.
import { diffChars } from "diff";
import type { ProblemStatus } from "@/lib/constants";
import type { HistoryEntry, Reference } from "@/lib/db/schema";

/** Up to this many characters changed in all, a change starts out as minor: a typo or a broken link. */
export const MINOR_CHARS = 40;

/** Diffs are given up beyond this many edits: the change is large then, whatever its exact size. */
const MAX_EDITS = 1_000;

export type ProblemChanges = {
  /** Characters changed per part of the version, 0 for unchanged; MAX_EDITS for "at least that many". */
  title: number;
  statement: number;
  body: number;
  references: number;
  note: number;
  status?: { from: ProblemStatus; to: ProblemStatus };
  /** Agenda, posed, posed by, tags. */
  details: boolean;
  history: boolean;
};

/** The original values the form started from (ProblemFormValues), as far as they are compared. */
export type Original = {
  title: string;
  statement: string;
  body: string;
  note: string;
  status: ProblemStatus;
  agenda: string[];
  posed: string;
  posedBy: string;
  tags: string;
  references: Reference[];
  history: HistoryEntry[];
};

/** How many characters were added or removed between the two texts, ignoring space at either end. */
function changedChars(before: string, after: string): number {
  const a = before.trim();
  const b = after.trim();
  if (a === b) return 0;
  const parts = diffChars(a, b, { maxEditLength: MAX_EDITS });
  if (!parts) return MAX_EDITS;
  return parts.reduce((n, p) => (p.added || p.removed ? n + p.value.length : n), 0);
}

const all = (form: FormData, name: string) => form.getAll(name).map(String);

/** The references as text, one line each, for counting what changed in them. */
const referenceLines = (rows: { key?: string; text: string; url?: string }[]) => rows.map((r) => [r.key ?? "", r.text.trim(), r.url?.trim() ?? ""].join(" ")).join("\n");

const historyKey = (rows: string[][]) => JSON.stringify(rows);

export function changesOf(form: FormData, original: Original): ProblemChanges {
  const text = (name: string) => String(form.get(name) ?? "");
  const texts = all(form, "referenceText[]");
  const urls = all(form, "referenceUrl[]");
  const keys = all(form, "referenceKey[]");
  // Rows without a text are dropped on saving, as in the validation.
  const references = texts.map((t, i) => ({ key: keys[i], text: t, url: urls[i] })).filter((r) => r.text.trim());
  const dates = all(form, "historyDate[]");
  const history = dates.map((date, i) => [
    date.trim(),
    all(form, "historyKind[]")[i] ?? "",
    (all(form, "historyText[]")[i] ?? "").trim(),
    all(form, "historyStatus[]")[i] ?? "",
    all(form, "historyVersion[]")[i] ?? "",
    all(form, "historyContribution[]")[i] ?? "",
  ]);
  // In date order, as the editor lists them (HistoryField): an order that only that changes is no change.
  const originalHistory = original.history.toSorted((a, b) => a.date.localeCompare(b.date)).map((h) => [h.date, h.kind, h.text.trim(), h.status ?? "", h.version ? String(h.version) : "", h.contribution ?? ""]);
  const status = text("status") as ProblemStatus;
  const sorted = (list: string[]) => list.toSorted().join(",");
  return {
    title: changedChars(original.title, text("title")),
    statement: changedChars(original.statement, text("statement")),
    body: changedChars(original.body, text("body")),
    references: changedChars(referenceLines(original.references), referenceLines(references)),
    note: changedChars(original.note, text("note")),
    status: status && status !== original.status ? { from: original.status, to: status } : undefined,
    details:
      sorted(all(form, "agenda[]")) !== sorted(original.agenda) ||
      text("posed").trim() !== original.posed.trim() ||
      text("posedBy").trim() !== original.posedBy.trim() ||
      text("tags").trim() !== original.tags.trim(),
    history: historyKey(history) !== historyKey(originalHistory),
  };
}

/** Whether the change touches the problem's version: its title, statement, text or references. */
export const versionTouched = (c: ProblemChanges) => c.title + c.statement + c.body + c.references > 0;

/** Characters changed in the content: the version and the note. */
export const contentChars = (c: ProblemChanges) => c.title + c.statement + c.body + c.references + c.note;

export const nothingChanged = (c: ProblemChanges) => contentChars(c) === 0 && !c.status && !c.details && !c.history;
