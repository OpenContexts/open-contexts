import Form from "next/form";
import Link from "next/link";
import { connection } from "next/server";
import { ProblemBox } from "@/components/problems/problem-box";
import { ProblemList } from "@/components/problems/problem-list";
import { AppleIcon, Button, Input, SectionTitle } from "@/components/ui";
import { AREAS } from "@/lib/areas";
import { getProblems } from "@/lib/data/problems";
import { plural } from "@/lib/format";
import { SITE } from "@/lib/site";

export default async function HomePage() {
  const problems = await getProblems();
  const open = problems.filter((p) => p.status === "open");

  await connection(); // a new pick per request, never one frozen into a prerender
  const random = pickRandom(open);

  const count = (status: string) => problems.filter((p) => p.status === status).length;
  const recent = [...problems].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 8);

  return (
    <>
      <section className="pt-12 pb-2 text-center">
        <h1 className="mb-1 text-[2rem] max-sm:text-[1.7rem]">{SITE.name}</h1>
        <p className="mb-4 text-[1.3rem] font-bold">{SITE.subtitle}</p>
        <p className="mx-auto mb-4 max-w-160 text-justify text-base hyphens-auto max-sm:text-left">
          This is a curated list of <strong>original</strong>, well-posed, near-term problems in the subfield of quantum foundations concerned with generalized contextuality. Every question on it is an addition to the existing literature. Each problem is stated precisely enough to be attacked by skilled researchers working with or without AI assistance, motivated within the existing literature, traceable to at least one long-term goal of our starting research agenda, and selected because its resolution would meaningfully advance that goal. Entries carry a live status, a record of partial progress, and the names of everyone who posed, advanced, verified, or explained them.
        </p>
      </section>

      <section className="mx-auto max-w-160">
        <div className="md:flex items-start w-full text-sm gap-4">
          <strong>Companion paper:</strong>
          <p className="flex-1">
            {SITE.paper.url ? (
              <a href={SITE.paper.url} className="text-brand hover:underline">
                <span className="italic">{SITE.paper.title}</span>
              </a>
            ) : (
              <span className="italic">{SITE.paper.title}</span>
            )}
            , {SITE.paper.authors} ({SITE.paper.year}).
          </p>
        </div>
      </section>

      <nav aria-label="Counts" className="my-8 flex flex-wrap justify-center gap-x-10 gap-y-2 border-y border-rule-strong py-3">
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

      <Form action="/problems" role="search" className="mt-8 flex gap-2 max-w-xl mx-auto">
        <label htmlFor="q" className="sr-only">
          Search problems
        </label>
        <Input id="q" name="q" type="search" placeholder="Search problems" autoComplete="off" className="flex-1" />
        <Button type="submit">Search</Button>
      </Form>

      <SectionTitle>I. Organizing research goals</SectionTitle>
      <p className="mx-auto mb-4 -mt-4 max-w-160 text-justify text-base hyphens-auto max-sm:text-left">
          For this first cycle (OpenContext I) three long-term goals organize the list. The division into broad goals is a matter of motivation and organization, rather than a fixed verdict on what is worth pursuing. Within this scheme, every problem traces back to at least one goal. Golden apples mark the broad goals motivated in our companion paper; red apples mark the near-term problems that grow from them. Later cycles may be organized around other broad directions, and objections to the current goals are welcome: see the{" "}
          <Link href="/guidelines#cycles" className="text-brand hover:underline">
            guidelines
          </Link>
          .
        </p>
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
              <span className="text-sm whitespace-nowrap text-ink-subtle hidden md:block">{plural(n, "problem")}</span>
              <p className="col-start-2 text-[0.98rem] text-ink-muted">{area.summary}</p>
            </li>
          );
        })}
      </ol>

      <SectionTitle>II. A random open problem</SectionTitle>
      {random ? (
        <ProblemBox problem={random} link />
      ) : (
        <p className="text-ink-muted">No open problems yet.</p>
      )}

      <SectionTitle>III. Recently updated</SectionTitle>
      <ProblemList problems={recent} />
      <p className="mt-2 text-right text-sm">
        <Link href="/problems?sort=date" className="text-brand hover:underline">
          All problems →
        </Link>
      </p>
    </>
  );
}

function pickRandom<T>(items: T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)];
}
