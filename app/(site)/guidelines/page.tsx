import type { Metadata } from "next";
import Link from "next/link";
import { CREDIT_ROLES } from "@/components/explainers/content";
import { Disclosure } from "@/components/explainers/disclosure";
import { AssessmentTargets, PermalinkKeys } from "@/components/explainers/facts";
import { SolvedChecklist, StatusDiagram } from "@/components/explainers/status-diagram";
import { Steps, Tiles } from "@/components/explainers/tiles";
import { FramedBox, PageTitle, SectionTitle } from "@/components/ui";
import { siteOrigin } from "@/lib/cite";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Guidelines" };

const IN_SHORT = [
  { icon: "✍", title: "Under your own name", text: "Every submission is backed by a named human." },
  { icon: "≈", title: "Unpolished is welcome", text: "Partial and provisional work counts; say how far you understand it." },
  { icon: "⚖", title: "Light moderation", text: "Moderators check relevance and format, not correctness." },
  { icon: "◔", title: "Live status", text: "Open → under revision → solved, and back on disputes." },
  { icon: "✓", title: "Understanding over speed", text: "Verifying and explaining earn credit; being first with an AI answer counts little." },
  { icon: "↻", title: "Provisional rules", text: "Revised as needed, and after the one-year assessment." },
];

const RECORDS = [
  { icon: "T", title: "A title" },
  { icon: "∴", title: "The type", text: "claimed solution, partial result, evidence, verification, exposition, challenge, …" },
  { icon: "⚙", title: "The AI use", text: "none; partial (several human–AI iterations); or full (essentially one prompt)" },
  { icon: "✍", title: "A named human", text: "at least one, who takes responsibility for it" },
];

