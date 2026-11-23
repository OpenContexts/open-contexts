// The short versions of the companion paper's boxes and principles, as the explainers show them. The full
// reasoning is in the paper; keep these to a line or two each.
import type { TileItem } from "./tiles";

/** The paper's four principles (Sec. III). */
export const PRINCIPLES: TileItem[] = [
  { icon: "∀", title: "Chosen by the community", text: "Problems are proposed and selected by researchers, not set by one person or group." },
  { icon: "↻", title: "Live and open", text: "Statuses change as work happens, and anyone can read everything." },
  { icon: "→", title: "Anchored to goals", text: "Every problem traces to a long-term goal; progress counts by what it advances." },
  { icon: "✓", title: "Credit for every role", text: "Posing, solving, verifying, refereeing and explaining are each credited by name." },
];

/** Box II of the paper: what the database does. */
export const FEATURES: TileItem[] = [
  { icon: "◔", title: "Live status", text: "Open, under revision or solved, updated as work proceeds." },
  { icon: "∴", title: "Partial advances", text: "Attempts, partial and negative results, evidence: nothing is lost." },
  { icon: "≈", title: "Unpolished material", text: "Incomplete proofs and rough computations are welcome." },
  { icon: "⟲", title: "Revision and digestion", text: "Others inspect, verify, explain or challenge each claim in the open." },
  { icon: "✎", title: "Contribution tracking", text: "Every entry records who did what, with a permanent link to cite." },
  { icon: "↗", title: "Result updates", text: "Entries stay open after publication: corrections, simpler proofs, follow-ups." },
];

/** Box I: the curation criteria, with their full wording for the details. */
export const CRITERIA = [
  {
    icon: "◎",
    title: "Clarity",
    text: "Precisely stated, so what counts as a solution is unambiguous.",
    full: "The problem must be precisely stated, with fixed objects and assumptions, so that what counts as a solution is unambiguous and the problem can be readily prompted into an AI agent.",
  },
  {
    icon: "§",
    title: "Relevance",
    text: "Motivated by the literature and traceable to a long-term goal.",
    full: "The problem must be well-motivated within the existing literature and traceable to at least one of the program's long-term goals.",
  },
  {
    icon: "↑",
    title: "Significance",
    text: "Solving it meaningfully advances that goal.",
    full: "The problem's resolution must meaningfully advance the long-term goal(s) to which the problem is traceable.",
  },
  {
    icon: "⚒",
    title: "Feasibility",
    text: "Within reach of existing techniques and near-term AI assistance.",
    full: "The problem must be plausibly tackled with existing techniques and near-term AI assistance: not necessarily easy, but not so far beyond current methods that even formulating a strategy is out of reach.",
  },
];

/** Box III: the best practices, in the paper's short wording. */
export const BEST_PRACTICES: TileItem[] = [
  { icon: "⚿", title: "Prompt cautiously", text: "Don't feed others' unpublished material to AI services without their consent." },
  { icon: "✓", title: "Be honest", text: "Claim full understanding only if you can follow, explain and defend every step." },
  { icon: "✎", title: "Polish before submitting", text: "Work on a promising single-prompt output before you submit it." },
  { icon: "☺", title: "Be polite", text: "Agents have no feelings, humans do: criticize claims, not people." },
  { icon: "≠", title: "Avoid duplication", text: "Check for existing claims; a second solution should offer distinct insight." },
  { icon: "♡", title: "Recognize effort", text: "Acknowledge and cite the contributions you build on." },
];

/** Who gets credit, and for what. */
export const CREDIT_ROLES: TileItem[] = [
  { icon: "?", title: "Posing", text: "Asking a good question" },
  { icon: "∴", title: "Advancing", text: "Partial, negative or full results" },
  { icon: "✓", title: "Verifying", text: "Checking a claimed solution" },
  { icon: "✕", title: "Challenging", text: "Finding a gap or a flaw" },
  { icon: "¶", title: "Explaining", text: "Making a result readable" },
  { icon: "✎", title: "Editing", text: "Improving a problem's text" },
];
