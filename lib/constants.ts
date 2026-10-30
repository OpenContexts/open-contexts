// Vocabularies shared by the content files, the database enums and the UI.
// The tuples feed `pgEnum` and zod; the label maps feed the UI.

export const PROBLEM_STATUSES = ["open", "under-revision", "solved"] as const;
export type ProblemStatus = (typeof PROBLEM_STATUSES)[number];
export const PROBLEM_STATUS_LABELS: Record<ProblemStatus, string> = {
  open: "open",
  "under-revision": "under revision",
  solved: "solved",
};

export const MODERATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

/** Everything a user can submit. Each kind has its own table and passes the same moderation queue. */
export const SUBMISSION_TYPES = ["comment", "contribution", "link", "revision", "proposal"] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];
export const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  comment: "Comments",
  contribution: "Results",
  link: "Related links",
  revision: "Edits",
  proposal: "New problems",
};
/** Singular, for "Your … is waiting for review". */
export const SUBMISSION_TYPE_NOUNS: Record<SubmissionType, string> = {
  comment: "comment",
  contribution: "result",
  link: "related link",
  revision: "suggested edit",
  proposal: "problem proposal",
};

/** Simple enough to approve or reject straight from the queue. Edits and new problems need the review page. */
export const QUICK_DECISION_TYPES: readonly SubmissionType[] = ["comment", "contribution", "link"];

/** Decisions on submissions. */
export const MODERATION_ACTIONS = ["approve", "reject", "reopen"] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

/** Everything the activity log records: decisions on submissions, and direct changes to problems. */
export const LOG_TARGET_TYPES = [...SUBMISSION_TYPES, "problem"] as const;
export type LogTargetType = (typeof LOG_TARGET_TYPES)[number];
export const LOG_ACTIONS = [...MODERATION_ACTIONS, "create", "update", "delete"] as const;
export type LogAction = (typeof LOG_ACTIONS)[number];
export const LOG_TARGET_NOUNS: Record<LogTargetType, string> = { ...SUBMISSION_TYPE_NOUNS, problem: "problem" };

/** Entries in a problem's "Progress and history". */
export const HISTORY_KINDS = ["posed", "status", "advance", "note", "edit"] as const;
export type HistoryKind = (typeof HISTORY_KINDS)[number];

export const CONTRIBUTION_KINDS = [
  "claim",
  "partial",
  "negative",
  "reformulation",
  "decomposition",
  "evidence",
  "verification",
  "exposition",
  "challenge",
  "question",
  "reference",
] as const;
export type ContributionKind = (typeof CONTRIBUTION_KINDS)[number];
export const CONTRIBUTION_KIND_LABELS: Record<ContributionKind, string> = {
  claim: "claimed solution",
  partial: "partial result",
  negative: "negative result",
  reformulation: "reformulation",
  decomposition: "decomposition into further problems",
  evidence: "computational evidence",
  verification: "independent verification",
  exposition: "explanatory exposition",
  challenge: "challenge to a solution",
  question: "question about the statement",
  reference: "relevant reference",
};

export const AI_USE = ["none", "partial", "full"] as const;
export type AiUse = (typeof AI_USE)[number];
export const AI_USE_LABELS: Record<AiUse, string> = {
  none: "no AI assistance",
  partial: "partially AI-assisted",
  full: "fully AI-generated",
};
export const AI_USE_DESCRIPTIONS: Record<AiUse, string> = {
  none: "Written and worked out without AI tools.",
  partial: "AI tools helped (several human–AI iterations), and you checked the result.",
  full: "Essentially the output of an AI tool.",
};

export const CONTRIBUTION_KIND_DESCRIPTIONS: Record<ContributionKind, string> = {
  claim: "You believe you have solved the problem.",
  partial: "A special case, a bound, or a step towards a solution.",
  negative: "A no-go result, counterexample, or a route that does not work.",
  reformulation: "An equivalent or sharper statement of the problem.",
  decomposition: "A split of the problem into smaller open questions.",
  evidence: "Numerics or computer-assisted evidence for or against.",
  verification: "An independent check of someone else's claimed result.",
  exposition: "A clear explanation of a result, for others to build on.",
  challenge: "A gap or error in a claimed solution.",
  question: "Something unclear or ambiguous in the statement.",
  reference: "Relevant literature not yet cited on the page.",
};

export const LINK_RELATIONS = [
  "related",
  "generalizes",
  "special-case",
  "depends-on",
  "equivalent",
] as const;
export type LinkRelation = (typeof LINK_RELATIONS)[number];
export const LINK_RELATION_DESCRIPTIONS: Record<LinkRelation, string> = {
  related: "Shares methods, motivation or context.",
  generalizes: "This problem contains the other as a special case.",
  "special-case": "This problem is a special case of the other.",
  "depends-on": "Progress here needs progress there first.",
  equivalent: "Solving one solves the other.",
};
export const LINK_RELATION_LABELS: Record<LinkRelation, string> = {
  related: "related to",
  generalizes: "generalizes",
  "special-case": "is a special case of",
  "depends-on": "depends on",
  equivalent: "is equivalent to",
};

/** Roles stored on `user.role` (Better Auth admin plugin). */
export const ROLES = ["user", "moderator", "admin"] as const;
export type Role = (typeof ROLES)[number];
export const MODERATOR_ROLES: readonly Role[] = ["moderator", "admin"];
export const ROLE_LABELS: Record<Role, string> = { user: "User", moderator: "Moderator", admin: "Admin" };
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  user: "Can comment and submit contributions.",
  moderator: "Can also approve and reject submissions.",
  admin: "Can also manage users and their roles.",
};
