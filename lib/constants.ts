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
export const SUBMISSION_TYPES = ["comment", "contribution", "revision", "proposal", "post"] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];
export const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  comment: "Comments",
  contribution: "Results",
  revision: "Edits",
  proposal: "New problems",
  post: "Blog posts",
};
/** Singular, for "Your … is waiting for review". */
export const SUBMISSION_TYPE_NOUNS: Record<SubmissionType, string> = {
  comment: "comment",
  contribution: "result",
  revision: "suggested edit",
  proposal: "problem proposal",
  post: "blog post",
};

/** Simple enough to approve or reject straight from the queue. Edits, new problems and blog posts need the review page. */
export const QUICK_DECISION_TYPES: readonly SubmissionType[] = ["comment", "contribution"];

/** Decisions on submissions. */
export const MODERATION_ACTIONS = ["approve", "reject", "reopen"] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

/** Everything the activity log records: decisions on submissions, and direct changes to problems (publish: admitted to the list, unpublish: back to the additional problems). */
export const LOG_TARGET_TYPES = [...SUBMISSION_TYPES, "problem"] as const;
export type LogTargetType = (typeof LOG_TARGET_TYPES)[number];
export const LOG_ACTIONS = [...MODERATION_ACTIONS, "create", "update", "delete", "publish", "unpublish", "withdraw"] as const;
export type LogAction = (typeof LOG_ACTIONS)[number];
export const LOG_TARGET_NOUNS: Record<LogTargetType, string> = { ...SUBMISSION_TYPE_NOUNS, problem: "problem" };

/** Entries in a problem's "Progress and history". */
export const HISTORY_KINDS = ["posed", "status", "advance", "note", "edit"] as const;
export type HistoryKind = (typeof HISTORY_KINDS)[number];

export const CONTRIBUTION_KINDS = [
  "claim",
  "independent",
  "partial",
  "negative",
  "reformulation",
  "decomposition",
  "evidence",
  "verification",
  "exposition",
  "challenge",
  "reference",
] as const;
export type ContributionKind = (typeof CONTRIBUTION_KINDS)[number];
export const CONTRIBUTION_KIND_LABELS: Record<ContributionKind, string> = {
  claim: "claimed solution",
  independent: "independent solution",
  partial: "partial result",
  negative: "negative result",
  reformulation: "reformulation",
  decomposition: "decomposition into further problems",
  evidence: "computational evidence",
  verification: "independent verification",
  exposition: "explanatory exposition",
  challenge: "challenge to a result",
  reference: "relevant reference",
};
export const CONTRIBUTION_KIND_DESCRIPTIONS: Record<ContributionKind, string> = {
  claim: "You believe you have solved the problem.",
  independent: "A solution of your own, different from the claimed solution under review.",
  partial: "A special case, a bound, or a step towards a solution.",
  negative: "A no-go result, counterexample, or a route that does not work.",
  reformulation: "An equivalent or sharper statement of the problem.",
  decomposition: "A split of the problem into smaller open questions.",
  evidence: "Numerics or computer-assisted evidence for or against.",
  verification: "An independent check of a result on this page, by someone who did not write it.",
  exposition: "A clear explanation of a result, for others to build on.",
  challenge: "A gap or error in a result on this page.",
  reference: "Relevant literature not yet cited on the page.",
};

/**
 * The kinds of result that can be submitted while a problem has each status, following the guidelines (IV):
 * - open: everything;
 * - under revision: work on the claimed solution (verifying, challenging, explaining, replicating), and
 *   independent solutions or progress, since the claim may still fail; no decompositions. A problem has one
 *   claimed solution at a time: the one that put it under revision. Any other solution is an independent one;
 * - solved: only verifying, challenging, explaining or replicating the solution. Further work on it, such as a
 *   generalization, is a new problem.
 * Edits and references stay possible in every state, though the statement is fixed once a solution is claimed
 * (STATEMENT_EDITABLE).
 */
export const RESULT_KINDS_BY_STATUS: Record<ProblemStatus, readonly ContributionKind[]> = {
  open: ["claim", "partial", "negative", "reformulation", "decomposition", "evidence", "verification", "exposition", "challenge"],
  "under-revision": ["independent", "partial", "negative", "reformulation", "evidence", "verification", "exposition", "challenge"],
  solved: ["evidence", "verification", "exposition", "challenge"],
};

/**
 * How a kind is offered where its meaning shifts with the status: under revision, evidence may replicate the claim;
 * once solved, evidence is a replication of the solution. Stored as the kind itself.
 */
export const KIND_CHOICES_BY_STATUS: Partial<Record<ProblemStatus, Partial<Record<ContributionKind, { label: string; description: string }>>>> = {
  "under-revision": {
    evidence: { label: "Computational evidence", description: "Numerics or computer-assisted work, such as a replication of the claim's computations." },
  },
  solved: {
    evidence: { label: "Computational evidence", description: "A replication or formalization of the solution's computations or proofs." },
  },
};

/** Whether suggested edits may change a problem's statement: not once a solution is claimed or accepted. */
export const STATEMENT_EDITABLE: Record<ProblemStatus, boolean> = { open: true, "under-revision": false, solved: false };

/**
 * Whether its author can withdraw a contribution: while it waits for review, or once accepted, except a reference,
 * which is then part of the problem's list of references. Not once turned down, nor twice.
 */
export function canWithdraw(c: { status: ModerationStatus; kind: ContributionKind; withdrawnAt: Date | null }): boolean {
  return !c.withdrawnAt && (c.status === "pending" || (c.status === "approved" && c.kind !== "reference"));
}

/** The kinds that are about one accepted result on the same problem, chosen when submitting (`contribution.targetId`). */
export const TARGETED_KINDS: readonly ContributionKind[] = ["verification", "challenge"];

/**
 * The entry an accepted contribution of each kind adds to its problem's "Progress and history", linked to it;
 * null for none. References go into the problem's list of references instead.
 */
export const CONTRIBUTION_HISTORY_KINDS: Record<ContributionKind, HistoryKind | null> = {
  claim: "advance",
  independent: "advance",
  partial: "advance",
  negative: "advance",
  evidence: "advance",
  verification: "advance",
  reformulation: "posed",
  decomposition: "posed",
  exposition: "note",
  challenge: "note",
  reference: null,
};

/** What a permanent link (lib/permalinks.ts) can point to. Problem versions have keys of their own, from problem_version. */
export const PERMALINK_TARGETS = ["problem", "contribution", "post"] as const;
export type PermalinkTarget = (typeof PERMALINK_TARGETS)[number];

/** The contributions that get a permanent link when accepted: results in their own right, not pointers to literature. */
export const PERMALINK_KINDS: readonly ContributionKind[] = [
  "claim",
  "independent",
  "partial",
  "negative",
  "reformulation",
  "decomposition",
  "evidence",
  "verification",
  "exposition",
  "challenge",
];

/** The longest summary a result can have, in characters; the form counts towards it as one types. */
export const RESULT_SUMMARY_MAX = 20_000;

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

/** Roles stored on `user.role` (Better Auth admin plugin). */
export const ROLES = ["user", "moderator", "admin"] as const;
export type Role = (typeof ROLES)[number];
export const MODERATOR_ROLES: readonly Role[] = ["moderator", "admin"];
export const ROLE_LABELS: Record<Role, string> = { user: "User", moderator: "Moderator", admin: "Admin" };
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  user: "Can comment and submit contributions.",
  moderator: "Can also approve and reject submissions, and block users.",
  admin: "Can also manage users and their roles.",
};
