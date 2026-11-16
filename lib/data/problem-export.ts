// A problem with everything recorded about it (statement, text, references, history, approved contributions
// and discussion) as one self-contained document, for AI agents and other programs. Served as Markdown and
// as JSON by app/(site)/problems/[slug]/problem.{md,json}. Only public data: approved submissions, no emails.
import "server-only";
import matter from "gray-matter";
import { cacheLife, cacheTag } from "next/cache";
import { getAgendaItem } from "@/lib/agenda";
import { siteOrigin } from "@/lib/cite";
import {
  AI_USE_LABELS,
  type AiUse,
  CONTRIBUTION_KIND_LABELS,
  type ContributionKind,
  type HistoryKind,
  PROBLEM_STATUS_LABELS,
  type ProblemStatus,
} from "@/lib/constants";
import { communityTag, getApprovedComments, getApprovedContributions } from "@/lib/data/community";
import { getProblem, type Reference, statusSince } from "@/lib/data/problems";
import { getVersions } from "@/lib/data/permalinks";
import { permalinkPath, problemKey, versionKey } from "@/lib/permalinks";
import { formatDate, formatNames } from "@/lib/format";
import { citesToText } from "@/lib/references";
import { SITE } from "@/lib/site";

export type ProblemExport = {
  source: { name: string; title: string; url: string; guidelines: string; license: string };
  problem: {
    number: number;
    title: string;
    slug: string;
    url: string;
    /** The problem's permanent link, which keeps working if `url` changes. */
    permalink: string;
    status: ProblemStatus;
    statusSince: string;
    posedBy: string[];
    posed: string;
    /** False for a candidate problem: accepted, but not (yet) in the published list. */
    published: boolean;
    listed: string;
    updated: string;
    /** The current version of the text (see /problems/<slug>/versions), and its permanent link. */
    version: number;
    versionPermalink: string;
    agenda: { id: string; numeral: string; title: string; summary: string }[];
    tags: string[];
    /** Markdown with $…$ math, as everywhere below. \cite{key} cites the reference with that `key`. */
    statement: string;
    /** Markdown with `##` sections: Background, Relevance, Significance, … */
    body: string;
    note: string | null;
    references: Reference[];
    history: { date: string; kind: HistoryKind; status: ProblemStatus | null; text: string }[];
  };
  /** Oldest first. */
  contributions: {
    date: string;
    kind: ContributionKind;
    kindLabel: string;
    title: string;
    summary: string;
    url: string | null;
    /** The contribution's permanent link; null for kinds that get none (references). */
    permalink: string | null;
    credit: string;
    aiUse: AiUse;
    aiUseLabel: string;
  }[];
  /** Oldest first. */
  comments: { date: string; author: string; body: string }[];
};

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** Cached like the problem page: until the problem or what users added to it changes. */
export async function getProblemExport(slug: string): Promise<ProblemExport | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("community");

  const p = await getProblem(slug);
  if (!p) return undefined;
  cacheTag(communityTag(p.id));
  // The versions change only together with the problem, whose "problems" tag getProblem gives this entry.
  const [contributions, comments, versions] = await Promise.all([getApprovedContributions(p.id), getApprovedComments("problem", p.id), getVersions(p.id)]);
  const version = versions.at(-1)?.version ?? 1;
  const origin = siteOrigin();

  return {
    source: {
      name: SITE.name,
      title: `${SITE.name}: ${SITE.subtitle}`,
      url: origin,
      guidelines: `${origin}/guidelines`,
      license: "CC BY 4.0, unless the entry says otherwise",
    },
    problem: {
      number: p.number,
      title: p.title,
      slug: p.slug,
      url: `${origin}/problems/${p.slug}`,
      permalink: `${origin}${permalinkPath(problemKey(p.number))}`,
      status: p.status,
      statusSince: statusSince(p),
      posedBy: p.posedBy,
      posed: p.posed,
      published: p.published,
      listed: p.listed,
      updated: p.updated,
      version,
      versionPermalink: `${origin}${permalinkPath(versionKey(p.number, version))}`,
      agenda: p.agenda
        .map(getAgendaItem)
        .filter((a) => a !== undefined)
        .map(({ id, numeral, title, summary }) => ({ id, numeral, title, summary })),
      tags: p.tags,
      statement: p.statement.trim(),
      body: p.body.trim(),
      note: p.note.trim() || null,
      references: p.references,
      history: p.history
        .toSorted((a, b) => a.date.localeCompare(b.date))
        .map((h) => ({ date: h.date, kind: h.kind, status: h.status ?? null, text: h.text })),
    },
    // The queries return newest first; a document reads better in the order things happened.
    contributions: contributions.toReversed().map((c) => ({
      date: isoDate(c.createdAt),
      kind: c.kind,
      kindLabel: CONTRIBUTION_KIND_LABELS[c.kind],
      title: c.title,
      summary: c.summary.trim(),
      url: c.url,
      permalink: c.key ? `${origin}${permalinkPath(c.key)}` : null,
      credit: c.credit,
      aiUse: c.aiUse,
      aiUseLabel: AI_USE_LABELS[c.aiUse],
    })),
    comments: comments.toReversed().map((c) => ({ date: isoDate(c.createdAt), author: c.author.name, body: c.body.trim() })),
  };
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function historyLabel(h: ProblemExport["problem"]["history"][number]): string {
  if (h.kind === "status") return h.status ? `Status: ${PROBLEM_STATUS_LABELS[h.status]}` : "Status";
  return capitalize(h.kind);
}

