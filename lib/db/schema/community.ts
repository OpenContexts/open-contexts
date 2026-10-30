// Everything users submit about the problems (lib/db/schema/problems.ts). Every submission
// starts as `pending` and only `approved` rows are shown on the public site.
import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  AI_USE,
  CONTRIBUTION_KINDS,
  LOG_ACTIONS,
  LOG_TARGET_TYPES,
  MODERATION_STATUSES,
} from "../../constants";
import { user } from "./auth";
import { problem, problemStatus, type Reference } from "./problems";

export const moderationStatus = pgEnum("moderation_status", MODERATION_STATUSES);
// The two log enums keep their original database names from when only decisions were logged.
export const logAction = pgEnum("moderation_action", LOG_ACTIONS);
export const logTargetType = pgEnum("submission_type", LOG_TARGET_TYPES);
export const contributionKind = pgEnum("contribution_kind", CONTRIBUTION_KINDS);
export const aiUse = pgEnum("ai_use", AI_USE);

const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/** Columns shared by every moderated table. */
const moderation = () => ({
  status: moderationStatus("status").default("pending").notNull(),
  reviewedById: text("reviewed_by_id").references(() => user.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNote: text("review_note"),
});

/** Discussion on a problem. `parentId` allows one level (or more) of replies. */
export const comment = pgTable(
  "comment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problem.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => comment.id, {
      onDelete: "cascade",
    }),
    body: text("body").notNull(), // markdown + math, rendered without raw HTML
    ...moderation(),
    ...timestamps(),
  },
  (t) => [
    index("comment_problem_status_idx").on(t.problemId, t.status),
    index("comment_status_created_idx").on(t.status, t.createdAt),
  ],
);

/** Material attached to a problem: claimed solutions, partial results, verifications, … */
export const contribution = pgTable(
  "contribution",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problem.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: contributionKind("kind").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(), // markdown + math
    url: text("url"),
    aiUse: aiUse("ai_use").default("none").notNull(),
    /** Names (and affiliations) credited publicly, which may differ from the submitting account. */
    credit: text("credit").notNull(),
    ...moderation(),
    ...timestamps(),
  },
  (t) => [
    index("contribution_problem_status_idx").on(t.problemId, t.status),
    index("contribution_status_created_idx").on(t.status, t.createdAt),
  ],
);

/**
 * A proposed edit to a problem: a full snapshot of the editable fields. Approving it writes
 * the snapshot into the problem row.
 */
export const problemRevision = pgTable(
  "problem_revision",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problem.id, { onDelete: "cascade" }),
    /** The problem's `version` when the edit was started; a lower current version means a conflict. */
    baseVersion: integer("base_version").default(0).notNull(),
    /** Null once the author's account is deleted; an accepted edit stays published. */
    authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    statement: text("statement").notNull(),
    body: text("body").notNull(),
    /** Set only on edits from before the status became moderator-only; null leaves the status as it is. */
    problemStatus: problemStatus("problem_status"),
    /** What changed and why, shown to moderators and in the problem's history. */
    changeSummary: text("change_summary").notNull(),
    ...moderation(),
    ...timestamps(),
  },
  (t) => [
    index("problem_revision_problem_status_idx").on(t.problemId, t.status),
    index("problem_revision_status_created_idx").on(t.status, t.createdAt),
  ],
);

/** A new problem suggested by a user. Approving it creates a row in `problem`. */
export const problemProposal = pgTable(
  "problem_proposal",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Null once the author's account is deleted; an accepted problem stays published. */
    authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    statement: text("statement").notNull(),
    /** Background, partial progress and significance, as markdown with `##` sections. */
    body: text("body").notNull(),
    areas: text("areas").array().notNull(),
    tags: text("tags").array().default([]).notNull(),
    posedBy: text("posed_by").array().notNull(),
    references: jsonb("references").$type<Reference[]>().default([]).notNull(),
    aiUse: aiUse("ai_use").default("none").notNull(),
    /** The problem created when the proposal was approved. */
    problemId: uuid("problem_id").references(() => problem.id, { onDelete: "set null" }),
    ...moderation(),
    ...timestamps(),
  },
  (t) => [
    index("problem_proposal_status_created_idx").on(t.status, t.createdAt),
  ],
);

/** Append-only audit trail: decisions on submissions, and direct changes to problems. */
export const moderationLog = pgTable(
  "moderation_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    targetType: logTargetType("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    action: logAction("action").notNull(),
    moderatorId: text("moderator_id").references(() => user.id, { onDelete: "set null" }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("moderation_log_target_idx").on(t.targetType, t.targetId)],
);

export const commentRelations = relations(comment, ({ one, many }) => ({
  author: one(user, { fields: [comment.authorId], references: [user.id] }),
  problem: one(problem, { fields: [comment.problemId], references: [problem.id] }),
  parent: one(comment, {
    fields: [comment.parentId],
    references: [comment.id],
    relationName: "replies",
  }),
  replies: many(comment, { relationName: "replies" }),
}));

export const contributionRelations = relations(contribution, ({ one }) => ({
  author: one(user, { fields: [contribution.authorId], references: [user.id] }),
  problem: one(problem, { fields: [contribution.problemId], references: [problem.id] }),
}));

export const problemRevisionRelations = relations(problemRevision, ({ one }) => ({
  author: one(user, { fields: [problemRevision.authorId], references: [user.id] }),
  problem: one(problem, { fields: [problemRevision.problemId], references: [problem.id] }),
}));

export const problemProposalRelations = relations(problemProposal, ({ one }) => ({
  author: one(user, { fields: [problemProposal.authorId], references: [user.id] }),
  problem: one(problem, { fields: [problemProposal.problemId], references: [problem.id] }),
}));

export const moderationLogRelations = relations(moderationLog, ({ one }) => ({
  moderator: one(user, { fields: [moderationLog.moderatorId], references: [user.id] }),
}));
