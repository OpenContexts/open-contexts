import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { PostList } from "@/components/blog/post-list";
import { Section } from "@/components/explainers/section";
import { Tiles } from "@/components/explainers/tiles";
import { ButtonLink, PageTitle } from "@/components/ui";
import { BLOG_TAG, getPosts } from "@/lib/data/blog";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog",
  description: `Informal posts on the problems of ${SITE.name} and on generalized contextuality, written by the community.`,
};

/** What a post can be about. */
const IDEAS = [
  { icon: "◎", title: "An overview", text: "of a problem, a goal or a line of work" },
  { icon: "∴", title: "The story behind a result", text: "how it was found, what it took" },
  { icon: "→", title: "Open directions", text: "questions not yet ready to be problems" },
  { icon: "¶", title: "A report", text: "from a meeting, a workshop or a talk" },
];

/** Cached until a post is published or taken down, or a comment on one is approved. */
export default async function BlogPage() {
  "use cache";
  cacheLife("max");
  cacheTag(BLOG_TAG);

  const posts = await getPosts();
  return (
    <>
      <PageTitle>Blog</PageTitle>
      <p className="mx-auto mb-8 max-w-140 text-center text-ink-muted">
        Informal writing on the problems and on generalized contextuality, by the community.
      </p>
      <PostList posts={posts} featured empty="No posts yet. Be the first to write one." />

      <Section title="Write a post" intro="Anyone signed in can write one. A moderator reads it before it appears, as with every contribution.">
        <Tiles items={IDEAS} columns={4} />
        <p className="mt-7 text-center">
          <ButtonLink href="/blog/new">Write a post</ButtonLink>
        </p>
        <p className="mt-3 text-center text-sm text-ink-subtle">
          Markdown with LaTeX, and references you can cite (see{" "}
          <Link href="/contribute#formatting" className="text-brand hover:underline">
            formatting
          </Link>
          ).
        </p>
      </Section>
    </>
  );
}
