"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import type { CitableReferences } from "@/components/markdown/markdown";
import { Spinner } from "@/components/ui";
import { cn } from "@/lib/cn";
import { CommentForm } from "./comment-form";
import { type CommentTarget, discussionPage, type ReplyTarget } from "./comment-target";
import { useSignedIn } from "./signed-in";

/**
 * A button that opens a comment form in place: a reply under a top-level comment (`replyTo`), or a new comment
 * (e.g. on a contribution's card). The discussions are cached for every visitor; whether this one is signed in
 * comes from the page's SignedInProvider.
 */
export function CommentButton({
  on,
  replyTo,
  references,
  label,
  formClassName,
}: {
  on: CommentTarget;
  replyTo?: ReplyTarget;
  references: CitableReferences;
  label?: string;
  /** For the open form, e.g. to give it the full width of a row it shares with other links. */
  formClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-1.5 cursor-pointer font-sans text-xs font-bold text-ink-subtle hover:text-brand">
        <span aria-hidden>{replyTo ? "↩" : "+"}</span> {label ?? (replyTo ? "Reply" : "Add a comment")}
      </button>
    );
  }
  return (
    <Suspense fallback={<Spinner className={cn("mt-3 block text-ink-subtle", formClassName)} />}>
      <OpenForm on={on} replyTo={replyTo} references={references} onClose={() => setOpen(false)} className={formClassName} />
    </Suspense>
  );
}

function OpenForm({
  on,
  replyTo,
  references,
  onClose,
  className,
}: {
  on: CommentTarget;
  replyTo?: ReplyTarget;
  references: CitableReferences;
  onClose: () => void;
  className?: string;
}) {
  if (!useSignedIn()) {
    const page = `${discussionPage(on)}#${replyTo ? `comment-${replyTo.id}` : "discussion"}`;
    return (
      <p className={cn("mt-3 text-[0.95rem]", className)}>
        <Link href={`/sign-in?next=${encodeURIComponent(page)}`} className="text-brand hover:underline">
          Sign in
        </Link>{" "}
        to {replyTo ? "reply" : "comment"}.{" "}
        <button type="button" onClick={onClose} className="cursor-pointer text-ink-subtle hover:underline">
          Cancel
        </button>
      </p>
    );
  }
  return <CommentForm on={on} references={references} replyTo={replyTo} onClose={onClose} className={cn("mt-3", className)} />;
}
