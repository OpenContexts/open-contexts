"use client";

import { useActionState } from "react";
import { CitationsProvider } from "@/components/markdown/cite-autocomplete";
import type { CitableReferences } from "@/components/markdown/markdown";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { ChoiceCards, Field, Input, SubmitButton } from "@/components/ui";
import { errorOf, initialFormState, valueOf } from "@/lib/actions/form-state";
import { submitRevision } from "@/lib/actions/submissions";
import { FormMessage, SubmissionReceived } from "./form-parts";
import { AI_CHOICES } from "./result-form";

export function EditForm({
  problem,
  defaultCredit,
}: {
  /** `references`: the problem's, which the statement and the text can cite with \cite{key}. */
  problem: { slug: string; title: string; statement: string; body: string; version: number; references: CitableReferences };
  defaultCredit: string;
}) {
  const [state, action] = useActionState(submitRevision, initialFormState);
  if (state.status === "success") return <SubmissionReceived noun="suggested edit" back={{ href: `/problems/${problem.slug}`, label: "back to the problem" }} />;

  return (
    <CitationsProvider references={problem.references}>
      <form action={action}>
        <input type="hidden" name="problemSlug" value={problem.slug} />
        <input type="hidden" name="baseVersion" value={problem.version} />
        <FormMessage state={state} />

        <Field label="What did you change, and why?" htmlFor="changeSummary" error={errorOf(state, "changeSummary")} hint="Shown to the moderators and, once accepted, in the problem's history.">
          <Input id="changeSummary" name="changeSummary" defaultValue={valueOf(state, "changeSummary")} placeholder="e.g. Corrected the normalization in the action; added the 2024 lattice result" required />
        </Field>

        <h2 className="mt-7 font-sans text-sm font-bold">The problem as it should read</h2>
        <p className="text-sm text-ink-subtle">Edit the current text directly. Moderators will see exactly what changed.</p>
        <Field label="Title" htmlFor="title" error={errorOf(state, "title")}>
          <Input id="title" name="title" defaultValue={valueOf(state, "title", problem.title)} required />
        </Field>
        <Field label="Statement (the boxed problem)" htmlFor="statement" error={errorOf(state, "statement")}>
          <MarkdownEditor id="statement" name="statement" rows={6} defaultValue={valueOf(state, "statement", problem.statement.trim())} invalid={!!errorOf(state, "statement")} />
        </Field>
        <Field label="Background, relevance and significance" htmlFor="body" error={errorOf(state, "body")} hint="Use “## Heading” to start a section.">
          <MarkdownEditor id="body" name="body" rows={18} defaultValue={valueOf(state, "body", problem.body.trim())} invalid={!!errorOf(state, "body")} />
        </Field>

        <h2 className="mt-7 font-sans text-sm font-bold">Credit</h2>
        <Field label="Credit" htmlFor="credit" error={errorOf(state, "credit")} hint="Everyone who made this change, with affiliations if you like. Once accepted, the new version of the problem is credited to them.">
          <Input id="credit" name="credit" defaultValue={valueOf(state, "credit", defaultCredit)} required />
        </Field>
        <ChoiceCards name="aiUse" legend="How much AI was used?" choices={AI_CHOICES} columns={1} defaultValue={valueOf(state, "aiUse", "none")} error={errorOf(state, "aiUse")} required />
        <div className="mt-6">
          <SubmitButton pendingLabel="Submitting…">Submit edit for review</SubmitButton>
        </div>
      </form>
    </CitationsProvider>
  );
}
