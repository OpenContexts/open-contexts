// One comment with its replies, as the discussions show them: under a problem, a blog post or a contribution, and
// smaller (`compact`) on the contribution cards. Long comments are cut to a few lines, and only the newest replies
// show until the rest are asked for.
import { type CitableReferences, MarkdownContent } from "@/components/markdown/markdown";
import { CommentButton } from "@/components/submissions/comment-button";
import type { CommentTarget } from "@/components/submissions/comment-target";
import { Clamped, RecentItems } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Comment } from "@/lib/data/community";
import { formatDate } from "@/lib/format";

/** How many replies show under a comment before "Show more". */
const SHOWN_REPLIES = 3;

/**
 * A top-level comment (`comment`) with its `replies`, oldest first, the last few shown, and the button to reply.
 * Each has the id comment-<id>, for links to it. `references`: those the texts can cite.
 */
export function CommentThread({
  comment: c,
  replies,
  on,
  references,
  compact,
  className,
}: {
  comment: Comment;
  replies: Comment[];
  on: CommentTarget;
  references: CitableReferences;
  compact?: boolean;
  className?: string;
}) {
  return (
    <li id={`comment-${c.id}`} className={cn("grid scroll-mt-6", compact ? "grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3" : "grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3.5", className)}>
      <Initials name={c.author.name} size={compact ? "sm" : "md"} />
      <div className="min-w-0">
        <CommentBody comment={c} references={references} compact={compact} />
        {replies.length > 0 && (
          <RecentItems limit={SHOWN_REPLIES} noun={["reply", "replies"]} label={`Replies to ${c.author.name}`} className={compact ? "mt-2.5 space-y-2.5" : "mt-3 space-y-3.5"}>
            {replies.map((r) => (
              <li key={r.id} id={`comment-${r.id}`} className={cn("grid scroll-mt-6", compact ? "grid-cols-[1.4rem_minmax(0,1fr)] gap-x-2.5" : "grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3")}>
                <Initials name={r.author.name} size={compact ? "xs" : "sm"} />
                <div className="min-w-0">
                  <CommentBody comment={r} references={references} compact={compact} />
                </div>
              </li>
            ))}
          </RecentItems>
        )}
        <CommentButton on={on} replyTo={{ id: c.id, author: c.author.name }} references={references} />
      </div>
    </li>
  );
}

/** Who wrote it and when, and the text, cut to a few lines that a click opens. */
function CommentBody({ comment: c, references, compact }: { comment: Comment; references: CitableReferences; compact?: boolean }) {
  return (
    <>
      <p className={cn("text-ink-subtle", compact ? "text-[0.8rem]" : "text-sm")}>
        <strong className={cn("text-ink", compact ? "text-[0.88rem]" : "text-[0.95rem]")}>{c.author.name}</strong> · {formatDate(c.createdAt)}
      </p>
      <Clamped lines={compact ? 4 : 6} className="mt-0.5">
        <MarkdownContent source={c.body} untrusted references={references} className={cn(compact ? "text-[0.92rem]" : "text-[0.98rem]", "[&>*:last-child]:mb-0")} />
      </Clamped>
    </>
  );
}

const INITIALS_SIZES = { xs: "size-[1.4rem] text-[0.58rem]", sm: "size-7 text-[0.68rem]", md: "size-9 text-[0.8rem]" };

function Initials({ name, size }: { name: string; size: keyof typeof INITIALS_SIZES }) {
  const letters = name.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <span aria-hidden className={cn("flex items-center justify-center rounded-full bg-surface font-sans font-bold text-ink-muted ring-1 ring-rule-strong", INITIALS_SIZES[size])}>
      {letters}
    </span>
  );
}
