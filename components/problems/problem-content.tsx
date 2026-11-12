// The cached body of a problem page: everything except the parts that depend on who is looking.
import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import type { ReactNode } from "react";
import { MarkdownContent, MarkdownInline } from "@/components/markdown/markdown";
import { CiteProblem } from "@/components/problems/cite-problem";
import { ContributionsSection, DiscussionSection } from "@/components/problems/community-sections";
import { historyLook, KindTag } from "@/components/problems/kind-tag";
import { ProblemBox } from "@/components/problems/problem-box";
import { StatusBadge } from "@/components/problems/status";
import { ContributeOptions } from "@/components/submissions/contribute-options";
import { ButtonAnchor, Chip, ChipList, ExpandableList, FramedBox, PartTitle, toneColors } from "@/components/ui";
import { getAgendaItem } from "@/lib/agenda";
import { siteOrigin } from "@/lib/cite";
import { communityTag, getApprovedComments, getApprovedContributions } from "@/lib/data/community";
import { getProblemById, type Problem, statusSince } from "@/lib/data/problems";
import { cn } from "@/lib/cn";
import { formatDate, formatNames } from "@/lib/format";

/**
 * Rendered once and reused for every visitor until something on the page changes: the problem
 * (tag "problems", from getProblems) or what users added to it (communityTag, invalidated by
 * moderation decisions). `commentBox` is passed through uncached, so it can depend on the visitor.
 */
export async function ProblemContent({ id, commentBox }: { id: string; commentBox: ReactNode }) {
  "use cache";
  cacheLife("max");
  cacheTag(communityTag(id), "community");

  const [problem, contributions, comments] = await Promise.all([getProblemById(id), getApprovedContributions(id), getApprovedComments(id)]);
  // The page checked that the problem exists just before; this only covers a deletion in between.
  if (!problem) return null;

  const agenda = problem.agenda.map(getAgendaItem).filter((a) => a !== undefined);
  // Newest first; entries of the same day in reverse order of recording, so the latest is on top.
  const history = problem.history.map((h, i) => ({ ...h, i })).toSorted((a, b) => b.date.localeCompare(a.date) || b.i - a.i);

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
      </dl>

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
        <DownloadLinks slug={problem.slug} number={problem.number} />
      </CiteProblem>

      {problem.references.length > 0 && (
        <>
          <PartTitle>References</PartTitle>
          <ExpandableList limit={10} noun={["reference", "references"]} ordered className="list-decimal pl-6">
            {problem.references.map((r) => (
              <li key={r.text} className="my-1.5">
                {r.url ? (
                  <a href={r.url} rel="noopener" className="text-brand hover:underline">
                    {r.text}
                  </a>
                ) : (
                  r.text
                )}
              </li>
            ))}
          </ExpandableList>
        </>
      )}

      <PartTitle>Progress and history</PartTitle>
      {history.length ? (
        <ol>
          {history.map((h, i) => {
            const look = historyLook(h);
            return (
              <li key={i} className="grid grid-cols-[6.6rem_minmax(0,1fr)] gap-x-5 max-sm:grid-cols-[4.8rem_minmax(0,1fr)] max-sm:gap-x-3">
                <span className="pt-3 text-right text-[0.95rem] text-ink-subtle tabular-nums max-sm:text-sm">{formatDate(h.date)}</span>
                {/* A timeline: one line down the entries, with a marker in the colour of each entry's kind. */}
                <div className="relative border-l-2 border-rule py-3 pl-5 max-sm:pl-4">
                  <span aria-hidden className={cn("absolute top-[1.15rem] -left-[7px] size-3 rounded-full ring-3 ring-paper", toneColors[look.tone].bg)} />
                  <KindTag look={look} className="relative -top-px mr-2" />
                  <MarkdownInline source={h.text} references={problem.references} />
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-ink-muted">No entries yet.</p>
      )}

      <ContributionsSection items={contributions} references={problem.references} />

      <section className="mt-8 rounded border border-rule bg-surface px-5 pt-4 pb-3.5">
        <h3 className="mb-3 font-sans text-sm font-bold">Contribute to this problem</h3>
        <ContributeOptions slug={problem.slug} />
        <p className="mt-2.5 text-sm text-ink-subtle">
          You need to be signed in. Every contribution is reviewed by a moderator before it appears, and is credited
          to the people you name.
        </p>
      </section>

      <DiscussionSection comments={comments} commentBox={commentBox} references={problem.references} />
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
      download={`opencontext-problem-${number}.${f.ext}`}
      variant="quiet"
      size="sm"
      title={`The statement, text, references, history, contributions and discussion, ${f.hint}.`}
    >
      <span aria-hidden className="text-base/none">↓</span>
      {f.label}
    </ButtonAnchor>
  ));
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
