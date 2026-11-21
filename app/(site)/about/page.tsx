import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { PRINCIPLES } from "@/components/explainers/content";
import { AssessmentTargets, CycleTimeline } from "@/components/explainers/facts";
import { Tiles } from "@/components/explainers/tiles";
import { CopyBlock, PageTitle, SectionTitle } from "@/components/ui";
import { isPlaceholderEmail } from "@/lib/auth/orcid";
import { getModerators } from "@/lib/data/moderators";
import { databaseBibtex, databaseCitation, paperBibtex, siteOrigin, todayIso } from "@/lib/cite";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <PageTitle>About</PageTitle>
      <p className="mx-auto max-w-140 text-center text-ink-muted">
        {SITE.name} is a community-curated database of open problems in generalized contextuality, the subfield of
        quantum foundations that studies when experimental statistics resist a classical explanation.
      </p>

      <SectionTitle>Why</SectionTitle>
      <p className="mx-auto mb-6 max-w-140 text-center text-[0.98rem] text-ink-muted">
        Researchers working with AI can now settle well-posed problems fast. That makes good questions more valuable,
        and brings duplicated effort, hasty results and unclear credit. {SITE.name} tries out an answer for one small
        field, built on four principles:
      </p>
      <Tiles items={PRINCIPLES} />
      <p className="mt-5 text-center text-sm text-ink-subtle">
        It adds an option rather than replacing existing ways of working: anyone may keep working independently.
      </p>

      <SectionTitle>The first cycle</SectionTitle>
      <CycleTimeline name={SITE.name} />
      <p className="mt-8 mb-4 text-center text-[0.98rem] text-ink-muted">After one year, the case study counts as engaging the community if, fixed in advance:</p>
      <AssessmentTargets />
      <p className="mt-4 text-center text-sm text-ink-subtle">
        Failures included; see the <Link href="/guidelines#assessment" className="text-brand hover:underline">guidelines</Link> and the{" "}
        <Link href="/progress" className="text-brand hover:underline">
          progress so far
        </Link>
        .
      </p>

      <SectionTitle id="paper" className="scroll-mt-6">
        Companion paper
      </SectionTitle>
      <p className="text-center">
        {SITE.paper.url ? (
          <a href={SITE.paper.url} className="text-brand hover:underline">
            <em>{SITE.paper.title}</em>
          </a>
        ) : (
          <em>{SITE.paper.title}</em>
        )}
        , {SITE.paper.authors} ({SITE.paper.year}).
      </p>
      <p className="mt-1 mb-4 text-center text-sm text-ink-subtle">The methodology, the research agenda and the first problems, with the reasoning behind every rule.</p>
      <CopyBlock label="BibTeX" text={paperBibtex()} />

      <SectionTitle>How to cite</SectionTitle>
      <p className="mb-4 text-center text-[0.98rem] text-ink-muted">
        Each problem and contribution has <em>Cite this problem</em> with a ready BibTeX entry. The database as a whole:
      </p>
      <DatabaseCitation />

      <SectionTitle id="moderators" className="scroll-mt-6">
        Moderators
      </SectionTitle>
      <p className="mb-5 text-center text-[0.98rem] text-ink-muted">They review every submission before it appears. All moderators are humans.</p>
      <ModeratorList />

      <SectionTitle>Data and license</SectionTitle>
      <Tiles
        columns={3}
        items={[
          {
            icon: "↓",
            title: "Every problem",
            text: (
              <>
                as Markdown (for reading, or an AI agent) or JSON: the buttons by <em>Cite this problem</em>, or add <code className="font-mono text-[0.9em]">/problem.md</code> or{" "}
                <code className="font-mono text-[0.9em]">/problem.json</code> to its address.
              </>
            ),
          },
          {
            icon: "∿",
            title: "The progress figures",
            text: (
              <>
                as <a href="/progress.json" className="text-brand hover:underline">JSON</a>, behind the <Link href="/progress" className="text-brand hover:underline">progress</Link> page.
              </>
            ),
          },
          { icon: "©", title: "CC BY 4.0", text: "for the text of the database, unless an entry says otherwise. Quotations keep their licenses." },
        ]}
      />
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
