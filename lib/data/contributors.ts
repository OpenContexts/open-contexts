// Everyone who contributed to a problem, each person once with what they did: posed or proposed it, edited its
// text, or added a result or reference. Built from what is stored anyway, by the names credited publicly.
// Comments are discussion, not contributions; moderators appear only where they are credited by name.
import "server-only";
import { and, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { creditNames } from "@/lib/cite";
import { CONTRIBUTION_KIND_LABELS, type ContributionKind } from "@/lib/constants";
import { communityTag, getApprovedContributions } from "@/lib/data/community";
import { getVersions, type VersionSummary } from "@/lib/data/permalinks";
import { getProblemById, type Problem } from "@/lib/data/problems";
import { db, isDbConfigured } from "@/lib/db";
import { problemProposal } from "@/lib/db/schema";

/** One thing a person did for the problem. */
export type Role =
  | { kind: "posed"; date: Date }
  | { kind: "proposed"; date: Date }
  | { kind: "edit"; date: Date; version: number; key: string; summary: string | null }
  | { kind: "result"; date: Date; contributionKind: ContributionKind; title: string; key?: string }
  | { kind: "reference"; date: Date; title: string; url: string | null };

export type Contributor = { name: string; roles: Role[]; first: Date; last: Date };

type Contribution = Awaited<ReturnType<typeof getApprovedContributions>>[number];

/** "Jane Doe (ETH Zürich)" → "Jane Doe": the affiliation is not part of who someone is. */
const bareName = (name: string) => name.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();

/** Names that differ only in case, accents, spacing or dots are one person: "J. Doé" and "j doe". */
const personKey = (name: string) =>
  bareName(name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\./g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/** "1976" or "1976-11" (when the problem was posed) as the first day it can mean. */
const partialDate = (date: string) => new Date(date.length === 4 ? `${date}-01-01` : date.length === 7 ? `${date}-01` : date);

/**
 * The contributors to a problem, in the order they first contributed. `proposer`: the account name of whoever
 * proposed it on the site, if it came from a proposal.
 */
export function contributorsOf({
  problem,
  contributions,
  versions,
  proposer,
}: {
  problem: Pick<Problem, "posedBy" | "posed">;
  contributions: Contribution[];
  versions: VersionSummary[];
  proposer?: { name: string; date: Date };
}): Contributor[] {
  const people = new Map<string, Contributor>();
  const add = (names: string[], role: Role) => {
    for (const name of names) {
      const key = personKey(name);
      if (!key) continue;
      const person = people.get(key) ?? { name: bareName(name), roles: [], first: role.date, last: role.date };
      person.roles.push(role);
      if (role.date < person.first) person.first = role.date;
      if (role.date > person.last) person.last = role.date;
      people.set(key, person);
    }
  };

  add(problem.posedBy, { kind: "posed", date: partialDate(problem.posed) });
  if (proposer) add([proposer.name], { kind: "proposed", date: proposer.date });
  // The first version is the problem as posed; the later ones are edits, credited unless the editors made them.
  for (const v of versions) {
    if (v.version > 1 && v.credit) add(creditNames(v.credit), { kind: "edit", date: v.created, version: v.version, key: v.key, summary: v.changeSummary });
  }
  for (const c of contributions) {
    const date = c.reviewedAt ?? c.createdAt;
    const role: Role = c.kind === "reference" ? { kind: "reference", date, title: c.title, url: c.url } : { kind: "result", date, contributionKind: c.kind, title: c.title, key: c.key };
    add(creditNames(c.credit), role);
  }

  for (const person of people.values()) person.roles.sort((a, b) => a.date.getTime() - b.date.getTime());
  return [...people.values()].sort((a, b) => a.first.getTime() - b.first.getTime() || a.name.localeCompare(b.name));
}

/** Those who did more than pose the problem (named next to it already), most recently active first. */
export function activeContributors(contributors: Contributor[]): Contributor[] {
  return contributors.filter((c) => c.roles.some((r) => r.kind !== "posed")).toSorted((a, b) => b.last.getTime() - a.last.getTime());
}

/** The account name of whoever proposed the problem on the site, and when it was accepted; none for problems added by the editors. */
export async function getProposer(problemId: string): Promise<{ name: string; date: Date } | undefined> {
  const row = await db.query.problemProposal.findFirst({
    where: and(eq(problemProposal.problemId, problemId), eq(problemProposal.status, "approved")),
    columns: { reviewedAt: true, createdAt: true },
    with: { author: { columns: { name: true } } },
  });
  return row?.author ? { name: row.author.name, date: row.reviewedAt ?? row.createdAt } : undefined;
}

/** contributorsOf for one problem, cached like its page: until the problem or what users added to it changes. */
export async function getContributors(problemId: string): Promise<Contributor[]> {
  "use cache";
  cacheLife("max");
  cacheTag(communityTag(problemId), "community");
  if (!isDbConfigured()) return [];
  const [problem, contributions, versions, proposer] = await Promise.all([getProblemById(problemId), getApprovedContributions(problemId), getVersions(problemId), getProposer(problemId)]);
  return problem ? contributorsOf({ problem, contributions, versions, proposer }) : [];
}

/** What a role was, in words, for plain-text copies such as the Markdown download. */
export function roleText(role: Role): string {
  switch (role.kind) {
    case "posed":
      return "Posed the problem";
    case "proposed":
      return "Proposed it for the site";
    case "edit":
      return `Edited the text: version ${role.version} (${role.key})${role.summary ? `, ${role.summary}` : ""}`;
    case "result":
      return `${CONTRIBUTION_KIND_LABELS[role.contributionKind].replace(/^./, (c) => c.toUpperCase())}: ${role.title}${role.key ? ` (${role.key})` : ""}`;
    case "reference":
      return `Suggested a reference: ${role.title}`;
    default:
      throw new Error(`Unknown role: ${role satisfies never}`);
  }
}
