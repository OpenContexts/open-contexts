"use client";

import { useActionState, useState } from "react";
import { CitationsProvider } from "@/components/markdown/cite-autocomplete";
import type { CitableReferences } from "@/components/markdown/markdown";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { ChoiceCards, Field, Input, Select, SubmitButton } from "@/components/ui";
import type { ChoiceGroup } from "@/components/ui/choice-cards";
import {
  AI_USE,
  AI_USE_DESCRIPTIONS,
  AI_USE_LABELS,
  CONTRIBUTION_KIND_DESCRIPTIONS,
  CONTRIBUTION_KIND_LABELS,
  type ContributionKind,
  KIND_CHOICES_BY_STATUS,
  type ProblemStatus,
  RESULT_KINDS_BY_STATUS,
  RESULT_SUMMARY_MAX,
  TARGETED_KINDS,
} from "@/lib/constants";
import { errorOf, initialFormState, valueOf } from "@/lib/actions/form-state";
import { submitResult } from "@/lib/actions/submissions";
import { FormMessage, SubmissionReceived } from "./form-parts";

/**
 * The kinds by group, in the order that suits the problem's status: once a solution is claimed, checking it comes
 * first. Only the kinds the status allows (RESULT_KINDS_BY_STATUS) are offered.
 */
const GROUPS: Record<ProblemStatus, { label: string; kinds: ContributionKind[] }[]> = {
  open: [
    { label: "Progress on the problem", kinds: ["claim", "partial", "negative", "evidence"] },
    { label: "Restating the problem", kinds: ["reformulation", "decomposition"] },
    { label: "Checking or explaining work", kinds: ["verification", "challenge", "exposition"] },
  ],
  "under-revision": [
    { label: "Checking or explaining the claimed solution", kinds: ["verification", "challenge", "evidence", "exposition"] },
    { label: "Other progress", kinds: ["independent", "partial", "negative"] },
    { label: "Restating the problem", kinds: ["reformulation"] },
  ],
  solved: [{ label: "Checking or explaining the solution", kinds: ["verification", "challenge", "evidence", "exposition"] }],
};

function kindGroups(status: ProblemStatus, offered: (k: ContributionKind) => boolean): ChoiceGroup[] {
  const override = KIND_CHOICES_BY_STATUS[status] ?? {};
  return GROUPS[status]
    .map((g) => ({
      label: g.label,
      choices: g.kinds.filter(offered).map((k) => ({
        value: k,
        label: override[k]?.label ?? CONTRIBUTION_KIND_LABELS[k].replace(/^./, (c) => c.toUpperCase()),
        description: override[k]?.description ?? CONTRIBUTION_KIND_DESCRIPTIONS[k],
      })),
    }))
    .filter((g) => g.choices.length > 0);
}

export const AI_CHOICES = AI_USE.map((a) => ({ value: a, label: AI_USE_LABELS[a].replace(/^./, (c) => c.toUpperCase()), description: AI_USE_DESCRIPTIONS[a] }));

/** An accepted result a verification or challenge can be about: its key ("12.3") and how the drop-down names it. */
export type ResultTarget = { key: string; label: string };

/**
 * `references`: the problem's, which the summary can cite with \cite{key}. `status`: the problem's, which decides
 * the kinds on offer. `targets`: the results a verification or challenge can be about; without any, neither is
 * offered. `initial`: a kind and target to start with, from a "Verify" or "Challenge" link on a result's page.
 */
export function ResultForm({
  problemSlug,
  references,
  defaultCredit,
  status,
  targets,
  initial,
}: {
  problemSlug: string;
  references: CitableReferences;
  defaultCredit: string;
  status: ProblemStatus;
  targets: ResultTarget[];
  initial: { kind?: ContributionKind; target?: string };
}) {
  const [state, action] = useActionState(submitResult, initialFormState);
  const startKind = valueOf(state, "kind", initial.kind ?? "");
  const [kind, setKind] = useState(startKind);
  if (state.status === "success") return <SubmissionReceived noun="result" back={{ href: `/problems/${problemSlug}`, label: "back to the problem" }} />;

  const offered = (k: ContributionKind) => RESULT_KINDS_BY_STATUS[status].includes(k) && (targets.length > 0 || !TARGETED_KINDS.includes(k));
  const targeted = TARGETED_KINDS.includes(kind as ContributionKind);
  return (
    // The kind decides whether the drop-down for the result it is about shows.
    <form
      action={action}
      onChange={(e) => {
        const input = e.target as unknown as HTMLInputElement;
        if (input.name === "kind") setKind(input.value);
      }}
    >
      <input type="hidden" name="problemSlug" value={problemSlug} />
      <FormMessage state={state} />

      <ChoiceCards name="kind" legend="1. What kind of result is it?" groups={kindGroups(status, offered)} defaultValue={startKind} error={errorOf(state, "kind")} required />
      {targeted && (
        <Field
          label={kind === "verification" ? "Which result does it verify?" : "Which result does it challenge?"}
          htmlFor="target"
          error={errorOf(state, "target")}
        >
          <Select id="target" name="target" defaultValue={valueOf(state, "target", initial.target ?? "")} required className="w-full">
            <option value="" disabled>
              Choose a result…
            </option>
            {targets.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <h2 className="mt-7 font-sans text-sm font-bold">2. Describe it</h2>
      <Field label="Title" htmlFor="title" error={errorOf(state, "title")} hint="One line title of the contribution">
        <Input id="title" name="title" defaultValue={valueOf(state, "title")} required />
      </Field>
      <Field label="Summary" htmlFor="summary" error={errorOf(state, "summary")} hint="What is shown, how, and under which assumptions. Readers should understand the claim without opening the link.">
        <CitationsProvider references={references}>
          <MarkdownEditor id="summary" name="summary" rows={10} maxLength={RESULT_SUMMARY_MAX} defaultValue={valueOf(state, "summary")} invalid={!!errorOf(state, "summary")} />
        </CitationsProvider>
      </Field>
      <Field label="Link to the full work (optional)" htmlFor="url" error={errorOf(state, "url")} hint="arXiv, journal, code repository, notebook…">
        <Input id="url" name="url" type="url" placeholder="https://arxiv.org/abs/…" defaultValue={valueOf(state, "url")} />
      </Field>

      <h2 className="mt-7 font-sans text-sm font-bold">3. Credit and transparency</h2>
      <Field label="Credit" htmlFor="credit" error={errorOf(state, "credit")} hint="Everyone who takes responsibility for this work, with affiliations if you like.">
        <Input id="credit" name="credit" defaultValue={valueOf(state, "credit", defaultCredit)} required />
      </Field>
      <ChoiceCards name="aiUse" legend="How much AI was used?" choices={AI_CHOICES} columns={1} defaultValue={valueOf(state, "aiUse", "none")} error={errorOf(state, "aiUse")} required />

      <div className="mt-6">
        <SubmitButton pendingLabel="Submitting…">Submit for review</SubmitButton>
      </div>
    </form>
  );
}
