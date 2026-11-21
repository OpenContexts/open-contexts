import Form from "next/form";
import Link from "next/link";
import { connection } from "next/server";
import { PostList } from "@/components/blog/post-list";
import { AgendaTree, GoalCounts } from "@/components/explainers/agenda-tree";
import { FEATURES } from "@/components/explainers/content";
import { Figure } from "@/components/explainers/figure";
import { Tiles } from "@/components/explainers/tiles";
import { WorkflowFigure } from "@/components/explainers/workflow-figure";
import { ProblemBox } from "@/components/problems/problem-box";
import { ProblemList } from "@/components/problems/problem-list";
import { Button, ButtonLink, Input, SectionTitle } from "@/components/ui";
import { getPosts } from "@/lib/data/blog";
import { getPublishedProblems } from "@/lib/data/problems";
import { SITE } from "@/lib/site";

export default async function HomePage() {
  const [problems, posts] = await Promise.all([getPublishedProblems(), getPosts()]);
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
        <p className="mx-auto mt-5 max-w-140 text-sm text-ink-subtle">
          Companion paper: <PaperTitle />, {SITE.paper.authors} ({SITE.paper.year})
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
      <p className="mx-auto -mt-2 mb-2 max-w-140 text-center text-ink-muted">
        Every problem grows from at least one goal of the{" "}
        <Link href="/agenda" className="text-brand hover:underline">
          research agenda
        </Link>
        .
      </p>
      <div className="mx-auto max-w-170">
        <AgendaTree />
        <GoalCounts problems={problems} />
      </div>

      <SectionTitle>V. What the database records</SectionTitle>
      <Tiles items={FEATURES} columns={3} />
      <p className="mt-6 text-center">
        <ButtonLink href="/contribute" variant="secondary">
          How to contribute →
        </ButtonLink>
      </p>

      <SectionTitle>VI. From the blog</SectionTitle>
      <p className="mx-auto -mt-2 mb-4 max-w-160 text-center text-ink-muted">
        Informal posts by the community. Anyone can{" "}
        <Link href="/blog/new" className="text-brand hover:underline">
          write one
        </Link>
        .
      </p>
      <PostList posts={posts.slice(0, 3)} empty="No posts yet." />
      {posts.length > 0 && (
        <p className="mt-2 text-right text-sm">
          <Link href="/blog" className="text-brand hover:underline">
            All posts →
          </Link>
        </p>
      )}
    </>
  );
}

function PaperTitle() {
  const title = <em>{SITE.paper.title}</em>;
  return SITE.paper.url ? (
    <a href={SITE.paper.url} className="text-brand hover:underline">
      {title}
    </a>
  ) : (
    title
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
