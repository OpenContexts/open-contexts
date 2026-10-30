// The body of the review page: what was submitted, shown the way it will look on the site
// (serif preview) or, for edits, as a diff against the published version.
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, Pill } from "@/components/admin/ui";
import { MarkdownContent } from "@/components/markdown/markdown";
import { FramedBox } from "@/components/ui";
import { getArea } from "@/lib/areas";
import { AI_USE_LABELS, CONTRIBUTION_KIND_LABELS, LINK_RELATION_LABELS, PROBLEM_STATUS_LABELS } from "@/lib/constants";
import type { Problem } from "@/lib/data/problems";
import type { Submission } from "@/lib/data/moderation";
import { formatNames } from "@/lib/format";
import { TextDiff } from "./diff-view";

/** Renders site content in the site's typography inside the admin UI. */
function SitePreview({ children }: { children: ReactNode }) {
  return <div className="font-serif text-[17px]/normal text-ink">{children}</div>;
}

function Warning({ children }: { children: ReactNode }) {
  return <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-amber-900 ring-1 ring-amber-200 ring-inset">{children}</p>;
}

function ProblemRef({ id, problems }: { id: string | null; problems: Map<string, Problem> }) {
  if (!id) return <span className="text-zinc-400">—</span>;
  const p = problems.get(id);
  return p ? (
    <Link href={`/problems/${p.slug}`} className="text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-900" target="_blank">
      Problem {p.number}: {p.title}
    </Link>
  ) : (
    <span className="text-red-600">a problem that no longer exists</span>
  );
}

/** `problems` is keyed by id. */
export function SubmissionContent({ submission, problems }: { submission: Submission; problems: Map<string, Problem> }) {
  switch (submission.type) {
    case "comment":
      return (
        <Card title="Comment">
          <SitePreview>
            <MarkdownContent source={submission.row.body} untrusted />
          </SitePreview>
        </Card>
      );

    case "contribution": {
      const c = submission.row;
      return (
        <Card title={c.title} action={<Pill>{CONTRIBUTION_KIND_LABELS[c.kind]}</Pill>}>
          <div className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-zinc-500">
            <span>Credit: <span className="text-zinc-900">{c.credit}</span></span>
            <span>{AI_USE_LABELS[c.aiUse]}</span>
            {c.url && (
              <a href={c.url} target="_blank" rel="noopener noreferrer nofollow" className="text-zinc-900 underline decoration-zinc-300 underline-offset-2">
                {c.url}
              </a>
            )}
          </div>
          <SitePreview>
            <MarkdownContent source={c.summary} untrusted />
          </SitePreview>
        </Card>
      );
    }

    case "link": {
      const l = submission.row;
      return (
        <Card title="Related link">
          <p className="text-[15px] leading-relaxed">
            <ProblemRef id={l.fromProblemId} problems={problems} /> <span className="text-zinc-500">{LINK_RELATION_LABELS[l.relation]}</span>{" "}
            {l.toProblemId ? <ProblemRef id={l.toProblemId} problems={problems} /> : l.url}
          </p>
          {l.note && <p className="mt-3 text-zinc-600">“{l.note}”</p>}
        </Card>
      );
    }

    case "revision": {
      const r = submission.row;
      const current = problems.get(r.problemId);
      if (!current) return <Warning>The problem this edit belongs to no longer exists.</Warning>;
      const outdated = r.status === "pending" && r.baseVersion !== current.version;
      return (
        <div className="space-y-4">
          {outdated && <Warning>The problem has changed since this edit was written. The diff compares against the current version; approving replaces title, statement and text with this edit.</Warning>}
          {r.status === "approved" && <Warning>This edit has been applied. The diff compares it with the problem as it is now.</Warning>}
          <Card title="What changed">
            <p className="mb-4 text-zinc-700">“{r.changeSummary}”</p>
            <div className="space-y-5">
              {[
                { label: "Title", before: current.title, after: r.title },
                { label: "Statement", before: current.statement.trim(), after: r.statement },
                { label: "Body", before: current.body.trim(), after: r.body },
                ...(r.problemStatus ? [{ label: "Status", before: PROBLEM_STATUS_LABELS[current.status], after: PROBLEM_STATUS_LABELS[r.problemStatus] }] : []),
              ].map((f) => (
                <div key={f.label}>
                  <p className="mb-1 text-xs font-medium text-zinc-500">{f.label}</p>
                  <div className="rounded-md bg-zinc-50 px-3 py-2 ring-1 ring-zinc-100 ring-inset">
                    <TextDiff before={f.before} after={f.after} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Preview of the edited problem">
            <SitePreview>
              <FramedBox title={`Problem ${current.number}: ${r.title}`} className="mt-4">
                <MarkdownContent source={r.statement} untrusted />
              </FramedBox>
              <MarkdownContent source={r.body} untrusted />
            </SitePreview>
          </Card>
        </div>
      );
    }

    case "proposal": {
      const p = submission.row;
      return (
        <div className="space-y-4">
          <Card title="Details">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-zinc-500">Areas</dt>
                <dd>{p.areas.map((a) => getArea(a)?.title ?? a).join(", ")}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Posed by</dt>
                <dd>{formatNames(p.posedBy)}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Tags</dt>
                <dd>{p.tags.length ? p.tags.join(", ") : <span className="text-zinc-400">none</span>}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">AI use</dt>
                <dd>{AI_USE_LABELS[p.aiUse]}</dd>
              </div>
            </dl>
          </Card>
          <Card title="Preview">
            <SitePreview>
              <FramedBox title={`New problem: ${p.title}`} className="mt-4">
                <MarkdownContent source={p.statement} untrusted />
              </FramedBox>
              <MarkdownContent source={p.body} untrusted />
              {p.references.length > 0 && (
                <ol className="mt-6 list-decimal pl-6 text-[15px]">
                  {p.references.map((ref, i) => (
                    <li key={i} className="my-1">
                      {ref.text} {ref.url && <a href={ref.url} target="_blank" rel="noopener noreferrer nofollow" className="text-brand">{ref.url}</a>}
                    </li>
                  ))}
                </ol>
              )}
            </SitePreview>
          </Card>
        </div>
      );
    }
  }
}
