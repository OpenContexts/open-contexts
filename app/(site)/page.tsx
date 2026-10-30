import { cacheLife } from "next/cache";
import Form from "next/form";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ProblemBox } from "@/components/problems/problem-box";
import { ProblemList } from "@/components/problems/problem-list";
import { AppleIcon, Button, Input, SectionTitle } from "@/components/ui";
import { AREAS } from "@/lib/areas";
import { getProblemById, getProblems } from "@/lib/data/problems";
import { plural } from "@/lib/format";
import { SITE } from "@/lib/site";

export default async function HomePage() {
  const problems = await getProblems();
  const count = (status: string) => problems.filter((p) => p.status === status).length;
  const recent = [...problems].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 8);

  return (
    <>
      <section className="pt-10 pb-2 text-center">
        <h1 className="mb-1 text-[2rem] max-sm:text-[1.7rem]">{SITE.name}</h1>
        <p className="mb-4 text-[1.3rem] font-bold">{SITE.subtitle}</p>
        <p className="mx-auto mb-4 max-w-160 text-justify text-base hyphens-auto max-sm:text-left">
          A curated list of precisely stated open problems in theoretical physics. Each entry carries a live
          status, a record of partial progress, and the names of everyone who posed, advanced, verified or
          explained it. Anyone can comment, submit contributions and suggest edits. Every submission is reviewed
          by a moderator before it appears.
        </p>
      </section>

      <nav aria-label="Counts" className="my-5 flex flex-wrap justify-center gap-x-10 gap-y-2 border-y border-rule-strong py-3">
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

      <Form action="/problems" role="search" className="mt-4 flex gap-2">
        <label htmlFor="q" className="sr-only">
          Search problems
        </label>
        <Input id="q" name="q" type="search" placeholder="Search problems" autoComplete="off" className="flex-1" />
        <Button type="submit">Search</Button>
      </Form>

      <SectionTitle>I. Research areas</SectionTitle>
      <ol className="border-b border-rule">
        {AREAS.map((area) => {
          const n = problems.filter((p) => p.areas.some((a) => a === area.id)).length;
          return (
            <li key={area.id} className="grid grid-cols-[3.8rem_minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-t border-rule py-3">
              <span className="flex items-center gap-1.5 font-bold">
                <AppleIcon variant="gold" />
                {area.numeral}.
              </span>
              <Link href={`/problems?area=${area.id}`} className="font-bold text-ink hover:text-brand">
                {area.title}
              </Link>
              <span className="text-sm whitespace-nowrap text-ink-subtle">{plural(n, "problem")}</span>
              <p className="col-start-2 text-[0.98rem] text-ink-muted">{area.summary}</p>
            </li>
          );
        })}
      </ol>

      <SectionTitle>II. A random open problem</SectionTitle>
      <Suspense fallback={<div className="h-48" />}>
        <RandomOpenProblem />
      </Suspense>

      <SectionTitle>III. Recently updated</SectionTitle>
      <ProblemList problems={recent} />
      <p className="mt-2 text-right text-sm">
        <Link href="/problems?sort=date" className="text-brand hover:underline">
          All problems by date →
        </Link>
      </p>
    </>
  );
}

async function RandomOpenProblem() {
  await connection(); // pick a new one per request instead of freezing one at build time
  const open = (await getProblems()).filter((p) => p.status === "open");
  if (!open.length) return <p className="text-ink-muted">No open problems yet.</p>;
  return <CachedProblemBox id={pickRandom(open).id} />;
}

/** Only the choice is made per request; each problem's box is rendered once (math included) and reused. */
async function CachedProblemBox({ id }: { id: string }) {
  "use cache";
  cacheLife("max");
  const problem = await getProblemById(id);
  return problem ? <ProblemBox problem={problem} link /> : null;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
