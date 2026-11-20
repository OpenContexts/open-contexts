import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MarkdownContent } from "@/components/markdown/markdown";
import { mathAsPlainText, MathText } from "@/components/markdown/math-text";
import { ReferenceList } from "@/components/markdown/reference-list";
import { CiteProblem } from "@/components/problems/cite-problem";
import { CommentBox, DiscussionSection } from "@/components/problems/community-sections";
import { contributionLook, KindTag } from "@/components/problems/kind-tag";
import { ProblemBox } from "@/components/problems/problem-box";
import { PermanentLink } from "@/components/problems/permanent-link";
import { ProblemContext } from "@/components/problems/problem-context";
import { ResponseCounts, ResponseList, TargetLine, WithdrawnTag } from "@/components/problems/result-links";
import { VersionList } from "@/components/problems/version-list";
import { VotesProvider, VoteControl } from "@/components/problems/votes";
import { SignedInProvider } from "@/components/submissions/signed-in";
import { ButtonLink, Callout, PageTitle, PartTitle } from "@/components/ui";
import { isSignedIn } from "@/lib/auth/session";
import { siteOrigin } from "@/lib/cite";
import { AI_USE_LABELS, RESULT_KINDS_BY_STATUS } from "@/lib/constants";
import { type Resolved, type ResolvedVersion, resolvePermalink } from "@/lib/data/permalinks";
import { type Problem, problemLabel } from "@/lib/data/problems";
import { formatDate } from "@/lib/format";
import { SITE } from "@/lib/site";

// Permanent links (lib/permalinks.ts): a problem's ("12") and a blog post's ("blog.7") redirect to their
// pages, whose URLs may change; a contribution ("12.3") and a problem version ("12v3") are shown here. A key
// whose material was removed shows that it was, and is never given to anything else.

export async function generateMetadata({ params }: PageProps<"/contribution/[key]">): Promise<Metadata> {
  const resolved = await resolvePermalink((await params).key);
  if (!resolved || resolved.type === "redirect") return {};
  if (resolved.type === "gone") return { title: `${SITE.name} ${resolved.key}`, robots: { index: false } };
  if (resolved.type === "contribution") return { title: `${mathAsPlainText(resolved.contribution.title)} (${SITE.name} ${resolved.contribution.key})` };
  const { problem, version, versions } = resolved;
  // Earlier versions are kept for citations; search engines should send readers to the problem page.
  const current = versions.at(-1)?.version === version.version;
  return {
    title: `${problemLabel({ number: problem.number, title: version.title })}, version ${version.version}`,
    ...(!current && { robots: { index: false } }),
  };
}

export default async function PermalinkPage({ params }: PageProps<"/contribution/[key]">) {
  const resolved = await resolvePermalink((await params).key);
  if (!resolved) notFound();
  switch (resolved.type) {
    case "redirect":
      return redirect(resolved.href);
    case "gone":
      return <Gone permalink={resolved.key} />;
    case "contribution":
      return (
        <SignedInProvider signedIn={isSignedIn()}>
          <VotesProvider problemId={resolved.problem.id}>
            <ContributionView {...resolved} />
          </VotesProvider>
        </SignedInProvider>
      );
    case "version":
      return <VersionView {...resolved} />;
    default:
      throw new Error(`Unknown permalink: ${resolved satisfies never}`);
  }
}

function BackLink({ problem }: { problem: Problem }) {
  return (
    <p className="mt-6 text-[0.92rem]">
      <Link href={`/problems/${problem.slug}`} className="text-brand hover:underline">
        ← Problem {problem.number}: {problem.title}
      </Link>
    </p>
  );
}

