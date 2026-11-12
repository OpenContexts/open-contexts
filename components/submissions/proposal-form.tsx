"use client";

import { useActionState } from "react";
import { CitationsProvider } from "@/components/markdown/cite-autocomplete";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { ChoiceCards, Field, Input, SubmitButton } from "@/components/ui";
import { useReferenceRows } from "@/components/ui/use-reference-rows";
import { AGENDA } from "@/lib/agenda";
import { errorOf, initialFormState, valueOf, valuesOf } from "@/lib/actions/form-state";
import { submitProposal } from "@/lib/actions/submissions";
import { FormMessage, SubmissionReceived } from "./form-parts";
import { ReferencesField } from "./references-field";
import { AI_CHOICES } from "./result-form";

const BODY_TEMPLATE = `## Background

What a reader needs to understand the statement, with references.

## Relevance

How the problem is motivated within the existing literature, and which items of the research agenda it traces to.

## Significance

How its resolution would meaningfully advance that agenda.

## Feasibility

Why the problem can plausibly be tackled with existing techniques and near-term AI assistance, for instance known special cases or a possible line of attack.`;

export function ProposalForm({ defaultPosedBy }: { defaultPosedBy: string }) {
  const [state, action] = useActionState(submitProposal, initialFormState);
  // Kept here, so the statement and the text can cite the references while they are being added.
  const refs = useReferenceRows([]);
  if (state.status === "success") return <SubmissionReceived noun="problem proposal" back={{ href: "/problems", label: "to the problem list" }} />;

  return (
    <CitationsProvider references={refs.rows}>
      <form action={action}>
        <FormMessage state={state} />

        <h2 className="mt-6 font-sans text-sm font-bold">1. The problem</h2>
        <Field label="Title" htmlFor="title" error={errorOf(state, "title")} hint="Short and specific.">
          <Input id="title" name="title" defaultValue={valueOf(state, "title")} required />
        </Field>
        <Field
          label="Statement"
          htmlFor="statement"
          error={errorOf(state, "statement")}
          hint="The precise question, as it will appear in the red box. Fix the objects and assumptions, and make clear what counts as a solution."
        >
          <MarkdownEditor id="statement" name="statement" rows={6} defaultValue={valueOf(state, "statement")} invalid={!!errorOf(state, "statement")} />
        </Field>
        <ChoiceCards
          type="checkbox"
          name="agenda[]"
          legend="Research agenda"
          hint="Choose all that apply."
          choices={AGENDA.map((a) => ({ value: a.id, label: `${a.numeral}. ${a.title}` }))}
          defaultValue={valuesOf(state, "agenda[]")}
          error={errorOf(state, "agenda[]")}
        />

        <h2 className="mt-7 font-sans text-sm font-bold">2. Context</h2>
        <Field label="Background, relevance, significance and feasibility" htmlFor="body" error={errorOf(state, "body")} hint="Please keep the recommended structure.">
          <MarkdownEditor id="body" name="body" rows={16} defaultValue={valueOf(state, "body", BODY_TEMPLATE)} invalid={!!errorOf(state, "body")} />
        </Field>
        <ReferencesField refs={refs} error={errorOf(state, "references")} />
        <Field label="Tags (optional)" htmlFor="tags" error={errorOf(state, "tags")} hint="Comma-separated keywords.">
          <Input id="tags" name="tags" defaultValue={valueOf(state, "tags")} />
        </Field>

        <h2 className="mt-7 font-sans text-sm font-bold">3. Credit and transparency</h2>
        <Field label="Posed by" htmlFor="posedBy" error={errorOf(state, "posedBy")} hint="Comma-separated names of the humans who take responsibility for the proposal.">
          <Input id="posedBy" name="posedBy" defaultValue={valueOf(state, "posedBy", defaultPosedBy)} required />
        </Field>
        <ChoiceCards name="aiUse" legend="How much AI was used to write this proposal?" choices={AI_CHOICES} columns={1} defaultValue={valueOf(state, "aiUse", "none")} error={errorOf(state, "aiUse")} required />

        <div className="mt-6">
          <SubmitButton pendingLabel="Submitting…">Submit proposal for review</SubmitButton>
        </div>
      </form>
    </CitationsProvider>
  );
}
