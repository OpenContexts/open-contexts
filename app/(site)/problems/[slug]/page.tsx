import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentBox } from "@/components/problems/community-sections";
import { ModeratorEditLink } from "@/components/problems/moderator-link";
import { ProblemContent } from "@/components/problems/problem-content";
import { getProblem, problemLabel } from "@/lib/data/problems";

export async function generateMetadata({ params }: PageProps<"/problems/[slug]">): Promise<Metadata> {
  const problem = await getProblem((await params).slug);
  if (!problem) return {};
  // Points programs and AI agents that read the page to its machine-readable versions.
  const base = `/problems/${problem.slug}/problem`;
  return { title: problemLabel(problem), alternates: { types: { "text/markdown": `${base}.md`, "application/json": `${base}.json` } } };
}

// Rendered per request from the cache: the problem list and the page's content (ProblemContent) are only
// read and rendered again after a change. Only the moderator link and the comment box depend on the visitor.
export default async function ProblemPage({ params }: PageProps<"/problems/[slug]">) {
  const { slug } = await params;
  const problem = await getProblem(slug);
  if (!problem) notFound();

  return (
    <>
      <p className="mt-6 flex justify-between text-[0.92rem]">
        <Link href="/problems" className="text-brand hover:underline">
          ← All problems
        </Link>
        <ModeratorEditLink problemId={problem.id} />
      </p>
      {/* The key: the cached content places this slot among its own children, and React needs one there. */}
      <ProblemContent id={problem.id} commentBox={<CommentBox key="comment-box" slug={problem.slug} />} />
    </>
  );
}
