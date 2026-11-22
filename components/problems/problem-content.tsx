// The cached body of a problem page: everything except the parts that depend on who is looking.
import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import type { ReactNode } from "react";
import { MarkdownContent, MarkdownInline } from "@/components/markdown/markdown";
import { ReferenceList } from "@/components/markdown/reference-list";
import { CiteProblem } from "@/components/problems/cite-problem";
import { ContributionsSection, DiscussionSection } from "@/components/problems/community-sections";
import { historyLook, KindTag } from "@/components/problems/kind-tag";
import { PermanentLink } from "@/components/problems/permanent-link";
import { ProblemBox } from "@/components/problems/problem-box";
import { SolutionSummary } from "@/components/problems/solution-summary";
import { versionCredit } from "@/components/problems/version-list";
import { StatusBadge } from "@/components/problems/status";
import { ContributeBox } from "@/components/submissions/contribute-options";
import { ButtonAnchor, ButtonLink, Chip, ChipList, DownloadIcon, ExpandableList, FramedBox, PartTitle, toneColors } from "@/components/ui";
import { getAgendaItem } from "@/lib/agenda";
import { siteOrigin } from "@/lib/cite";
import { type ApprovedContribution, communityTag, getApprovedComments, getApprovedContributions } from "@/lib/data/community";
import { activeContributors, type Contributor, contributorsOf, getProposer } from "@/lib/data/contributors";
import { getVersions, type VersionSummary } from "@/lib/data/permalinks";
import { getProblemById, type Problem, statusSince } from "@/lib/data/problems";
import { cn } from "@/lib/cn";
import { AI_USE_LABELS } from "@/lib/constants";
import { SITE } from "@/lib/site";
import { formatDate, formatNames } from "@/lib/format";
import { permalinkPath, problemKey } from "@/lib/permalinks";

/** How many entries of the history show before "Show more"; the newest. */
const HISTORY_SHOWN = 8;

/**
 * Rendered once and reused for every visitor until something on the page changes: the problem
 * (tag "problems", from getProblems) or what users added to it (communityTag, invalidated by
 * moderation decisions). `commentBox` is passed through uncached, so it can depend on the visitor.
 */
