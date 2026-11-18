import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { CopyBlock, PageTitle, SectionTitle } from "@/components/ui";
import { isPlaceholderEmail } from "@/lib/auth/orcid";
import { getModerators } from "@/lib/data/moderators";
import { databaseBibtex, databaseCitation, paperBibtex, siteOrigin, todayIso } from "@/lib/cite";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <div className="prose-oc">
        <PageTitle>About</PageTitle>
        <p>
          {SITE.name} is a community-curated database of open problems in generalized contextuality, the subfield
          of quantum foundations that studies when experimental statistics resist a classical explanation. Each
          problem is stated precisely, placed in its context in the literature, traced to a long-term goal of the
          research agenda, and given a dated status. Progress is recorded with credit to the people who made it.
        </p>

        <SectionTitle>Mission</SectionTitle>
        <p>
          Skilled researchers working with AI assistants can now settle well-posed problems at unprecedented speed.
          This makes well-motivated, precisely stated open problems more valuable than ever, and it raises new
          difficulties: duplicated effort, a growing volume of hastily produced results, questions asked without
          regard for whether they matter, and unclear credit for who posed, solved, checked and explained what.
        </p>
        <p>
          {SITE.name} is a concrete, testable answer to these difficulties for one small field. It offers a shared,
          open record of which problems are open and of what has been achieved on each, so that redundant efforts
          become visible and partial results are not lost. Every problem is anchored to an
          explicit research agenda, so that effort goes where it advances the field. Partial and unpolished results
          can be shared and digested here first, before they are polished for the arXiv or a journal. And every
          contribution is credited to named humans: posing a good question, verifying a solution, or explaining it
          clearly counts as much as producing it.
        </p>
        <p>
          {SITE.name} adds an option rather than replacing existing ways of working: researchers who prefer to work
          independently remain free to do so. Its rules are provisional. The first cycle, {SITE.name} I, runs with a
          fixed list of problems for one year, after which the project will be assessed publicly, including its
          failures (see the <Link href="/guidelines#assessment">guidelines</Link>).
        </p>

        <SectionTitle>Companion paper</SectionTitle>
        <p>
          The methodology, the research agenda and the first problems are described in{" "}
          {SITE.paper.url ? (
            <a href={SITE.paper.url}>
              <em>{SITE.paper.title}</em>
            </a>
          ) : (
            <em>{SITE.paper.title}</em>
          )}
          , {SITE.paper.authors} ({SITE.paper.year}). To cite it:
        </p>
      </div>
      <CopyBlock label="BibTeX" text={paperBibtex()} className="mt-4" />
      <div className="prose-oc">

        <SectionTitle>How to cite</SectionTitle>
        <p>
          Every problem page has a <em>Cite this problem</em> button with a ready-made BibTeX entry carrying the
          problem’s title, the people who posed it, the address of its page, the date it was posed, its status, and
          the date it was last updated. To cite the database as a whole:
        </p>
      </div>
      <DatabaseCitation />

      <SectionTitle>Moderators</SectionTitle>
      <p className="mb-5 text-justify hyphens-auto max-sm:text-left">
        Every submission is reviewed by one of the moderators before it appears. All moderators are humans.
      </p>
      <ModeratorList />

      <div className="prose-oc">
        <SectionTitle>Data</SectionTitle>
        <p>
          Every problem can be downloaded, with its references, history, contributions and discussion, as Markdown (to
          read, or to give to an AI agent) or as JSON (for programs): use the buttons next to <em>Cite this problem</em>,
          or add <code>/problem.md</code> or <code>/problem.json</code> to a problem’s address. The figures on the{" "}
          <Link href="/progress">progress</Link> page are available as <a href="/progress.json">JSON</a>.
        </p>

        <SectionTitle>Licensing</SectionTitle>
        <p>Unless an entry says otherwise, the text of this database is released under CC BY 4.0. Quotations from the cited sources keep their original licenses.</p>
      </div>
    </>
  );
}

/** Part of the static page; rebuilt only when the moderators change (see lib/data/moderators.ts). */
async function ModeratorList() {
  const moderators = await getModerators();
  if (!moderators.length) return <p className="text-ink-muted">No moderators yet.</p>;

  return (
    // Ruled like a table in a paper: heavier lines above and below, a thin one under the header.
    <table className="w-full border-y-[1.5px] border-ink text-left">
      <thead className="border-b border-rule-strong font-sans text-[0.7rem] tracking-[0.12em] text-ink-subtle uppercase">
        <tr>
          <th className="py-2 pr-6 font-bold">Name</th>
          <th className="py-2 font-bold">Email</th>
        </tr>
      </thead>
      <tbody>
        {moderators.map((m) => (
          <tr key={m.email}>
            <td className="py-2 pr-6 align-top">{m.name}</td>
            <td className="py-2 align-top wrap-anywhere">
              {/* On narrow screens the address breaks after the @ rather than anywhere. ORCID accounts without a
                  public email have only a placeholder address, which is not shown. */}
              {isPlaceholderEmail(m.email) ? (
                <span className="text-ink-subtle">–</span>
              ) : (
                <a href={`mailto:${m.email}`} className="text-brand hover:underline">
                  {m.email.split("@")[0]}@<wbr />
                  {m.email.split("@").slice(1).join("@")}
                </a>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Rendered per request: both citations carry today's date as the date of access. */
async function DatabaseCitation() {
  await connection();
  const context = { origin: siteOrigin(), today: todayIso() };
  return (
    <div className="mt-4 space-y-4">
      <CopyBlock label="Plain text" text={databaseCitation(context)} />
      <CopyBlock label="BibTeX" text={databaseBibtex(context)} />
    </div>
  );
}
