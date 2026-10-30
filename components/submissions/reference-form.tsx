"use client";

import { useActionState } from "react";
import { Field, Input, SubmitButton, Textarea } from "@/components/ui";
import { errorOf, initialFormState, valueOf } from "@/lib/actions/form-state";
import { submitReference } from "@/lib/actions/submissions";
import { FormMessage, SubmissionReceived } from "./form-parts";

export function ReferenceForm({ problemSlug }: { problemSlug: string }) {
  const [state, action] = useActionState(submitReference, initialFormState);
  if (state.status === "success") return <SubmissionReceived noun="reference" back={{ href: `/problems/${problemSlug}`, label: "back to the problem" }} />;

  return (
    <form action={action}>
      <input type="hidden" name="problemSlug" value={problemSlug} />
      <FormMessage state={state} />
      <Field label="Reference" htmlFor="title" error={errorOf(state, "title")} hint="Authors, title, journal or arXiv number, year.">
        <Input id="title" name="title" defaultValue={valueOf(state, "title")} required />
      </Field>
      <Field label="Link (optional)" htmlFor="url" error={errorOf(state, "url")}>
        <Input id="url" name="url" type="url" placeholder="https://doi.org/…" defaultValue={valueOf(state, "url")} />
      </Field>
      <Field label="Why is it relevant?" htmlFor="summary" error={errorOf(state, "summary")} hint="One or two sentences for readers of this problem.">
        <Textarea id="summary" name="summary" rows={3} defaultValue={valueOf(state, "summary")} required className="font-serif text-base" />
      </Field>
      <div className="mt-6">
        <SubmitButton pendingLabel="Submitting…">Submit for review</SubmitButton>
      </div>
    </form>
  );
}