function ContributionView({ contribution: c, problem }: Extract<Resolved, { type: "contribution" }>) {
  const look = contributionLook(c.kind);
  const on = { type: "contribution", key: c.key } as const;
  const citable = {
    key: c.key,
    kind: c.kind,
    title: c.title,
    credit: c.credit,
    aiUse: c.aiUse,
    accepted: c.accepted.toISOString().slice(0, 10),
    problem: { number: problem.number, title: problem.title },
  };
  // Whether the problem's status still takes verifications and challenges, and the result can still be checked.
  const checkable = !c.withdrawnAt && (["verification", "challenge"] as const).filter((k) => RESULT_KINDS_BY_STATUS[problem.status].includes(k));
  const respond = (kind: string) => `/problems/${problem.slug}/contribute/result?kind=${kind}&target=${encodeURIComponent(c.key)}`;
  return (
    <>
      <ProblemContext problem={problem} label="Contribution to" />
      <article>
        <header className="mt-8 mb-8 grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-4">
          <VoteControl id={c.id} votes={c.votes} className="-ml-1 pt-5" />
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <KindTag look={look} />
              {c.withdrawnAt && <WithdrawnTag />}
              <span className="text-sm text-ink-subtle tabular-nums">
                {SITE.name} {c.key}
              </span>
            </p>
            <TargetLine kind={c.kind} target={c.target} className="mt-2" />
            <h1 className="mt-2 text-[1.6rem]/tight max-sm:text-[1.35rem]">
              <MathText text={c.title} />
            </h1>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-3 text-ink-muted">
              <span>
                by {c.credit} · accepted {formatDate(c.accepted)} · {AI_USE_LABELS[c.aiUse]}
              </span>
              <ResponseCounts responses={c.responses} />
            </p>
          </div>
        </header>

        {c.withdrawnAt && (
          <Callout className="mb-6">
            Withdrawn by its authors on {formatDate(c.withdrawnAt)}. It stays here as part of the record, with its
            credit, but no longer stands as a result.
          </Callout>
        )}

        <MarkdownContent source={c.summary} untrusted references={problem.references} />
        {c.url && (
          <p className="mt-4">
            <a href={c.url} rel="nofollow ugc noopener noreferrer" className="break-all text-brand hover:underline">
              ↗ {c.url}
            </a>
          </p>
        )}

        <ResponseList responses={c.responses} />
        {checkable && checkable.length > 0 && (
          <p className="mt-5 flex flex-wrap gap-2">
            {checkable.includes("verification") && (
              <ButtonLink href={respond("verification")} variant="secondary" size="sm">
                Verify this result
              </ButtonLink>
            )}
            {checkable.includes("challenge") && (
              <ButtonLink href={respond("challenge")} variant="secondary" size="sm">
                Challenge this result
              </ButtonLink>
            )}
          </p>
        )}

        <CiteProblem contribution={citable} origin={siteOrigin()} />
        <PermanentLink permalink={c.key} />

        {/* The summary cites the problem's references; their list is only needed when it does. */}
        {c.summary.includes("\\cite") && <ReferenceList references={problem.references} />}

        <DiscussionSection
          on={on}
          comments={c.comments}
          commentBox={<CommentBox on={on} references={problem.references} />}
          references={problem.references}
          empty="No comments yet. Questions about this result, checks of its steps and pointers are welcome here."
        />
      </article>
    </>
  );
}

function VersionView({ version: v, versions, problem }: Extract<Resolved, { type: "version" }>) {
  const latest = versions.at(-1);
  const current = latest?.version === v.version;
  // The problem as it stood: this version's text, with today's number, status and names.
  const shown = { ...problem, title: v.title, statement: v.statement, body: v.body, references: v.references };
  return (
    <>
      <BackLink problem={problem} />
      {current ? (
        <Callout>
          Version {v.version} of Problem {problem.number}, the current one, since {formatDate(v.created)}.
        </Callout>
      ) : (
        <Callout className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3.5">
          <span>
            <strong>An earlier version.</strong> Problem {problem.number} as it stood from {formatDate(v.created)}; it
            has changed since.
          </span>
          <ButtonLink href={`/problems/${problem.slug}`} variant="quiet" size="sm">
            Go to the current version →
          </ButtonLink>
        </Callout>
      )}
      {v.version > 1 && <VersionChange version={v} />}
      <article>
        <ProblemBox problem={shown} heading />
        <MarkdownContent source={v.body} references={v.references} className="lettered" />

        <CiteProblem
          problem={{ number: problem.number, slug: problem.slug, title: v.title, posedBy: problem.posedBy, posed: problem.posed, status: problem.status, updated: problem.updated, version: v.version }}
          origin={siteOrigin()}
        />
        <PermanentLink permalink={v.key} />

        <ReferenceList references={v.references} />

        <PartTitle>Versions</PartTitle>
        <VersionList versions={versions} shown={v.version} />
      </article>
    </>
  );
}

/** What changed with this version and who changed it: the credited names, or the editors. */
function VersionChange({ version: v }: { version: ResolvedVersion }) {
  const label = "font-sans text-[0.7rem] font-bold tracking-[0.12em] text-ink-subtle uppercase";
  return (
    <dl className="mt-6 mb-2 grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-6 gap-y-2 border-b border-rule pb-5">
      <dt className={label}>Changed by</dt>
      <dd>
        {v.credit ?? "The editors"}
        {v.credit && v.aiUse && <span className="text-ink-subtle"> · {AI_USE_LABELS[v.aiUse]}</span>}
      </dd>
      <dt className={label}>What changed</dt>
      <dd>{v.changeSummary ?? "No summary recorded."}</dd>
    </dl>
  );
}

function Gone({ permalink }: { permalink: string }) {
  return (
    <>
      <PageTitle>No longer available</PageTitle>
      <p className="text-center">
        {SITE.name} {permalink} pointed to material that has since been withdrawn or removed by the moderators. The
        key stays reserved and is never given to anything else.
      </p>
      <p className="mt-4 text-center">
        <Link href="/problems" className="text-brand hover:underline">
          Browse all problems
        </Link>
      </p>
    </>
  );
}
