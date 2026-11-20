// Validation for everything users submit. The server actions are the only callers;
// the forms show the resulting field errors.
import { z } from "zod";
import { AGENDA_IDS } from "@/lib/agenda";
import { AI_USE, RESULT_SUMMARY_MAX } from "@/lib/constants";
import { citeIssues, commaList, optionalUrl, referenceRows, slug, text, toReferences } from "./fields";

/**
 * On a problem (`problemSlug`), a blog post (`postSlug`) or a contribution (`contributionKey`, "12.3"); a reply
 * also names the comment it answers.
 */
export const commentSchema = z
  .object({
    problemSlug: slug.optional(),
    postSlug: slug.optional(),
    contributionKey: slug.optional(),
    parentId: z.uuid().optional(),
    body: text(2, 10_000, "a comment"),
  })
  .refine((c) => [c.problemSlug, c.postSlug, c.contributionKey].filter(Boolean).length === 1, {
    message: "A comment belongs to one problem, blog post or contribution.",
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
  summary: text(20, RESULT_SUMMARY_MAX, "a summary"),
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
  credit: text(2, 500, "the names to credit"),
  aiUse: z.enum(AI_USE, { error: "Please say how much AI was used." }),
});

export const postSchema = z
  .object({
    title: text(3, 200, "a title"),
    authors: commaList.pipe(z.array(z.string()).min(1, "Please name at least one author.")),
    body: text(100, 100_000, "the text"),
    ...referenceRows,
  })
  .transform(({ "referenceText[]": texts, "referenceUrl[]": urls, "referenceKey[]": keys, ...rest }, ctx) => {
    const { references, errors } = toReferences(texts, urls, keys);
    if (errors.length) ctx.issues.push({ code: "custom", path: ["references"], message: errors.join(" "), input: texts });
    else citeIssues(ctx, { body: rest.body }, references);
    return { ...rest, references };
  });

export const proposalSchema = z
  .object({
  title: text(3, 200, "a title"),
  statement: text(40, 10_000, "the statement"),
  body: text(100, 50_000, "the background"),
  "agenda[]": z.array(z.enum(AGENDA_IDS)).min(1, "Please choose at least one agenda item."),
  tags: commaList,
  posedBy: commaList.pipe(z.array(z.string()).min(1, "Please name at least one person.")),
  ...referenceRows,
  aiUse: z.enum(AI_USE, { error: "Please say how much AI was used." }),
  })
  .transform(({ "referenceText[]": texts, "referenceUrl[]": urls, "referenceKey[]": keys, ...rest }, ctx) => {
    const { references, errors } = toReferences(texts, urls, keys);
    if (errors.length) ctx.issues.push({ code: "custom", path: ["references"], message: errors.join(" "), input: texts });
    // Only when the references themselves are fine: otherwise a citation may just point at the row in error.
    else citeIssues(ctx, { statement: rest.statement, body: rest.body }, references);
    return { ...rest, references };
  });