/**
 * The export as one Markdown document: YAML frontmatter with the facts, then the problem as on its page,
 * then everything recorded about it, a citation and the rules a solution has to meet.
 */
export function problemExportToMarkdown({ source, problem: p, contributions, comments }: ProblemExport, bibtex: string): string {
  const parts: string[] = [];
  // Citations as the numbers of the reference list below: \cite{key} → [n].
  const cite = (text: string) => citesToText(text, p.references);
  const add = (...lines: string[]) => parts.push(lines.join("\n"));

  add(`# Problem ${p.number}: ${p.title}`);
  add(
    `From [${source.title}](${p.url}).`,
    "",
    `- **Status:** ${PROBLEM_STATUS_LABELS[p.status]} since ${formatDate(p.statusSince)}`,
    `- **Posed${p.posedBy.length ? " by" : ""}:** ${p.posedBy.length ? `${formatNames(p.posedBy)}, ` : ""}${formatDate(p.posed)}`,
    `- **Last updated:** ${formatDate(p.updated)}`,
    ...(p.published ? [] : [`- **Candidate problem:** accepted by the moderators, but not yet part of the published list.`]),
    ...(p.agenda.length ? [`- **Research agenda:** ${p.agenda.map((a) => `${a.numeral}. ${a.title}`).join("; ")}`] : []),
    ...(p.tags.length ? [`- **Tags:** ${p.tags.join(", ")}`] : []),
  );

  add("## Statement", "", cite(p.statement));
  if (p.body) add(cite(p.body));
  if (p.note) add("## Note", "", cite(p.note));

  if (p.agenda.length) {
    add("## Research agenda", "", "The long-term goals of the research agenda that this problem traces to.");
    for (const a of p.agenda) add(`### ${a.numeral}. ${a.title}`, "", a.summary);
  }

  add("## References", "", p.references.length ? p.references.map((r, i) => `${i + 1}. ${r.url ? `[${r.text}](${r.url})` : r.text}`).join("\n") : "None recorded.");

  add(
    "## Progress and history",
    "",
    p.history.length ? p.history.map((h) => `- ${formatDate(h.date)}, ${historyLabel(h)}: ${cite(h.text)}`).join("\n") : "No entries yet.",
  );

  add("## Contributions", "", contributions.length ? "Material submitted by researchers and approved by the moderators, oldest first." : "No contributions recorded yet.");
  contributions.forEach((c, i) => {
    add(
      `### ${i + 1}. ${capitalize(c.kindLabel)}: ${c.title}`,
      "",
      `- **Date:** ${formatDate(c.date)}`,
      `- **Credit:** ${c.credit}`,
      `- **AI use:** ${c.aiUseLabel}`,
      ...(c.url ? [`- **Link:** ${c.url}`] : []),
      ...(c.permalink ? [`- **Permanent link:** ${c.permalink}`] : []),
      "",
      cite(c.summary),
    );
  });

  add("## Discussion", "", comments.length ? "Comments approved by the moderators, oldest first." : "No comments yet.");
  for (const c of comments) add(`### ${c.author}, ${formatDate(c.date)}`, "", cite(c.body));

  add("## How to cite", "", "```bibtex", bibtex, "```");

  add(
    "## Working on this problem",
    "",
    `- A solution must resolve the problem **as stated**, by the criterion fixed in the statement. A proof of a weakened or modified statement is a partial result, not a solution.`,
    `- Check the contributions above before starting, so as not to repeat existing work.`,
    `- Submit results at ${p.url}, with the extent of AI use and the names of the humans who take responsibility for them. AI-generated material counts as progress only after human scrutiny.`,
    `- Cite the problem and the people who posed it. The full rules: ${source.guidelines}`,
  );

  // lineWidth -1: one line per value, as in the moderators' export (problemToMarkdown).
  const yaml = { lineWidth: -1 } as matter.GrayMatterOption<string, never>;
  return matter.stringify(`\n${parts.join("\n\n")}\n`, {
    source: source.title,
    url: p.url,
    number: p.number,
    title: p.title,
    status: p.status,
    statusSince: p.statusSince,
    published: p.published,
    posedBy: p.posedBy,
    posed: p.posed,
    updated: p.updated,
    agenda: p.agenda.map((a) => a.id),
    tags: p.tags,
    contributions: contributions.length,
    comments: comments.length,
    license: source.license,
  }, yaml);
}
