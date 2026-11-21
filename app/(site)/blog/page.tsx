import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { PostList } from "@/components/blog/post-list";
import { ButtonLink, PageTitle } from "@/components/ui";
import { BLOG_TAG, getPosts } from "@/lib/data/blog";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog",
  description: `Informal posts on the problems of ${SITE.name} and on generalized contextuality, written by the community.`,
};

/** Cached until a post is published or taken down, or a comment on one is approved. */
export default async function BlogPage() {
  "use cache";
  cacheLife("max");
  cacheTag(BLOG_TAG);

  const posts = await getPosts();
  return (
    <>
      <PageTitle>Blog</PageTitle>
      <p className="mb-6 text-justify hyphens-auto max-sm:text-left">
        Informal writing on the problems and on generalized contextuality: overviews, the story behind a result,
        open directions, reports from meetings. Anyone can write a post. Like everything on {SITE.name}, posts and
        their comments are read by a moderator before they appear (see{" "}
        <Link href="/contribute#how" className="text-brand hover:underline">
          how it works
        </Link>
        ).
      </p>
      <p className="mb-8 text-center">
        <ButtonLink href="/blog/new">Write a post</ButtonLink>
      </p>
      <PostList posts={posts} empty="No posts yet. Be the first to write one." />
    </>
  );
}
