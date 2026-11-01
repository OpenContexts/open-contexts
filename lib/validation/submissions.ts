// Validation for everything users submit. The server actions are the only callers;
// the forms show the resulting field errors.
import { z } from "zod";
import { AREA_IDS } from "@/lib/areas";
import { AI_USE } from "@/lib/constants";
import { commaList, optionalUrl, referenceRows, slug, text, toReferences } from "./fields";

export const commentSchema = z.object({
  problemSlug: slug,
  body: text(2, 10_000, "a comment"),
});

/** Kinds offered on the "Submit a result" page: every kind but references, which have their own page. */
const RESULT_KINDS = [
  "claim",
  "partial",
  "negative",
  "evidence",
  "reformulation",
  "decomposition",
  "verification",
  "challenge",
  "exposition",
] as const;

export const resultSchema = z.object({
  problemSlug: slug,
  kind: z.enum(RESULT_KINDS, { error: "Please choose what kind of result this is." }),
  title: text(3, 200, "a title"),
  summary: text(20, 20_000, "a summary"),
  url: optionalUrl,
  aiUse: z.enum(AI_USE, { error: "Please say how much AI was used." }),
  credit: text(2, 500, "the names to credit"),
});

export const referenceSchema = z.object({
  problemSlug: slug,
  title: text(5, 500, "the reference"),
  url: optionalUrl,
  summary: text(10, 5_000, "why it is relevant"),
});

export const revisionSchema = z.object({
  problemSlug: slug,
  /** The problem's version when the form was opened. */
  baseVersion: z.coerce.number().int().min(0),
  title: text(3, 200, "a title"),
  statement: text(20, 10_000, "the statement"),
  body: text(0, 50_000, "the text"),
  changeSummary: text(10, 1_000, "what you changed"),
});

export const proposalSchema = z
  .object({
  title: text(3, 200, "a title"),
  statement: text(40, 10_000, "the statement"),
  body: text(100, 50_000, "the background"),
  "areas[]": z.array(z.enum(AREA_IDS)).min(1, "Please choose at least one area."),
  tags: commaList,
  posedBy: commaList.pipe(z.array(z.string()).min(1, "Please name at least one person.")),
  ...referenceRows,
  aiUse: z.enum(AI_USE, { error: "Please say how much AI was used." }),
  })
  .transform(({ "referenceText[]": texts, "referenceUrl[]": urls, ...rest }, ctx) => {
    const { references, errors } = toReferences(texts, urls);
    if (errors.length) ctx.issues.push({ code: "custom", path: ["references"], message: errors.join(" "), input: texts });
    return { ...rest, references };
  });
