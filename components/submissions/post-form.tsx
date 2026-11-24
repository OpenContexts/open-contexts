"use client";

import { useActionState } from "react";
import { CitationsProvider } from "@/components/markdown/cite-autocomplete";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { Field, Input, SubmitButton } from "@/components/ui";
import { useReferenceRows } from "@/components/ui/use-reference-rows";
import { errorOf, initialFormState, valueOf } from "@/lib/actions/form-state";
import { submitPost } from "@/lib/actions/submissions";
import { FormMessage, SubmissionReceived } from "./form-parts";
import { ReferencesField } from "./references-field";

export function PostForm({ defaultAuthors }: { defaultAuthors: string }) {
  const [state, action] = useActionState(submitPost, initialFormState);
  // Kept here, so the text can cite the references while they are being added.
  const refs = useReferenceRows([]);
  if (state.status === "success") return <SubmissionReceived noun="blog post" back={{ href: "/blog", label: "to the blog" }} />;

  return (
    <CitationsProvider references={refs.rows}>
      <form action={action}>
        <FormMessage state={state} />
        <Field label="Title" htmlFor="title" error={errorOf(state, "title")}>
          <Input id="title" name="title" defaultValue={valueOf(state, "title")} required />
        </Field>
        <Field label="Authors" htmlFor="authors" error={errorOf(state, "authors")} hint="Comma-separated names, as they should appear above the post.">
          <Input id="authors" name="authors" defaultValue={valueOf(state, "authors", defaultAuthors)} required />
        </Field>
        <Field label="Text" htmlFor="body" error={errorOf(state, "body")} hint="Markdown with LaTeX math. Use ## for section headings, and \cite{key} for the references below.">
          <MarkdownEditor id="body" name="body" rows={18} images defaultValue={valueOf(state, "body")} invalid={!!errorOf(state, "body")} />
        </Field>
        <ReferencesField refs={refs} error={errorOf(state, "references")} />

        <div className="mt-6">
          <SubmitButton pendingLabel="Submitting…">Submit post for review</SubmitButton>
        </div>
      </form>
    </CitationsProvider>
  );
}
