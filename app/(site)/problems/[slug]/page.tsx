import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentBox } from "@/components/problems/community-sections";
import { ModeratorEditLink } from "@/components/problems/moderator-link";
import { ProblemContent } from "@/components/problems/problem-content";
import { VotesProvider } from "@/components/problems/votes";
import { SignedInProvider } from "@/components/submissions/signed-in";
import { isSignedIn } from "@/lib/auth/session";
import { Callout } from "@/components/ui";
import { getProblem, problemLabel } from "@/lib/data/problems";

export async function generateMetadata({ params }: PageProps<"/problems/[slug]">): Promise<Metadata> {
  const problem = await getProblem((await params).slug);
  if (!problem) return {};
  // Points programs and AI agents that read the page to its machine-readable versions.
  const base = `/problems/${problem.slug}/problem`;
  return { title: problemLabel(problem), alternates: { types: { "text/markdown": `${base}.md`, "application/json": `${base}.json` } } };
}

// Rendered per request from the cache: the problem list and the page's content (ProblemContent) are only
// read and rendered again after a change. Only the moderator link, the comment box and whether the comment buttons
// ask to sign in (SignedInProvider) depend on the visitor, and the votes, which load in the browser (VotesProvider).
export default async function ProblemPage({ params }: PageProps<"/problems/[slug]">) {
  const { slug } = await params;
  const problem = await getProblem(slug);
  if (!problem) notFound();

  return (
    <>
      <p className="mt-6 flex justify-between text-[0.92rem]">
        <Link href={problem.published ? "/problems" : "/candidates"} className="text-brand hover:underline">
          {problem.published ? "← All problems" : "← All candidate problems"}
        </Link>
        <ModeratorEditLink problemId={problem.id} />
      </p>
      {!problem.published && (
        <Callout>
          A <Link href="/candidates">candidate problem</Link>: accepted by the moderators, but not yet part of the
          published list.
        </Callout>
      )}
      {/* The key: the cached content places this slot among its own children, and React needs one there. */}
      <SignedInProvider signedIn={isSignedIn()}>
        <VotesProvider problemId={problem.id}>
          <ProblemContent id={problem.id} commentBox={<CommentBox key="comment-box" on={{ type: "problem", slug: problem.slug }} references={problem.references} />} />
        </VotesProvider>
      </SignedInProvider>
    </>
  );
}
