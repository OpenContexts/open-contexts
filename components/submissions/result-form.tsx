"use client";

import { useActionState } from "react";
import { CitationsProvider } from "@/components/markdown/cite-autocomplete";
import type { CitableReferences } from "@/components/markdown/markdown";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { ChoiceCards, Field, Input, SubmitButton } from "@/components/ui";
import { AI_USE, AI_USE_DESCRIPTIONS, AI_USE_LABELS, CONTRIBUTION_KIND_DESCRIPTIONS, CONTRIBUTION_KIND_LABELS, type ContributionKind } from "@/lib/constants";
import { errorOf, initialFormState, valueOf } from "@/lib/actions/form-state";
import { submitResult } from "@/lib/actions/submissions";
import { FormMessage, SubmissionReceived } from "./form-parts";

const kinds = (...ks: ContributionKind[]) =>
  ks.map((k) => ({ value: k, label: CONTRIBUTION_KIND_LABELS[k].replace(/^./, (c) => c.toUpperCase()), description: CONTRIBUTION_KIND_DESCRIPTIONS[k] }));

const KIND_GROUPS = [
  { label: "Progress on the problem", choices: kinds("claim", "partial", "negative", "evidence") },
  { label: "Restating the problem", choices: kinds("reformulation", "decomposition") },
  { label: "Checking or explaining work", choices: kinds("verification", "challenge", "exposition") },
];

export const AI_CHOICES = AI_USE.map((a) => ({ value: a, label: AI_USE_LABELS[a].replace(/^./, (c) => c.toUpperCase()), description: AI_USE_DESCRIPTIONS[a] }));

/** `references`: the problem's, which the summary can cite with \cite{key}. */
export function ResultForm({ problemSlug, references, defaultCredit }: { problemSlug: string; references: CitableReferences; defaultCredit: string }) {
  const [state, action] = useActionState(submitResult, initialFormState);
  if (state.status === "success") return <SubmissionReceived noun="result" back={{ href: `/problems/${problemSlug}`, label: "back to the problem" }} />;

  return (
    <form action={action}>
      <input type="hidden" name="problemSlug" value={problemSlug} />
      <FormMessage state={state} />

      <ChoiceCards name="kind" legend="1. What kind of result is it?" groups={KIND_GROUPS} defaultValue={valueOf(state, "kind")} error={errorOf(state, "kind")} required />

      <h2 className="mt-7 font-sans text-sm font-bold">2. Describe it</h2>
      <Field label="Title" htmlFor="title" error={errorOf(state, "title")} hint="One line, e.g. “Mass gap for SU(2) on the lattice at strong coupling”.">
        <Input id="title" name="title" defaultValue={valueOf(state, "title")} required />
      </Field>
      <Field label="Summary" htmlFor="summary" error={errorOf(state, "summary")} hint="What is shown, how, and under which assumptions. Readers should understand the claim without opening the link.">
        <CitationsProvider references={references}>
          <MarkdownEditor id="summary" name="summary" rows={10} defaultValue={valueOf(state, "summary")} invalid={!!errorOf(state, "summary")} />
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
