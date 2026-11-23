import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { CREDIT_ROLES, PRINCIPLES } from "@/components/explainers/content";
import { Disclosure } from "@/components/explainers/disclosure";
import { AssessmentTargets, CycleTimeline, PermalinkKeys } from "@/components/explainers/facts";
import { Section, SubTitle } from "@/components/explainers/section";
import { SolvedChecklist, StatusDiagram } from "@/components/explainers/status-diagram";
import { Tiles } from "@/components/explainers/tiles";
import { CopyBlock, PageTitle } from "@/components/ui";
import { isPlaceholderEmail } from "@/lib/auth/orcid";
import { getModerators } from "@/lib/data/moderators";
import { databaseBibtex, databaseCitation, paperBibtex, siteOrigin, todayIso } from "@/lib/cite";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

/** The moves between the statuses, numbered as on the arrows of the status diagram. */
const STATUS_RULES = [
  {
    n: 1,
    title: "Open → under revision",
    text: (
      <>
        When a solution is claimed, submitted here or reported to the moderators as a preprint. The community then
        digests it: comments, verifications, replications, independent solutions and clear expositions. A problem
        has one claimed solution at a time; any further solution counts as an independent one. A solution
        must resolve the problem <em>as stated</em>; a proof of a weaker or modified statement is a partial advance,
        and the modified statement can be proposed as a new problem.
      </>
    ),
  },
  { n: 2, title: "Under revision → solved", text: <>When a peer-reviewed publication settles the problem, confirmed by the moderators, or when the three conditions below hold.</> },
  {
    n: 3,
    title: "Solved → under revision",
    text: (
      <>
        Only on a substantiated challenge: a written submission, backed by a researcher who fully understands it, that
        identifies a gap or error, reports a failed replication, or points to a contradicting published result. Anyone
        may challenge; the moderators reopen the problem once a researcher independent of both sides seconds it.
      </>
    ),
  },
  {
    n: 4,
    title: "Under revision → open",
    text: (
      <>
        When the contributors withdraw the claimed solution (with <em>Withdraw</em> under <em>My submissions</em>); it
        stays on the entry, marked as withdrawn. Or when the revision shows the statement was flawed: ambiguous,
        ill-posed, or resting on an unproven assumption. The moderators then revise it, keep the earlier version and
        its submissions, and credit whoever found the flaw.
      </>
    ),
  },
];

