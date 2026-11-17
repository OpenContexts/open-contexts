"use client";

import Link from "next/link";
import { useState } from "react";
import type { CitableReferences } from "@/components/markdown/markdown";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/cn";
import { CommentForm, type CommentTarget, discussionPage, type ReplyTarget } from "./comment-form";

/**
 * A button that opens a comment form in place: a reply under a top-level comment (`replyTo`), or a new comment
 * (e.g. on a contribution's card). The discussions are cached for every visitor, so whether they are signed in is
 * asked here, in the browser, once they want to write.
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
  return <OpenForm on={on} replyTo={replyTo} references={references} onClose={() => setOpen(false)} className={formClassName} />;
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
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return <p className="mt-3 text-sm text-ink-subtle">…</p>;
  if (!session) {
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
