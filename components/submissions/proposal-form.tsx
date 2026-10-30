"use client";

import { useActionState } from "react";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { ChoiceCards, Field, Input, SubmitButton, Textarea } from "@/components/ui";
import { AREAS } from "@/lib/areas";
import { errorOf, initialFormState, valueOf, valuesOf } from "@/lib/actions/form-state";
import { submitProposal } from "@/lib/actions/submissions";
import { FormMessage, SubmissionReceived } from "./form-parts";
import { AI_CHOICES } from "./result-form";

const BODY_TEMPLATE = `## Background

What is known, and why the question is natural.

## Partial progress

Results so far, including special cases and failed approaches.

## Significance

What a solution would change.`;

export function ProposalForm({ defaultPosedBy }: { defaultPosedBy: string }) {
  const [state, action] = useActionState(submitProposal, initialFormState);
  if (state.status === "success") return <SubmissionReceived noun="problem proposal" back={{ href: "/problems", label: "to the problem list" }} />;

  return (
    <form action={action}>
      <FormMessage state={state} />

      <h2 className="mt-6 font-sans text-sm font-bold">1. The problem</h2>
      <Field label="Title" htmlFor="title" error={errorOf(state, "title")} hint="Short and specific, e.g. “The hierarchy problem”.">
        <Input id="title" name="title" defaultValue={valueOf(state, "title")} required />
      </Field>
      <Field
        label="Statement"
        htmlFor="statement"
        error={errorOf(state, "statement")}
        hint="The precise question, as it will appear in the red box. Someone skilled should be able to start working from this alone."
      >
        <MarkdownEditor id="statement" name="statement" rows={6} defaultValue={valueOf(state, "statement")} invalid={!!errorOf(state, "statement")} />
      </Field>
      <ChoiceCards
        type="checkbox"
        name="areas[]"
        legend="Research areas"
        hint="Choose all that apply."
        choices={AREAS.map((a) => ({ value: a.id, label: `${a.numeral}. ${a.title}` }))}
        defaultValue={valuesOf(state, "areas[]")}
        error={errorOf(state, "areas[]")}
      />

      <h2 className="mt-7 font-sans text-sm font-bold">2. Context</h2>
      <Field label="Background, progress and significance" htmlFor="body" error={errorOf(state, "body")} hint="Replace the prompts below. Keep the “##” headings or add your own.">
        <MarkdownEditor id="body" name="body" rows={16} defaultValue={valueOf(state, "body", BODY_TEMPLATE)} invalid={!!errorOf(state, "body")} />
      </Field>
      <Field label="References" htmlFor="references" error={errorOf(state, "references")} hint="One per line. A link anywhere in the line is picked up automatically.">
        <Textarea id="references" name="references" rows={5} defaultValue={valueOf(state, "references")} placeholder="S. Weinberg, The cosmological constant problem, Rev. Mod. Phys. 61, 1 (1989) https://doi.org/10.1103/RevModPhys.61.1" />
      </Field>
      <Field label="Tags (optional)" htmlFor="tags" error={errorOf(state, "tags")} hint="Comma-separated, e.g. “Naturalness, Higgs boson”.">
        <Input id="tags" name="tags" defaultValue={valueOf(state, "tags")} />
      </Field>

      <h2 className="mt-7 font-sans text-sm font-bold">3. Credit and transparency</h2>
      <Field label="Posed by" htmlFor="posedBy" error={errorOf(state, "posedBy")} hint="Comma-separated names. If the problem comes from the literature, name its original authors.">
        <Input id="posedBy" name="posedBy" defaultValue={valueOf(state, "posedBy", defaultPosedBy)} required />
      </Field>
      <ChoiceCards name="aiUse" legend="How much AI was used to write this proposal?" choices={AI_CHOICES} columns={1} defaultValue={valueOf(state, "aiUse", "none")} error={errorOf(state, "aiUse")} required />

      <div className="mt-6">
        <SubmitButton pendingLabel="Submitting…">Submit proposal for review</SubmitButton>
      </div>
    </form>
  );
}
