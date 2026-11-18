"use client";

import { useActionState, useId, useState } from "react";
import { CitationsProvider } from "@/components/markdown/cite-autocomplete";
import type { CitableReferences } from "@/components/markdown/markdown";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { Button, Callout, SubmitButton } from "@/components/ui";
import { errorOf, initialFormState, valueOf } from "@/lib/actions/form-state";
import { submitComment } from "@/lib/actions/submissions";
import type { CommentTarget, ReplyTarget } from "./comment-target";
import { FormMessage } from "./form-parts";

/** The form field that says where the comment goes. */
const targetField = (on: CommentTarget) =>
  on.type === "contribution" ? { name: "contributionKey", value: on.key } : { name: on.type === "problem" ? "problemSlug" : "postSlug", value: on.slug };

/**
 * `references`: the problem's or post's, which the comment can cite with \cite{key}. With `replyTo`, a reply to
 * that comment, which `onClose` puts away again (after sending, or to cancel).
 */
export function CommentForm({
  on,
  references,
  replyTo,
  onClose,
  className,
}: {
  on: CommentTarget;
  references: CitableReferences;
  replyTo?: ReplyTarget;
  onClose?: () => void;
  className?: string;
}) {
  const [state, action] = useActionState(submitComment, initialFormState);
  const [dismissed, setDismissed] = useState(false);
  const id = useId();

  if (state.status === "success" && !dismissed) {
    return (
      <Callout tone="success" className={className}>
        Thank you — your {replyTo ? "reply" : "comment"} will appear here once a moderator has approved it.{" "}
        <button type="button" onClick={() => (onClose ? onClose() : setDismissed(true))} className="cursor-pointer text-brand hover:underline">
          {onClose ? "Close" : "Write another"}
        </button>
      </Callout>
    );
  }

  return (
    <form action={action} className={className} onSubmit={() => setDismissed(false)}>
      <input type="hidden" {...targetField(on)} />
      {replyTo && <input type="hidden" name="parentId" value={replyTo.id} />}
      <label htmlFor={id} className="mb-1 block font-sans text-sm font-bold">
        {replyTo ? `Reply to ${replyTo.author}` : "Add to the discussion"}
      </label>
      <FormMessage state={state} />
      <CitationsProvider references={references}>
        <MarkdownEditor
          id={id}
          name="body"
          rows={replyTo ? 3 : 4}
          autoFocus={!!replyTo}
          defaultValue={state.status === "success" ? "" : valueOf(state, "body")}
          placeholder={replyTo ? "Your reply… Replies are moderated." : "Questions, remarks, pointers… Comments are moderated."}
          invalid={!!errorOf(state, "body")}
        />
      </CitationsProvider>
      {errorOf(state, "body") && <p className="mt-1 text-sm text-brand">{errorOf(state, "body")}</p>}
      <div className="mt-2 flex justify-end gap-2">
        {onClose && (
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        )}
        <SubmitButton size="sm">{replyTo ? "Post reply" : "Post comment"}</SubmitButton>
      </div>
    </form>
  );
}
