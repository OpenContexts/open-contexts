// Permanent links (lib/permalinks.ts) and problem versions: giving them out, for the code that writes problems,
// contributions and posts, and resolving them, for /contribution/<key>. Callers of the writers check permissions,
// run the returned queries in their own batch and call updateTag(PERMALINKS_TAG) afterwards. The async writers
// return their query wrapped in an object: returning a Drizzle query from an async function would run it.
import "server-only";
import { and, asc, eq, inArray, max, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { cacheLife, cacheTag } from "next/cache";
import { type AiUse, PERMALINK_KINDS, type PermalinkTarget } from "@/lib/constants";
import { BLOG_TAG, getPostById } from "@/lib/data/blog";
import { type Comment, communityTag, getApprovedComments, getVoteTotals, NO_VOTES, type Votes } from "@/lib/data/community";
import { getProblemById, type Problem } from "@/lib/data/problems";
import { db, isDbConfigured } from "@/lib/db";
import { contribution, permalink, problemVersion, type Reference } from "@/lib/db/schema";
import { contributionKey, parsePermalinkKey, postKey, problemKey, versionKey } from "@/lib/permalinks";
import { withKeys } from "@/lib/references";

/** Cache tag for the keys themselves: every new key invalidates it, so a key cached as unknown resolves once given. */
export const PERMALINKS_TAG = "permalinks";

export type Query = BatchItem<"pg">;

/** Runs the queries in one transaction, in order. */
export async function runBatch(queries: Query[]): Promise<void> {
  if (queries.length) await db.batch(queries as [Query, ...Query[]]);
}

// ---------------------------------------------------------------------------------------------------------------
// Giving out keys and versions

/** The key of a new problem, "12". */
export function problemPermalink(problemId: string, number: number): Query {
  return db.insert(permalink).values({ key: problemKey(number), target: "problem", targetId: problemId, problemNumber: number, seq: 0 });
}

async function nextSeq(target: PermalinkTarget, problemNumber?: number): Promise<number> {
  const [row] = await db
    .select({ n: max(permalink.seq) })
    .from(permalink)
    .where(and(eq(permalink.target, target), problemNumber === undefined ? undefined : eq(permalink.problemNumber, problemNumber)));
  return (row?.n ?? 0) + 1;
}

/** The key the target already has, if any. */
async function existingKey(target: PermalinkTarget, targetId: string): Promise<string | undefined> {
  const row = await db.query.permalink.findFirst({ where: and(eq(permalink.target, target), eq(permalink.targetId, targetId)), columns: { key: true } });
  return row?.key;
}

/**
 * The key of an accepted contribution, "12.3", if its kind gets one (PERMALINK_KINDS). On its first acceptance
 * `query` creates it; a contribution that is reopened and accepted again keeps its key. Two acceptances at the
 * same moment can pick the same number; the primary key then fails the second, which can simply be tried again.
 */
export async function contributionPermalink(contributionId: string): Promise<{ key: string; query?: Query } | undefined> {
  const row = await db.query.contribution.findFirst({ where: eq(contribution.id, contributionId), columns: { kind: true }, with: { problem: { columns: { number: true } } } });
  if (!row || !PERMALINK_KINDS.includes(row.kind)) return undefined;
  const existing = await existingKey("contribution", contributionId);
  if (existing) return { key: existing };
  const number = row.problem.number;
  const seq = await nextSeq("contribution", number);
  const key = contributionKey(number, seq);
  return { key, query: db.insert(permalink).values({ key, target: "contribution", targetId: contributionId, problemNumber: number, seq }) };
}

/** The key a blog post gets on its first approval, "blog.7". */
export async function postPermalink(postId: string): Promise<{ query: Query } | undefined> {
  if (await existingKey("post", postId)) return undefined;
  const seq = await nextSeq("post");
  return { query: db.insert(permalink).values({ key: postKey(seq), target: "post", targetId: postId, seq }) };
}

type VersionText = { title: string; statement: string; body: string; references: Reference[] };

/** The number the problem's next version gets: one more than its latest. */
export async function nextVersion(problemId: string): Promise<number> {
  const [row] = await db.select({ n: max(problemVersion.version) }).from(problemVersion).where(eq(problemVersion.problemId, problemId));
  return (row?.n ?? 0) + 1;
}

/**
 * What a new version records about its change: the summary, and who made it (`credit`, `aiUse`; left out for
 * the editors' own changes), and the suggested edit it came from.
 */
export type VersionChange = { changeSummary?: string; credit?: string | null; aiUse?: AiUse | null; revisionId?: string };

/** Starts a version of the problem with the given text: version 1 for a new problem, nextVersion() for an edit. */
export function versionQuery(p: { id: string; number: number }, version: number, text: VersionText, change: VersionChange = {}): Query {
  const { title, statement, body, references } = text;
  return db.insert(problemVersion).values({
    problemId: p.id,
    problemNumber: p.number,
    version,
    title,
    statement,
    body,
    references,
    changeSummary: change.changeSummary || null,
    credit: change.credit || null,
    aiUse: change.aiUse ?? null,
    revisionId: change.revisionId ?? null,
  });
}

/** Writes changes into the problem's latest version instead of starting a new one: minor edits, added references. */
export function amendLatestVersion(problemId: string, text: Partial<VersionText>): Query {
  return db
    .update(problemVersion)
    .set({ ...text, updatedAt: new Date() })
    .where(
      and(
        eq(problemVersion.problemId, problemId),
        eq(problemVersion.version, sql`(select max(pv.version) from ${problemVersion} pv where pv.problem_id = ${problemId})`),
      ),
    );
}

/** Whether a change to the problem touches its version: the title, statement, text or references. */
export function versionChanged(current: VersionText, next: VersionText): boolean {
  const refs = (list: Reference[]) => JSON.stringify(list.map((r) => [r.key ?? "", r.text.trim(), r.url?.trim() ?? ""]));
  return (["title", "statement", "body"] as const).some((f) => current[f].trim() !== next[f].trim()) || refs(current.references) !== refs(next.references);
}

// ---------------------------------------------------------------------------------------------------------------
// Reading keys

/** The keys of the given contributions or posts, by id. Read inside the cached pages that show them. */
export async function getPermalinkKeys(target: PermalinkTarget, ids: string[]): Promise<Map<string, string>> {
  if (!ids.length) return new Map();
  const rows = await db.select({ key: permalink.key, id: permalink.targetId }).from(permalink).where(and(eq(permalink.target, target), inArray(permalink.targetId, ids)));
  return new Map(rows.map((r) => [r.id, r.key]));
}

/** `credit`: who made the change (null: the editors, or the first version); `aiUse`: null where not stated. */
export type VersionSummary = { version: number; key: string; changeSummary: string | null; credit: string | null; aiUse: AiUse | null; created: Date };

/** The problem's versions, oldest first. */
export async function getVersions(problemId: string): Promise<VersionSummary[]> {
  const rows = await db
    .select({
      version: problemVersion.version,
      number: problemVersion.problemNumber,
      changeSummary: problemVersion.changeSummary,
      credit: problemVersion.credit,
      aiUse: problemVersion.aiUse,
      created: problemVersion.createdAt,
    })
    .from(problemVersion)
    .where(eq(problemVersion.problemId, problemId))
    .orderBy(asc(problemVersion.version));
  return rows.map(({ number, ...r }) => ({ ...r, key: versionKey(number, r.version) }));
}

/** getVersions, cached for the versions page: versions only change together with the problem ("problems"). */
export async function getCachedVersions(problemId: string): Promise<VersionSummary[]> {
  "use cache";
  cacheLife("max");
  cacheTag("problems");
  return isDbConfigured() ? getVersions(problemId) : [];
}

/** The key of a blog post, read inside its cached page. */
export async function getPostKey(postId: string): Promise<string | undefined> {
  return (await getPermalinkKeys("post", [postId])).get(postId);
}

// ---------------------------------------------------------------------------------------------------------------
// Resolving keys

export type ResolvedContribution = {
  key: string;
  id: string;
  kind: (typeof contribution.$inferSelect)["kind"];
  title: string;
  summary: string;
  url: string | null;
  aiUse: (typeof contribution.$inferSelect)["aiUse"];
  credit: string;
  submitted: Date;
  /** When it was accepted; the date it is cited by. */
  accepted: Date;
  votes: Votes;
  /** Its discussion, newest first. */
  comments: Comment[];
};

export type ResolvedVersion = {
  key: string;
  version: number;
  title: string;
  statement: string;
  body: string;
  references: (Reference & { key: string })[];
  changeSummary: string | null;
  credit: string | null;
  aiUse: AiUse | null;
  created: Date;
  updated: Date;
};

export type Resolved =
  | { type: "redirect"; href: string }
  | { type: "contribution"; contribution: ResolvedContribution; problem: Problem }
  | { type: "version"; version: ResolvedVersion; versions: VersionSummary[]; problem: Problem }
  /** The key was given, but what it pointed to was withdrawn or removed. */
  | { type: "gone"; key: string };

/**
 * What a key points to; undefined for a key that was never given. Cached until the key list, the problems, the
 * blog posts or the contributions on the problem change.
 */
export async function resolvePermalink(key: string): Promise<Resolved | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag(PERMALINKS_TAG, "problems", BLOG_TAG, "community");
  const parsed = parsePermalinkKey(key);
  if (!parsed || !isDbConfigured()) return undefined;
  const gone = { type: "gone", key } as const;

  if (parsed.type === "version") {
    const row = await db.query.problemVersion.findFirst({ where: and(eq(problemVersion.problemNumber, parsed.number), eq(problemVersion.version, parsed.version)) });
    if (!row) return undefined;
    const problem = await getProblemById(row.problemId);
    if (!problem) return gone;
    const version = {
      key,
      version: row.version,
      title: row.title,
      statement: row.statement,
      body: row.body,
      references: withKeys(row.references),
      changeSummary: row.changeSummary,
      credit: row.credit,
      aiUse: row.aiUse,
      created: row.createdAt,
      updated: row.updatedAt,
    };
    return { type: "version", version, versions: await getVersions(row.problemId), problem };
  }

  const link = await db.query.permalink.findFirst({ where: eq(permalink.key, key) });
  if (!link) return undefined;
  switch (link.target) {
    case "problem": {
      const problem = await getProblemById(link.targetId);
      return problem ? { type: "redirect", href: `/problems/${problem.slug}` } : gone;
    }
    case "post": {
      const post = await getPostById(link.targetId);
      return post ? { type: "redirect", href: `/blog/${post.slug}` } : gone;
    }
    case "contribution": {
      const row = await db.query.contribution.findFirst({ where: eq(contribution.id, link.targetId) });
      if (row) cacheTag(communityTag(row.problemId));
      const problem = row && (await getProblemById(row.problemId));
      if (!row || row.status !== "approved" || !problem) return gone;
      const { id, kind, title, summary, url, aiUse, credit } = row;
      const [votes, comments] = await Promise.all([getVoteTotals([id]), getApprovedComments("contribution", id)]);
      return {
        type: "contribution",
        contribution: { key, id, kind, title, summary, url, aiUse, credit, submitted: row.createdAt, accepted: row.reviewedAt ?? row.createdAt, votes: votes.get(id) ?? NO_VOTES, comments },
        problem,
      };
    }
    default:
      throw new Error(`Unknown permalink target: ${link.target satisfies never}`);
  }
}

