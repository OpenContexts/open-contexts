// The cached body of a blog post page: everything except the comment box, which depends on who is looking.
import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import type { ReactNode } from "react";
import { MarkdownContent } from "@/components/markdown/markdown";
import { ReferenceList } from "@/components/markdown/reference-list";
import { DiscussionSection } from "@/components/problems/community-sections";
import { getPostById } from "@/lib/data/blog";
import { communityTag, getApprovedComments } from "@/lib/data/community";
import { getPostKey } from "@/lib/data/permalinks";
import { formatDate, formatNames } from "@/lib/format";
import { permalinkPath } from "@/lib/permalinks";

/**
 * Rendered once and reused for every visitor until the post (BLOG_TAG, from getPosts) or its comments
 * (communityTag) change, like ProblemContent. `commentBox` is passed through uncached.
 */
export async function PostContent({ id, commentBox }: { id: string; commentBox: ReactNode }) {
  "use cache";
  cacheLife("max");
  cacheTag(communityTag(id), "community");

  // The key is given with the first approval, which also invalidates the post (BLOG_TAG).
  const [post, comments, key] = await Promise.all([getPostById(id), getApprovedComments("post", id), getPostKey(id)]);
  // The page checked that the post exists just before; this only covers it being taken down in between.
  if (!post) return null;

  return (
    <article>
      <header className="mt-10 mb-8 text-center">
        <h1 className="text-[1.9rem]/tight max-sm:text-[1.5rem]">{post.title}</h1>
        <p className="mt-3 text-ink-muted">
          {formatNames(post.authors)} · <time dateTime={post.published}>{formatDate(post.published)}</time>
          {key && (
            <>
              {" · "}
              <Link href={permalinkPath(key)} className="tabular-nums hover:text-brand hover:underline" title="Permanent link to this post">
                {key}
              </Link>
            </>
          )}
        </p>
      </header>

      <MarkdownContent source={post.body} untrusted references={post.references} />
      <ReferenceList references={post.references} untrusted />

      <DiscussionSection on={{ type: "post", slug: post.slug }} comments={comments} commentBox={commentBox} references={post.references} empty="No comments yet." />
    </article>
  );
}