// The governance of the database, following Sec. III of the companion paper, which gives the reasoning; this
// page states the rules. Provisional by design: revised whenever maintaining the database raises unanticipated
// situations, and at the one-year assessment.
export default function GuidelinesPage() {
  const host = siteOrigin().replace(/^https?:\/\//, "");
  return (
    <>
      <PageTitle>Guidelines</PageTitle>
      <p className="mx-auto max-w-140 text-center text-ink-muted">
        How submissions are handled and how a problem&apos;s status changes. The reasoning behind the rules is in the{" "}
        <Link href="/about#paper" className="text-brand hover:underline">
          companion paper
        </Link>
        .
      </p>

      <FramedBox title="In short" tone="gold">
        <Tiles items={IN_SHORT} columns={3} />
      </FramedBox>

      <SectionTitle>I. Participating</SectionTitle>
      <Tiles
        columns={3}
        items={[
          { icon: "◉", title: "Read", text: "Anyone can read everything, without an account." },
          { icon: "✍", title: "Sign up", text: "Under your own name: institutional email, ORCID or GitHub." },
          { icon: "→", title: "Submit", text: <>Use the forms (see <Link href="/contribute" className="text-brand hover:underline">Contribute</Link>), or write to the moderators.</> },
        ]}
      />
      <p className="mt-4 text-center text-sm text-ink-subtle">
        The moderators are listed on the <Link href="/about#moderators" className="text-brand hover:underline">About</Link> page, or write to{" "}
        <a href={`mailto:${SITE.contact}`} className="text-brand hover:underline">
          {SITE.contact}
        </a>
        , for instance about a preprint that addresses a listed problem.
      </p>

      <SectionTitle>II. What every submission records</SectionTitle>
      <Tiles items={RECORDS} columns={4} />
      <p className="mt-4 text-center text-sm text-ink-subtle">Submissions need not be complete or rigorous: say in the summary that it is provisional, and how far you understand it.</p>

      <SectionTitle>III. Moderation</SectionTitle>
      <Steps
        items={[
          { title: "Submission", text: "through the site or by email" },
          { title: "Light check", text: "relevant to the entry? fixed format? a named human? no duplicate? best practices?" },
          { title: "Published", text: "with a timestamp and its contributors' names; or the moderator explains why not" },
        ]}
      />
      <p className="mt-4 text-center text-[0.98rem] text-ink-muted">
        Like a preprint server, moderators filter out only what is unrelated, predatory or unethical. They do not judge
        whether a claimed solution is correct when accepting it, but may do so later as independent researchers, to
        change a problem&apos;s status. Follow your submissions under <em>My submissions</em>.
      </p>

      <SectionTitle id="status" className="scroll-mt-6">
        IV. The status of a problem
      </SectionTitle>
      <p className="mb-6 text-center text-ink-muted">Every problem enters as open. Each change of status is a dated entry in its history.</p>
      <StatusDiagram
        rules={[
          {
            n: 1,
            title: "Open → under revision",
            text: (
              <>
                When a solution is claimed, submitted here or reported to the moderators as a preprint. The community
                then digests it: comments, verifications, replications, independent solutions and clear expositions.
                A solution must resolve the problem <em>as stated</em>; a proof of a weaker or modified statement is a
                partial advance, and the modified statement can be proposed as a new problem.
              </>
            ),
          },
          { n: 2, title: "Under revision → solved", text: <>When a peer-reviewed publication settles the problem, confirmed by the moderators, or when the three conditions below hold.</> },
          {
            n: 3,
            title: "Solved → under revision",
            text: (
              <>
                Only on a substantiated challenge: a written submission, backed by a researcher who fully understands it,
                that identifies a gap or error, reports a failed replication, or points to a contradicting published
                result. Anyone may challenge; the moderators reopen the problem once a researcher independent of both
                sides seconds it.
              </>
            ),
          },
          {
            n: 4,
            title: "Under revision → open",
            text: (
              <>
                When the contributors withdraw the claimed solution (with <em>Withdraw</em> under <em>My submissions</em>
                ); it stays on the entry, marked as withdrawn. Or when the revision shows the statement was flawed:
                ambiguous, ill-posed, or resting on an unproven assumption. The moderators then revise it, keep the
                earlier version and its submissions, and credit whoever found the flaw.
              </>
            ),
          },
        ]}
      />
      <div className="mt-8">
        <SolvedChecklist id="solved" />
      </div>
      <p className="mt-4 text-center text-sm text-ink-subtle">
        After a solution is published, the entry stays open to corrections, simpler proofs, generalizations and follow-ups.
      </p>

      <SectionTitle id="credit" className="scroll-mt-6">
        V. Credit
      </SectionTitle>
      <p className="mb-5 text-center text-ink-muted">Every role is credited by name, on the problem and in its list of contributors.</p>
      <Tiles items={CREDIT_ROLES} columns={3} />
      <h3 className="mt-10 mb-4 text-center font-sans text-sm font-bold">Everything citable has a permanent link</h3>
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
            prompting an AI does not entitle anyone to sole credit. Partial results shared here are credited even when
            someone else reaches the final solution.
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
            co-author the report that covers it. The researchers involved in an entry can also decide together whether a
            result merits its own manuscript.
          </p>
        </div>
      </Disclosure>

      <SectionTitle id="cycles" className="scroll-mt-6">
        VI. The problem list and its cycles
      </SectionTitle>
      <Tiles
        columns={3}
        items={[
          { icon: "◎", title: "Four criteria", text: <>Problems are admitted on clarity, relevance, significance and feasibility (<Link href="/contribute#curation-criteria" className="text-brand hover:underline">Box I</Link>), checked, not refereed.</> },
          { icon: "I", title: "A fixed first list", text: `For ${SITE.name} I, the list is fixed in advance, as a controlled setting for the case study.` },
          {
            icon: "+",
            title: "Additional problems",
            text: (
              <>
                New proposals are{" "}
                <Link href="/additional-problems" className="text-brand hover:underline">
                  kept apart
                </Link>{" "}
                with the same features, so the assessment can report on the main list alone.
              </>
            ),
          },
        ]}
      />
      <p className="mt-4 text-center text-sm text-ink-subtle">
        Problems that become obsolete may be removed. Objections to a long-term goal itself are welcome: send them to the
        moderators, who collect them for the next cycle.
      </p>

      <SectionTitle id="best-practices" className="scroll-mt-6">
        VII. Best practices
      </SectionTitle>
      <p className="text-center text-ink-muted">
        Prompt cautiously, be honest about your understanding, polish before submitting, be polite, avoid duplication,
        and recognize the work you build on: see{" "}
        <Link href="/contribute#best-practices" className="text-brand hover:underline">
          Box III
        </Link>
        .
      </p>

      <SectionTitle id="assessment" className="scroll-mt-6">
        VIII. The one-year assessment
      </SectionTitle>
      <p className="mb-5 text-center text-ink-muted">
        {SITE.name} I tests a hypothesis: that this infrastructure improves credit, broadens participation and
        accelerates progress. After one year it counts as engaging the community if:
      </p>
      <AssessmentTargets />
      <p className="mt-5 text-center text-sm text-ink-subtle">
        The public white paper will also report problems advanced and solved, how quickly (from the dated statuses on{" "}
        <Link href="/progress" className="text-brand hover:underline">
          Progress
        </Link>
        ), the shares of humans and AI, and citations, and revise the criteria, status rules, moderation, list size and
        credit conventions where needed. Negative outcomes are reported with the same care.
      </p>
    </>
  );
}
