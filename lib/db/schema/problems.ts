// The problems themselves. This table is the single source of truth: the public pages,
// suggested edits, proposals and the admin editor all read and write it.
import { relations } from "drizzle-orm";
import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { type HistoryKind, PROBLEM_STATUSES, type ProblemStatus } from "../../constants";
import { user } from "./auth";

export const problemStatus = pgEnum("problem_status", PROBLEM_STATUSES);

/** `key` is what the text cites it by, \cite{key}; references stored before keys existed get one on reading (withKeys). */
export type Reference = { key?: string; text: string; url?: string };
export type HistoryEntry = { date: string; kind: HistoryKind; text: string; status?: ProblemStatus };

export const problem = pgTable("problem", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Shown as "Problem 7". Unique, assigned when the problem is accepted, and kept when it is published later. */
  number: integer("number").notNull().unique(),
  /** URL segment: /problems/<slug>. */
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  status: problemStatus("status").default("open").notNull(),
  /** Agenda item ids from lib/agenda.ts. */
  agenda: text("agenda").array().notNull(),
  tags: text("tags").array().default([]).notNull(),
  posedBy: text("posed_by").array().default([]).notNull(),
  /** When the problem was first posed: "1976", "1976-11" or "1976-11-15". */
  posed: text("posed").notNull(),
  /** The boxed statement, as markdown with math. */
  statement: text("statement").notNull(),
  /** The text below the statement, as markdown with `##` sections (e.g. Background, Relevance, Significance). */
  body: text("body").notNull(),
  history: jsonb("history").$type<HistoryEntry[]>().default([]).notNull(),
  references: jsonb("references").$type<Reference[]>().default([]).notNull(),
  /** Optional markdown shown in a blue box, e.g. links to related problems. Set by moderators only. */
  note: text("note").default("").notNull(),
  /** Increases with every change. Suggested edits record the version they started from. */
  version: integer("version").default(1).notNull(),
  /**
   * When the problem was admitted to the published list (/problems). Null for a candidate: accepted by the
   * moderators but kept for a later cycle, shown only on /candidates. Proposals are accepted as candidates.
   */
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  /** Shown as "Updated" on the problem page. */
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const problemRelations = relations(problem, ({ one }) => ({
  createdBy: one(user, { fields: [problem.createdById], references: [user.id] }),
}));
