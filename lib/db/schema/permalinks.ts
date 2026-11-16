// Permanent links (/contribution/<key>, see lib/permalinks.ts) and the versions of each problem they point to.
// Neither table has foreign keys: a key, once given, outlives what it points to, so that a removed problem,
// contribution or post leaves a "no longer available" page behind instead of a dead link or a reused key.
import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { PERMALINK_TARGETS } from "../../constants";
import type { Reference } from "./problems";

export const permalinkTarget = pgEnum("permalink_target", PERMALINK_TARGETS);

/**
 * One key per problem ("12"), per accepted contribution of a kind in PERMALINK_KINDS ("12.3") and per
 * published blog post ("blog.7"). Given on the first acceptance and never changed, reused or deleted.
 */
export const permalink = pgTable(
  "permalink",
  {
    /** "12", "12.3", "blog.7". */
    key: text("key").primaryKey(),
    target: permalinkTarget("target").notNull(),
    /** The problem's, contribution's or blog post's id. */
    targetId: uuid("target_id").notNull(),
    /** The problem's number, for problems and their contributions; null for blog posts. */
    problemNumber: integer("problem_number"),
    /** 0 for a problem (whose key is its number alone); 1, 2, … for its contributions and for the blog posts, the number after the dot. */
    seq: integer("seq").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("permalink_target_unique").on(t.target, t.targetId),
    index("permalink_problem_number_idx").on(t.problemNumber),
    check("permalink_problem_number_check", sql`(${t.target} = 'post') = (${t.problemNumber} is null)`),
  ],
);

/**
 * The problem's text as it stood at each version, linked as "12v3". A version starts when a problem is created
 * or accepted and with every accepted edit or moderator edit that changes its title, statement, text or
 * references; a moderator edit marked as minor, and a reference added through a contribution, amend the latest
 * version instead. Status, tags, agenda and the note are not part of a version.
 */
export const problemVersion = pgTable(
  "problem_version",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    problemId: uuid("problem_id").notNull(),
    /** Kept here so the key resolves without the problem. */
    problemNumber: integer("problem_number").notNull(),
    /** 1, 2, …: the "3" of "12v3". */
    version: integer("version").notNull(),
    title: text("title").notNull(),
    statement: text("statement").notNull(),
    body: text("body").notNull(),
    references: jsonb("references").$type<Reference[]>().default([]).notNull(),
    /** What changed from the version before; null for the first. */
    changeSummary: text("change_summary"),
    /** When the version started. */
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    /** When it was last amended by a minor edit. */
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("problem_version_number_unique").on(t.problemNumber, t.version), index("problem_version_problem_idx").on(t.problemId)],
);
