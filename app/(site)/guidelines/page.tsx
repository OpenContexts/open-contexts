import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle, SectionTitle } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Guidelines" };

// The governance of the database, following Sec. II of the companion paper. Provisional by design:
// revised whenever maintaining the database raises unanticipated situations, and at the one-year assessment.
export default function GuidelinesPage() {
  return (
    <div className="prose-oc">
      <PageTitle>Guidelines</PageTitle>
      <p>
        These rules govern how submissions are handled and how the status of a problem changes. They ask nothing
        of contributors beyond the short format described below. They are provisional: the moderators revise them
        whenever maintaining the database raises situations they did not anticipate, and in light of the one-year
        assessment.
      </p>

      <SectionTitle>I. Participating</SectionTitle>
      <p>
        Anyone can read the database. To contribute, create an account under your own name, with the email address
        of your university or research institute or with GitHub, and send a submission: a comment, a result on an
        existing problem, a reference, a suggested edit, or a new problem. See{" "}
        <Link href="/contribute">how to contribute</Link>.
      </p>
      <p>
        You can also write to the moderators (listed on the <Link href="/about">About</Link> page, or at{" "}
        <a href={`mailto:${SITE.contact}`}>{SITE.contact}</a>), for instance to point out a preprint that addresses
        a listed problem. Results posted elsewhere are monitored by the moderators and added to the problem’s entry.
      </p>

      <SectionTitle>II. What every submission records</SectionTitle>
      <p>Every result submitted to a problem records, in a fixed format:</p>
      <ul>
        <li>a <strong>title</strong>;</li>
        <li>
          the <strong>type of material</strong>: a claimed solution, a partial or negative result, a reformulation,
          computational evidence, an independent verification, an exposition, a challenge, and so on;
        </li>
        <li>
          the extent to which <strong>AI tools</strong> were used: none; partially, when the material was produced
          over several human–AI iterations; or fully, when it is essentially the output of a single prompt;
        </li>
        <li>
          the <strong>name of at least one human</strong> who takes responsibility for the material.
        </li>
      </ul>
      <p>
        Submissions need not be complete or rigorous. A promising but unpolished argument, an incomplete proof or a
        partially verified computation is welcome; say in its summary that it is provisional, and how far you
        understand it.
      </p>

      <SectionTitle>III. Moderation</SectionTitle>
      <p>
        Every submission is reviewed by a moderator before it appears, and each decision is logged. Routing every
        addition through the moderators, instead of opening the database to direct editing, keeps each contribution
        tied to a named human and excludes automated or anonymous mass submissions.
      </p>
      <p>
        The check is deliberately light: is the submission relevant to the entry, in the fixed format, and backed by
        a named human? Moderators filter out only content that is unrelated, predatory or otherwise unethical. They
        do not judge the correctness of a claimed solution, or the quality of its presentation, when accepting it.
        If a submission is not accepted, the moderator explains why, and you can follow its status under{" "}
        <em>My submissions</em>.
      </p>
      <p>
        Moderators may judge the correctness of existing work as independent researchers, in order to change the
        status of a problem, following the rules below.
      </p>

      <SectionTitle id="status">IV. The status of a problem</SectionTitle>
      <p>
        Every problem carries a live status, <em>open</em>, <em>under revision</em> or <em>solved</em>, and every
        change of status is a dated entry in the problem’s history. A problem enters the database as open.
      </p>
      <p>
        <strong>From open to under revision.</strong> When a solution is claimed, whether submitted to the entry or
        reported to the moderators as a preprint, the problem is placed under revision. Researchers can then submit
        revisions of, comments on and verifications of the claimed solution; the moderators may comment as well.
        Submissions at this stage should put human understanding first: commentary on the existing results,
        independent solutions, verification, replication, or polished, clearly written accounts.
      </p>
      <p>
        A solution must resolve the problem <em>as stated</em>, by the criterion for a solution fixed in its
        statement. A proof of a weakened or otherwise modified statement is a partial advance, not a solution: it is
        recorded as such, the original problem stays open, and the modified statement can be proposed as a new
        problem.
      </p>
      <p>
        <strong>From under revision to solved.</strong> If the solution has been published in a peer-reviewed
        journal, the problem is marked solved once the moderators have confirmed that the published work settles the
        problem as stated. Otherwise, it is marked solved only when all of the following hold:
      </p>
      <ol>
        <li>
          A human-backed account of the solution exists: at least one human contributor claims full understanding of
          it, and it is available in a preprint repository that provides a digital object identifier (DOI). Claimed
          solutions that are entirely AI-generated, or whose contributors do not claim to understand them fully, do
          not solve a problem; they keep it under revision.
        </li>
        <li>
          At least three skilled researchers who are independent of the solution’s contributors and declare no
          conflict of interest (moderators, for example) have verified the solution, declaring that they understand
          it and agree with its claim. They may do so by submitting a verification to the entry, by writing to the
          moderators, or by sharing further material, such as an explanatory manuscript. A machine-checked
          formalization strengthens this verification but does not replace it.
        </li>
        <li>
          There is no current dispute of the solution. An active dispute must either be resolved within the
          community until its authors withdraw it, or be marked as resolved by a moderator when there is overwhelming
          evidence that it is.
        </li>
      </ol>
      <p>
        <strong>From solved to under revision.</strong> A solved problem is reopened only on a substantiated
        challenge: a written submission to the entry, backed by a researcher who claims to fully understand it, that
        identifies a gap or error in the account of the solution, reports a failed replication of a computation or
        construction, or points to a published result that contradicts the claim. Any researcher may submit a
        challenge. The moderators reopen the problem once a researcher independent of both the challenger and the
        solution’s contributors, possibly another moderator, seconds it.
      </p>
      <p>
        <strong>From under revision to open.</strong> A problem under revision returns to open in two cases. Its
        contributors may withdraw the claimed solution, for instance after the open discussion around it (write to
        the moderators to do so); the material stays attached to the entry as a provisional or negative result, with
        the credit this implies. Or the revision may show that the statement of the problem itself was significantly
        flawed: ambiguous, ill-posed, or dependent on an unstated assumption that lacks proof. The moderators then
        return the problem to open with a revised statement, keep the earlier version and the submissions attached,
        and credit the researcher who identified the flaw, since clarifying a question is itself a valuable
        contribution.
      </p>
      <p>
        Once a solution has been published, the entry stays open to further updates: corrections, simpler proofs,
        generalizations and follow-ups.
      </p>

      <SectionTitle id="credit">V. Credit</SectionTitle>
      <p>
        The database records who posed each problem, who advanced it, who verified a solution, who found a flaw and
        who made a result readable, so that every contributor is credited directly and visibly. Posing a
        well-motivated question earns credit as much as answering one: cite the problem, and the people who posed it,
        when you work on it. Every problem page has a <em>Cite this problem</em> button. Taking up a problem posed
        here without acknowledging its posers is a breach of academic norms.
      </p>
      <p>
        Within the database, credit for solving a problem goes primarily to those who understand and verify its
        solution, and to those who make it understandable. Being the first to submit an AI-generated claimed
        solution therefore carries only moderate weight, and prompting an AI does not entitle anyone to sole credit
        for the eventual solution: an AI-generated purported solution can meaningfully accelerate a research
        direction, but it does not, on its own, solve an open problem. Partial results that are shared here are
        credited too, even when the final solution is reached by someone else.
      </p>
      <p>
        Progress on the problems will be documented in progress reports. Everyone who contributed to the discussion
        or advancement of a problem will be invited to collaborate on, and share authorship of, the report that
        covers it. The researchers involved in an entry can also decide together whether a result merits a proper
        manuscript.
      </p>

      <SectionTitle id="cycles">VI. The problem list and its cycles</SectionTitle>
      <p>
        A problem is added to the list only if it meets the four{" "}
        <Link href="/contribute#curation-criteria">curation criteria</Link>: clarity, relevance, significance and
        feasibility. Proposed problems are checked against these criteria by other researchers and the moderators,
        not heavily refereed.
      </p>
      <p>
        For the first cycle, {SITE.name} I, the list of problems is fixed in advance, to provide a controlled setting
        for the case study. New proposals are welcome and are kept for consideration in the next cycle; the
        moderators may admit new problems earlier, depending on the engagement with, and the results of, this first
        cycle. A problem that becomes obsolete or no longer relevant may be removed.
      </p>
      <p>
        The long-term goals that organize the list are provisional too. Objections to a goal itself, the assumptions
        or motivations it rests on and what the goal would lose if the objection held, are welcome: send them to the
        moderators, who will collect them as starting material for the next cycle.
      </p>

      <SectionTitle id="best-practices">VII. Best practices</SectionTitle>
      <p>
        Prompt cautiously, be honest about how far you understand what you submit, avoid single-prompt outputs and
        duplication, be polite, and recognize the work you build on. The{" "}
        <Link href="/contribute#best-practices">best practices</Link> spell these out.
      </p>

      <SectionTitle id="assessment">VIII. The one-year assessment</SectionTitle>
      <p>
        {SITE.name} I is a test of a hypothesis: that this kind of infrastructure improves the attribution of
        credit, broadens participation and accelerates progress. One year after launch, the project will be assessed
        publicly in a community-facing report, against criteria fixed in advance. It will report how many problems
        were advanced or solved, how quickly, and how much of each advance came from humans, from AI or from their
        collaboration (as recorded in each submission’s AI-use field); how many researchers, from how many
        institutions, took part; and whether work that resolves listed problems cites the database and the people who
        posed them. The dated status changes behind these figures are shown on the{" "}
        <Link href="/progress">progress</Link> page.
      </p>
      <p>
        The assessment will state which parts of the design are open to revision, among them the curation criteria,
        the status rules above, the moderation load, the size of the list and the credit conventions, and whether to
        extend the project to further subfields. Negative outcomes will be reported with the same care as positive
        ones.
      </p>
    </div>
  );
}
