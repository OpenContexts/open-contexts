import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { CommentBox, SignInToComment } from "@/components/problems/community-sections";
import { ModeratorEditLink } from "@/components/problems/moderator-link";
import { ProblemContent } from "@/components/problems/problem-content";
import { getProblem, getProblems, getProblemTitle } from "@/lib/data/problems";

export async function generateStaticParams() {
  const problems = await getProblems();
  // Cache Components needs at least one entry; without a database there are no problems yet.
  return problems.length ? problems.map((p) => ({ slug: p.slug })) : [{ slug: "none" }];
}

export async function generateMetadata({ params }: PageProps<"/problems/[slug]">): Promise<Metadata> {
  const title = await getProblemTitle((await params).slug);
  return title ? { title } : {};
}

// The page is looked up per request, but its content comes from the cache (ProblemContent) and is only
// rendered again after a change. Prerendering the content instead served a just-published problem as a
// 404 on its first visit, and an edited one with the old text once (generateMetadata uses its own lookup
// for a related reason, see getProblemTitle). Both were measured with `next start`.
export default function ProblemPage({ params }: PageProps<"/problems/[slug]">) {
  return (
    <Suspense fallback={<p className="mt-10 text-center text-ink-subtle">Loading…</p>}>
      <ProblemArticle params={params} />
    </Suspense>
  );
}

async function ProblemArticle({ params }: { params: PageProps<"/problems/[slug]">["params"] }) {
  await connection();
  const { slug } = await params;
  const problem = await getProblem(slug);
  if (!problem) notFound();

  return (
    <>
      <p className="mt-6 flex justify-between text-[0.92rem]">
        <Link href="/problems" className="text-brand hover:underline">
          All problems
        </Link>
        <Suspense fallback={null}>
          <ModeratorEditLink problemId={problem.id} />
        </Suspense>
      </p>
      <ProblemContent
        id={problem.id}
        commentBox={
          // The key: the cached content places this slot among its own children, and React needs one there.
          <Suspense key="comment-box" fallback={<SignInToComment slug={problem.slug} />}>
            <CommentBox slug={problem.slug} />
          </Suspense>
        }
      />
    </>
  );
}
