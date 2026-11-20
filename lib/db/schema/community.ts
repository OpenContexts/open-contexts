// Everything users submit: material on the problems (lib/db/schema/problems.ts), blog posts, and the
// comments on both. Every submission starts as `pending` and only `approved` rows are shown on the public site.
import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
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
import { problem, type Reference } from "./problems";

export const moderationStatus = pgEnum("moderation_status", MODERATION_STATUSES);
export const logAction = pgEnum("log_action", LOG_ACTIONS);
export const logTargetType = pgEnum("log_target_type", LOG_TARGET_TYPES);
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

/**
 * A blog post, written by anyone and published once a moderator approves it. Its URL name and date are set
 * on approval, so pending posts claim no URL.
 */
export const blogPost = pgTable(
  "blog_post",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** URL segment: /blog/<slug>. Null until the post is first approved; kept if it is reopened and approved again. */
    slug: text("slug").unique(),
    title: text("title").notNull(),
    /** The names shown as the post's authors, which may differ from the submitting account. */
    authors: text("authors").array().notNull(),
    /** Markdown with math; cites its references with \cite{key}. */
    body: text("body").notNull(),
    references: jsonb("references").$type<Reference[]>().default([]).notNull(),
    /** Null once the author's account is deleted; a published post stays published. */
    authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
    /** The post's date: when it was first approved. */
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...moderation(),
    ...timestamps(),
  },
  (t) => [index("blog_post_status_created_idx").on(t.status, t.createdAt)],
);

/**
 * Discussion on a problem or on a blog post: exactly one of the two is set. A comment on a contribution to a
 * problem also names the contribution (`contributionId`); without one, it is on the problem's own discussion.
 * A reply names the comment it answers (`parentId`), which is always a top-level comment in the same discussion:
 * replies go one level deep.
 */
export const comment = pgTable(
  "comment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    problemId: uuid("problem_id").references(() => problem.id, { onDelete: "cascade" }),
    postId: uuid("post_id").references(() => blogPost.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => comment.id, { onDelete: "cascade" }),
    contributionId: uuid("contribution_id").references((): AnyPgColumn => contribution.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(), // markdown + math, rendered without raw HTML
    ...moderation(),
    ...timestamps(),
  },
  (t) => [
    index("comment_problem_status_idx").on(t.problemId, t.status),
    index("comment_post_status_idx").on(t.postId, t.status),
    index("comment_status_created_idx").on(t.status, t.createdAt),
    index("comment_parent_idx").on(t.parentId),
    index("comment_contribution_status_idx").on(t.contributionId, t.status),
    check("comment_target_check", sql`(${t.problemId} is null) <> (${t.postId} is null)`),
    check("comment_contribution_check", sql`${t.contributionId} is null or ${t.problemId} is not null`),
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
    /**
     * For verifications and challenges (TARGETED_KINDS): the accepted result on the same problem they check or
     * dispute. Null for the other kinds, and once that result is deleted.
     */
    targetId: uuid("target_id").references((): AnyPgColumn => contribution.id, { onDelete: "set null" }),
    /**
     * When its author withdrew it. A withdrawn submission waiting for review leaves the queue; an accepted one
     * stays on the problem, marked as withdrawn, as the guidelines ask (IV).
     */
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
    ...moderation(),
    ...timestamps(),
  },
  (t) => [
    index("contribution_problem_status_idx").on(t.problemId, t.status),
    index("contribution_status_created_idx").on(t.status, t.createdAt),
    index("contribution_target_idx").on(t.targetId),
  ],
);

/**
 * Votes on contributions, one per person and contribution: +1 or -1. Not moderated; taking a vote back deletes
 * it. Nobody votes on their own contribution, and votes of blocked accounts do not count.
 */
export const contributionVote = pgTable(
  "contribution_vote",
  {
    contributionId: uuid("contribution_id")
      .notNull()
      .references(() => contribution.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    value: smallint("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.contributionId, t.userId] }),
    index("contribution_vote_user_idx").on(t.userId),
    check("contribution_vote_value_check", sql`${t.value} in (-1, 1)`),
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
    /** The problem's `version` when the edit was started; a higher current version means a conflict. */
    baseVersion: integer("base_version").notNull(),
    /** Null once the author's account is deleted; an accepted edit stays published. */
    authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    statement: text("statement").notNull(),
    body: text("body").notNull(),
    /** What changed and why, shown to moderators and in the problem's history. */
    changeSummary: text("change_summary").notNull(),
    /** The names credited for the edit; null for edits submitted before it was asked. */
    credit: text("credit"),
    /** Null for edits submitted before it was asked. */
    aiUse: aiUse("ai_use"),
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
    /** The text below the statement, as markdown with `##` sections. */
    body: text("body").notNull(),
    agenda: text("agenda").array().notNull(),
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

/**
 * When each user last looked at their submissions (/me): decisions made since then are new to them, and counted
 * in the account menu. No row: they never have.
 */
export const submissionsSeen = pgTable("submissions_seen", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  seenAt: timestamp("seen_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Append-only audit trail ("Activity log"): decisions on submissions, and direct changes to problems. */
export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    targetType: logTargetType("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    action: logAction("action").notNull(),
    moderatorId: text("moderator_id").references(() => user.id, { onDelete: "set null" }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("activity_log_target_idx").on(t.targetType, t.targetId)],
);

export const commentRelations = relations(comment, ({ one, many }) => ({
  author: one(user, { fields: [comment.authorId], references: [user.id] }),
  parent: one(comment, { fields: [comment.parentId], references: [comment.id], relationName: "replies" }),
  contribution: one(contribution, { fields: [comment.contributionId], references: [contribution.id] }),
  replies: many(comment, { relationName: "replies" }),
  problem: one(problem, { fields: [comment.problemId], references: [problem.id] }),
  post: one(blogPost, { fields: [comment.postId], references: [blogPost.id] }),
}));

export const blogPostRelations = relations(blogPost, ({ one }) => ({
  author: one(user, { fields: [blogPost.authorId], references: [user.id] }),
}));

export const contributionRelations = relations(contribution, ({ one, many }) => ({
  author: one(user, { fields: [contribution.authorId], references: [user.id] }),
  problem: one(problem, { fields: [contribution.problemId], references: [problem.id] }),
  target: one(contribution, { fields: [contribution.targetId], references: [contribution.id], relationName: "target" }),
  comments: many(comment),
}));

export const problemRevisionRelations = relations(problemRevision, ({ one }) => ({
  author: one(user, { fields: [problemRevision.authorId], references: [user.id] }),
  problem: one(problem, { fields: [problemRevision.problemId], references: [problem.id] }),
}));

export const problemProposalRelations = relations(problemProposal, ({ one }) => ({
  author: one(user, { fields: [problemProposal.authorId], references: [user.id] }),
  problem: one(problem, { fields: [problemProposal.problemId], references: [problem.id] }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  moderator: one(user, { fields: [activityLog.moderatorId], references: [user.id] }),
}));