// What the project is and the rules it runs by, following Sec. III of the companion paper, which gives the
// reasoning. The rules are provisional: revised whenever maintaining the database raises unanticipated
// situations, and at the one-year assessment.
export default function AboutPage() {
  const host = siteOrigin().replace(/^https?:\/\//, "");
  return (
    <>
      <PageTitle>About</PageTitle>
      <p className="mx-auto max-w-140 text-center text-ink-muted">
        {SITE.name} is a community-curated database of open problems in generalized contextuality, the subfield of
        quantum foundations that studies when experimental statistics resist a classical explanation.
      </p>

      <Section
        id="why"
        title="Why"
        intro={<>Researchers working with AI can now settle well-posed problems fast. That makes good questions more valuable, and brings duplicated effort, hasty results and unclear credit. {SITE.name} tries out an answer for one small field.</>}
      >
        <Tiles items={PRINCIPLES} />
      </Section>

      <Section id="status" title="How a problem moves" intro="Every problem enters as open. Each change of status is a dated entry in its history.">
        <StatusDiagram rules={STATUS_RULES} />
        <div className="mt-8">
          <SolvedChecklist id="solved" />
        </div>
        <p className="mt-4 text-center text-sm text-ink-subtle">
          After a solution is published, the entry stays open to corrections, simpler proofs, generalizations and follow-ups.
        </p>
      </Section>

      <Section id="credit" title="Credit" intro="Every role is credited by name, on the problem and in its list of contributors.">
        <Tiles items={CREDIT_ROLES} columns={3} />
        <SubTitle>Everything citable has a permanent link</SubTitle>
        <PermalinkKeys host={host} />
        <Disclosure label="More on credit, versions and votes">
          <div className="prose-oc text-[0.98rem]">
            <p>
              Posing a question earns credit as much as answering it: cite the problem and the people who posed it when
              you work on it (each problem page has <em>Cite this problem</em>). Taking up a problem posed here without
              acknowledging its posers breaches academic norms.
            </p>
            <p>
              Credit for solving a problem goes primarily to those who understand and verify its solution, and to those
              who make it understandable. Being first with an AI-generated claim carries only moderate weight, and
              prompting an AI does not entitle anyone to sole credit. Partial results shared here are credited even
              when someone else reaches the final solution.
            </p>
            <p>
              Every accepted change to a problem&apos;s title, statement, text or references starts a new version,
              credited to the people named in it; minor corrections such as typos are applied to the current version.
              Changes made by the moderators are credited to the editors unless they name someone. Comments are
              discussion, not contributions.
            </p>
            <p>
              Signed-in readers can vote results up or down. Votes are a signal for readers, not a verdict: a solution
              counts as verified only through recorded verifications. Nobody votes on their own work.
            </p>
            <p>
              Progress is documented in progress reports, and everyone who contributed to a problem is invited to
              co-author the report that covers it. The researchers involved in an entry can also decide together
              whether a result merits its own manuscript.
            </p>
          </div>
        </Disclosure>
      </Section>

      <Section id="case-study" title="The case study" intro={<>{SITE.name} I runs for one year on a fixed list, and is then assessed publicly.</>}>
        <CycleTimeline name={SITE.name} />
        <p className="mx-auto mt-8 max-w-160 text-center text-[0.95rem] text-ink-muted">
          Problems are admitted on four{" "}
          <Link href="/contribute#propose" className="text-brand hover:underline">
            curation criteria
          </Link>
          . The first list is fixed in advance; accepted proposals become{" "}
          <Link href="/additional-problems" className="text-brand hover:underline">
            additional problems
          </Link>
          , with the same features, kept apart so the assessment can report on the main list alone. Objections to a
          long-term goal are welcome: send them to the moderators, to be weighed at the assessment.
        </p>
        <SubTitle>
          <span id="assessment" className="scroll-mt-6">
            Targets for the first year, fixed in advance
          </span>
        </SubTitle>
        <AssessmentTargets />
        <p className="mx-auto mt-4 max-w-160 text-center text-sm text-ink-subtle">
          The white paper will also report what was advanced and solved, how fast (see{" "}
          <Link href="/progress" className="text-brand hover:underline">
            Progress
          </Link>
          ), how much came from humans and from AI, and what changes as a result. Negative outcomes are reported with
          the same care.
        </p>
      </Section>

      <Section id="moderators" title="Moderators" intro="They review every submission before it appears. All moderators are humans.">
        <ModeratorList />
      </Section>

      <Section id="paper" title="Citing and companion paper">
        <p className="text-center">
          Companion paper:{" "}
          {SITE.paper.url ? (
            <a href={SITE.paper.url} className="text-brand hover:underline">
              <em>{SITE.paper.title}</em>
            </a>
          ) : (
            <em>{SITE.paper.title}</em>
          )}
          , {SITE.paper.authors} ({SITE.paper.year}).
        </p>
        <Disclosure label="BibTeX of the paper">
          <CopyBlock label="BibTeX" text={paperBibtex()} />
        </Disclosure>
        <p className="mt-6 mb-3 text-center text-[0.95rem] text-ink-muted">
          Each problem and contribution has <em>Cite this problem</em>. The database as a whole:
        </p>
        <DatabaseCitation />
      </Section>

      <Section title="Data and license">
        <Tiles
          columns={3}
          items={[
            {
              icon: "↓",
              title: "Every problem",
              text: (
                <>
                  as Markdown (for reading, or an AI agent) or JSON: the buttons by <em>Cite this problem</em>, or add{" "}
                  <code className="font-mono text-[0.9em]">/problem.md</code> or <code className="font-mono text-[0.9em]">/problem.json</code> to its address.
                </>
              ),
            },
            {
              icon: "∿",
              title: "The progress figures",
              text: (
                <>
                  as{" "}
                  <a href="/progress.json" className="text-brand hover:underline">
                    JSON
                  </a>
                  , behind the{" "}
                  <Link href="/progress" className="text-brand hover:underline">
                    progress
                  </Link>{" "}
                  page.
                </>
              ),
            },
            { icon: "©", title: "CC BY 4.0", text: "for the text of the database, unless an entry says otherwise. Quotations keep their licenses." },
          ]}
        />
      </Section>
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
    <div>
      <CopyBlock label="Plain text" text={databaseCitation(context)} />
      <Disclosure label="BibTeX of the database">
        <CopyBlock label="BibTeX" text={databaseBibtex(context)} />
      </Disclosure>
    </div>
  );
}
