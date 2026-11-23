import Form from "next/form";
import Link from "next/link";
import { connection } from "next/server";
import { PostList } from "@/components/blog/post-list";
import { GoalDiagram } from "@/components/explainers/goal-diagram";
import { Figure } from "@/components/explainers/figure";
import { FeatureExplorer } from "@/components/explainers/feature-explorer";
import { WorkflowFigure } from "@/components/explainers/workflow-figure";
import { ProblemBox } from "@/components/problems/problem-box";
import { ProblemList } from "@/components/problems/problem-list";
import { Button, ButtonLink, Input, SectionTitle } from "@/components/ui";
import { featuredPost, getPosts } from "@/lib/data/blog";
import { getPublishedProblems } from "@/lib/data/problems";
import { SITE } from "@/lib/site";

export default async function HomePage() {
  const [problems, posts] = await Promise.all([getPublishedProblems(), getPosts()]);
  // The one post the moderators chose for the home page (or the newest, while none is chosen).
  const post = featuredPost(posts);
  const open = problems.filter((p) => p.status === "open");

  await connection(); // a new pick per request, never one frozen into a prerender
  const random = pickRandom(open);

  const count = (status: string) => problems.filter((p) => p.status === status).length;
  const recent = [...problems].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 3);

  return (
    <>
      <section className="pt-12 text-center">
        <h1 className="mb-1 text-[2rem] max-sm:text-[1.7rem]">{SITE.name}</h1>
        <p className="mb-4 text-[1.3rem] font-bold">{SITE.subtitle}</p>
        <p className="mx-auto max-w-140 text-[1.08rem] text-ink-muted">
          Precisely stated open problems, worked on together by researchers and AI, with a live status and credit for
          everyone who helps.
        </p>
        <p className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/problems">Browse the problems</ButtonLink>
          <ButtonLink href="#how-it-works" variant="secondary">
            How it works ↓
          </ButtonLink>
        </p>
      </section>

      <nav aria-label="Counts" className="mt-10 mb-6 flex flex-wrap justify-center gap-x-10 gap-y-2 border-y border-rule-strong py-3">
        {[
          { href: "/problems", n: problems.length, label: problems.length === 1 ? "problem" : "problems" },
          { href: "/problems?status=open", n: count("open"), label: "open" },
          { href: "/problems?status=under-revision", n: count("under-revision"), label: "under revision" },
          { href: "/problems?status=solved", n: count("solved"), label: "solved" },
        ].map((s) => (
          <Link key={s.href} href={s.href} className="inline-flex items-baseline gap-2 text-ink hover:text-brand">
            <strong className="text-[1.7rem] leading-none">{s.n}</strong>
            <span className="tracking-wide text-ink-muted [font-variant:small-caps]">{s.label}</span>
          </Link>
        ))}
      </nav>

      <Form action="/problems" role="search" className="mx-auto flex max-w-xl gap-2">
        <label htmlFor="q" className="sr-only">
          Search problems
        </label>
        <Input id="q" name="q" type="search" placeholder="Search problems" autoComplete="off" className="flex-1" />
        <Button type="submit">Search</Button>
      </Form>

      <SectionTitle>I. A random open problem</SectionTitle>
      {random ? <ProblemBox problem={random} preview /> : <p className="text-ink-muted">No open problems yet.</p>}

      <SectionTitle>II. Recently updated</SectionTitle>
      <ProblemList problems={recent} />
      <p className="mt-2 text-right text-sm">
        <Link href="/problems?sort=date" className="text-brand hover:underline">
          All problems →
        </Link>
      </p>

      <SectionTitle id="how-it-works" className="scroll-mt-6">
        III. How it works
      </SectionTitle>
      <p className="mx-auto -mt-2 mb-2 max-w-140 text-center text-ink-muted">
        A claimed solution is digested by the community, with or without AI, aiming at human understanding and a
        high-quality presentation.
      </p>
      <Figure
        number={1}
        title="Workflow and status updates"
        caption={
          <>
            Curated problems enter the database (dashed frame) as open; disputes can send them back. After Fig. 2 of
            the <PaperLink />.
          </>
        }
      >
        <WorkflowFigure />
      </Figure>

      <SectionTitle>IV. Three long-term goals</SectionTitle>
      <p className="mx-auto -mt-2 mb-6 max-w-140 text-center text-ink-muted">
        Every problem grows from at least one goal of the{" "}
        <Link href="/agenda" className="text-brand hover:underline">
          research agenda
        </Link>
        .
      </p>
      <Figure
        number={2}
        title="The research agenda"
        caption={<>Three long-term goals (golden apples) organize the list; near-term problems (red apples) grow from each. Click a goal to read about it.</>}
      >
        <GoalDiagram />
      </Figure>

      <SectionTitle>V. What the database records</SectionTitle>
      <FeatureExplorer />
      <p className="mt-6 text-center">
        <ButtonLink href="/contribute" variant="secondary">
          How to contribute →
        </ButtonLink>
      </p>

      <SectionTitle>VI. From the blog</SectionTitle>
      <PostList posts={post ? [post] : []} featured={post?.featured ? "Featured post" : "Latest post"} empty="No posts yet." />
      {posts.length > 0 && (
        <p className="-mt-3 text-right text-sm">
          <Link href="/blog" className="text-brand hover:underline">
            All posts →
          </Link>
        </p>
      )}

    </>
  );
}

/** "companion paper", linked once it has an address. */
function PaperLink() {
  return SITE.paper.url ? (
    <a href={SITE.paper.url} className="text-brand hover:underline">
      companion paper
    </a>
  ) : (
    <Link href="/about#paper" className="text-brand hover:underline">
      companion paper
    </Link>
  );
}

function pickRandom<T>(items: T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)];
}
