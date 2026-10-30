"use client";

import { useActionState, useState } from "react";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { Callout, SubmitButton } from "@/components/ui";
import { errorOf, initialFormState, valueOf } from "@/lib/actions/form-state";
import { submitComment } from "@/lib/actions/submissions";
import { FormMessage } from "./form-parts";

export function CommentForm({ problemSlug, className }: { problemSlug: string; className?: string }) {
  const [state, action] = useActionState(submitComment, initialFormState);
  const [dismissed, setDismissed] = useState(false);

  if (state.status === "success" && !dismissed) {
    return (
      <Callout tone="success" className={className}>
        Thank you — your comment will appear here once a moderator has approved it.{" "}
        <button type="button" onClick={() => setDismissed(true)} className="cursor-pointer text-brand hover:underline">
          Write another
        </button>
      </Callout>
    );
  }

  return (
    <form action={action} className={className} onSubmit={() => setDismissed(false)}>
      <input type="hidden" name="problemSlug" value={problemSlug} />
      <label htmlFor="comment-body" className="mb-1 block font-sans text-sm font-bold">
        Add to the discussion
      </label>
      <FormMessage state={state} />
      <MarkdownEditor
        id="comment-body"
        name="body"
        rows={4}
        defaultValue={state.status === "success" ? "" : valueOf(state, "body")}
        placeholder="Questions, remarks, pointers… Comments are moderated."
        invalid={!!errorOf(state, "body")}
      />
      {errorOf(state, "body") && <p className="mt-1 text-sm text-brand">{errorOf(state, "body")}</p>}
      <div className="mt-2 text-right">
        <SubmitButton size="sm">Post comment</SubmitButton>
      </div>
    </form>
  );
}
