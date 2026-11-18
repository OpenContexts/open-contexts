import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostContent } from "@/components/blog/post-content";
import { CommentBox } from "@/components/problems/community-sections";
import { SignedInProvider } from "@/components/submissions/signed-in";
import { isSignedIn } from "@/lib/auth/session";
import { getPost } from "@/lib/data/blog";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = await getPost((await params).slug);
  return post ? { title: post.title, authors: post.authors.map((name) => ({ name })) } : {};
}

// Like the problem page: the post and its comments come from the cache (PostContent); only the comment box,
// and whether the reply buttons ask to sign in, depend on the visitor.
export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <>
      <p className="mt-6 text-[0.92rem]">
        <Link href="/blog" className="text-brand hover:underline">
          ← All posts
        </Link>
      </p>
      {/* The key: the cached content places this slot among its own children, and React needs one there. */}
      <SignedInProvider signedIn={isSignedIn()}>
        <PostContent id={post.id} commentBox={<CommentBox key="comment-box" on={{ type: "post", slug: post.slug }} references={post.references} />} />
      </SignedInProvider>
    </>
  );
}
