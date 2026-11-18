// Where a comment goes. Plain functions, for the server and the browser alike (comment-form.tsx is client-only).
import { permalinkPath } from "@/lib/permalinks";

/** What a comment is on: a problem or a blog post, by its URL name, or a contribution, by its key ("12.3"). */
export type CommentTarget = { type: "problem" | "post"; slug: string } | { type: "contribution"; key: string };

/** The page a discussion is on. */
export const discussionPage = (on: CommentTarget) =>
  on.type === "contribution" ? permalinkPath(on.key) : on.type === "problem" ? `/problems/${on.slug}` : `/blog/${on.slug}`;

/** The comment a reply answers: its id and its author's name. */
export type ReplyTarget = { id: string; author: string };
