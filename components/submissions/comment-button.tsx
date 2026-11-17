"use client";

import Link from "next/link";
import { useState } from "react";
import type { CitableReferences } from "@/components/markdown/markdown";
import { authClient } from "@/lib/auth/client";
import { CommentForm, type CommentTarget, type ReplyTarget } from "./comment-form";

/**
 * "Reply" under a top-level comment, opening a reply form in place. The discussion is cached for every visitor,
 * so whether they are signed in is asked here, in the browser, once they want to reply.
 */
export function ReplyButton({ on, parent, references }: { on: CommentTarget; parent: ReplyTarget; references: CitableReferences }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-1.5 cursor-pointer font-sans text-xs font-bold text-ink-subtle hover:text-brand">
        <span aria-hidden>↩</span> Reply
      </button>
    );
  }
  return <ReplyForm on={on} parent={parent} references={references} onClose={() => setOpen(false)} />;
}

function ReplyForm({ on, parent, references, onClose }: { on: CommentTarget; parent: ReplyTarget; references: CitableReferences; onClose: () => void }) {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return <p className="mt-3 text-sm text-ink-subtle">…</p>;
  if (!session) {
    const page = `${on.type === "problem" ? "/problems" : "/blog"}/${on.slug}#comment-${parent.id}`;
    return (
      <p className="mt-3 text-[0.95rem]">
        <Link href={`/sign-in?next=${encodeURIComponent(page)}`} className="text-brand hover:underline">
          Sign in
        </Link>{" "}
        to reply.{" "}
        <button type="button" onClick={onClose} className="cursor-pointer text-ink-subtle hover:underline">
          Cancel
        </button>
      </p>
    );
  }
  return <CommentForm on={on} references={references} replyTo={parent} onClose={onClose} className="mt-3" />;
}