export async function ProblemContent({ id, commentBox }: { id: string; commentBox: ReactNode }) {
  "use cache";
  cacheLife("max");
  cacheTag(communityTag(id), "community");

  const [problem, contributions, comments, versionList, proposer] = await Promise.all([
    getProblemById(id),
    getApprovedContributions(id),
    getApprovedComments("problem", id),
    getVersions(id),
    getProposer(id),
  ]);
  // The page checked that the problem exists just before; this only covers a deletion in between.
  if (!problem) return null;

  const agenda = problem.agenda.map(getAgendaItem).filter((a) => a !== undefined);
  // Newest first; entries of the same day in reverse order of recording, so the latest is on top.
  const history = problem.history.map((h, i) => ({ ...h, i })).toSorted((a, b) => b.date.localeCompare(a.date) || b.i - a.i);
  // The versions the entries started, which they link to with who made the change.
  const versions = new Map(versionList.map((v) => [v.version, v]));
  // The accepted contributions the entries record, which they link to with who made them.
  const byKey = new Map(contributions.flatMap((c) => (c.key ? [[c.key, c] as const] : [])));
  const contributors = activeContributors(contributorsOf({ problem, contributions, versions: versionList, proposer }));

  return (
    <article>
      <ProblemBox problem={problem} heading />

      {/* Status, agenda and the last update in one row; the people who posed it get the full width below. */}
      <dl className="mb-10 grid grid-cols-2 gap-x-10 gap-y-4 border-b border-rule pb-5 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
        <Fact label="Status">
          <StatusBadge status={problem.status} className="relative -top-px" />{" "}
          <span className="text-[0.95rem] text-ink-subtle">since {formatDate(statusSince(problem))}</span>
        </Fact>
        <Fact label="Agenda" className="max-sm:order-1 max-sm:col-span-2">
          {agenda.map((a) => (
            <Link key={a.id} href={`/problems?agenda=${a.id}`} className="block text-brand hover:underline">
              {a.numeral}. {a.title}
            </Link>
          ))}
        </Fact>
        <Fact label="Updated" className="text-right">
          {formatDate(problem.updated)}
        </Fact>
        <Fact label={problem.posedBy.length > 0 ? "Posed by" : "Posed"} className="col-span-full max-sm:order-2">
          {problem.posedBy.length > 0 && formatNames(problem.posedBy)}
          <span className="text-ink-subtle">
            {problem.posedBy.length > 0 && ", "}
            {formatDate(problem.posed)}
          </span>
        </Fact>
        {contributors.length > 0 && (
          <Fact label="Contributors" className="col-span-full max-sm:order-3">
            <ContributorNames contributors={contributors} slug={problem.slug} />
          </Fact>
        )}
      </dl>

      <SolutionSummary contributions={contributions} slug={problem.slug} status={problem.status} />

      <MarkdownContent source={problem.body} references={problem.references} className="lettered" />

      {problem.tags.length > 0 && (
        <ChipList className="mt-6">
          {problem.tags.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </ChipList>
      )}

      {problem.note.trim() && (
        <FramedBox title="Note" tone="info" className="mt-10">
          <MarkdownContent source={problem.note} references={problem.references} />
        </FramedBox>
      )}

      <CiteProblem problem={pick(problem)} origin={siteOrigin()}>
        <ButtonLink href={`/problems/${problem.slug}/versions`} variant="quiet" size="sm" title="Every version of the statement and text, each with its own permanent link.">
          <span aria-hidden className="text-base/none">↺</span>
          See all versions
        </ButtonLink>
        <DownloadLinks slug={problem.slug} number={problem.number} />
      </CiteProblem>
      <PermanentLink permalink={problemKey(problem.number)} />

      <ReferenceList references={problem.references} />

      <PartTitle>Progress and history</PartTitle>
      {history.length ? (
        <ExpandableList limit={HISTORY_SHOWN} noun={["older entry", "older entries"]} ordered>
          {history.map((h, i) => {
            const look = historyLook(h);
            return (
              // The date in a column of its own beside the timeline; on small screens above the entry, next to its
              // kind, so that the text has the whole width.
              <li key={i} className="grid grid-cols-[6.6rem_minmax(0,1fr)] gap-x-5 max-sm:block">
                <span className="pt-3 text-right text-[0.95rem] text-ink-subtle tabular-nums max-sm:hidden">{formatDate(h.date)}</span>
                {/* A timeline: one line down the entries, with a marker in the colour of each entry's kind. */}
                <div className="relative border-l-2 border-rule py-3 pl-5 max-sm:ml-1.5 max-sm:py-2.5 max-sm:pl-4 max-sm:text-[0.97rem]">
                  <span aria-hidden className={cn("absolute top-[1.15rem] -left-[7px] size-3 rounded-full ring-3 ring-paper", toneColors[look.tone].bg)} />
                  <KindTag look={look} className="relative -top-px mr-2" />
                  <span className="mr-2 text-sm text-ink-subtle tabular-nums sm:hidden">{formatDate(h.date)}</span>
                  <br className="sm:hidden" />
                  <MarkdownInline source={h.text} references={problem.references} />
                  {h.version && versions.has(h.version) && <VersionLine version={versions.get(h.version)!} />}
                  {h.contribution && byKey.has(h.contribution) && <ContributionLine contribution={byKey.get(h.contribution)!} />}
                </div>
              </li>
            );
          })}
        </ExpandableList>
      ) : (
        <p className="text-ink-muted">No entries yet.</p>
      )}

      <ContributionsSection items={contributions} references={problem.references} slug={problem.slug} />

      <ContributeBox slug={problem.slug} status={problem.status} />

      <DiscussionSection on={{ type: "problem", slug: problem.slug }} comments={comments} commentBox={commentBox} references={problem.references} />
    </article>
  );
}

/** The problem with everything recorded about it, as one file (see lib/data/problem-export.ts). */
function DownloadLinks({ slug, number }: { slug: string; number: number }) {
  const formats = [
    { ext: "md", label: "Markdown", hint: "for reading, or to give to an AI agent" },
    { ext: "json", label: "JSON", hint: "for programs" },
  ];
  return formats.map((f) => (
    <ButtonAnchor
      key={f.ext}
      href={`/problems/${slug}/problem.${f.ext}`}
      download={`opencontexts-problem-${number}.${f.ext}`}
      variant="quiet"
      size="sm"
      title={`The statement, text, references, history, contributions and discussion, ${f.hint}.`}
    >
      <DownloadIcon className="size-3.5" />
      {f.label}
    </ButtonAnchor>
  ));
}

/** The most recently active contributors by name, the rest as a number, and the link to the full list. */
function ContributorNames({ contributors, slug }: { contributors: Contributor[]; slug: string }) {
  const SHOWN = 4;
  const names = contributors.slice(0, SHOWN).map((c) => c.name);
  const rest = contributors.length - names.length;
  return (
    <>
      {formatNames(rest > 0 ? [...names, `${rest} ${rest === 1 ? "other" : "others"}`] : names)}
      <span className="text-ink-subtle"> · </span>
      <Link href={`/problems/${slug}/contributors`} className="text-brand hover:underline">
        See all and what they did →
      </Link>
    </>
  );
}

/** Under a history entry that started a version: the link to that version, and who made the change. */
function VersionLine({ version: v }: { version: VersionSummary }) {
  return (
    <p className="mt-1 text-sm text-ink-subtle">
      <Link href={permalinkPath(v.key)} className="text-brand tabular-nums hover:underline" title="This version of the problem, with its own permanent link">
        Version {v.version}
      </Link>{" "}
      {versionCredit(v)}
    </p>
  );
}

/** Under a history entry that records an accepted contribution: the link to it, and who made it. */
function ContributionLine({ contribution: c }: { contribution: ApprovedContribution }) {
  return (
    <p className="mt-1 text-sm text-ink-subtle">
      <Link href={permalinkPath(c.key!)} className="text-brand tabular-nums hover:underline" title="This contribution, with its own permanent link">
        {SITE.name} {c.key}
      </Link>{" "}
      by {c.credit} · {AI_USE_LABELS[c.aiUse]}
    </p>
  );
}

function Fact({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="font-sans text-[0.7rem] font-bold tracking-[0.12em] text-ink-subtle uppercase">{label}</dt>
      <dd className="mt-1 text-[0.98rem]">{children}</dd>
    </div>
  );
}

/** Only what the citation needs goes to the browser, not the whole text. */
function pick({ number, slug, title, posedBy, posed, status, updated }: Problem) {
  return { number, slug, title, posedBy, posed, status, updated };
}
