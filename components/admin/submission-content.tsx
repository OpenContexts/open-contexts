// The body of the review page: what was submitted, shown the way it will look on the site
// (serif preview) or, for edits, as a diff against the published version.
import type { ReactNode } from "react";
import { Card, Notice, Pill } from "@/components/admin/ui";
import { MarkdownContent } from "@/components/markdown/markdown";
import { FramedBox } from "@/components/ui";
import { getAgendaItem } from "@/lib/agenda";
import { AI_USE_LABELS } from "@/lib/constants";
import type { Reference } from "@/lib/db/schema";
import type { Problem } from "@/lib/data/problems";
import type { Submission } from "@/lib/data/moderation";
import { formatDate, formatNames } from "@/lib/format";
import { TextDiff } from "./diff-view";

/** Renders site content in the site's typography inside the admin UI. */
function SitePreview({ children }: { children: ReactNode }) {
  return <div className="font-serif text-[17px]/normal text-ink">{children}</div>;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-zinc-900">{children}</dd>
    </div>
  );
}

/** `problems` is keyed by id. `references`: what comments, results and edits cite, those of their problem or post. */
export function SubmissionContent({ submission, problems, references }: { submission: Submission; problems: Map<string, Problem>; references?: Reference[] }) {
  switch (submission.type) {
    case "comment":
      return (
        <Card>
          <SitePreview>
            <MarkdownContent source={submission.row.body} untrusted references={references} />
          </SitePreview>
        </Card>
      );

    case "contribution": {
      const c = submission.row;
      // Only worth showing when someone else is credited than the person who sent it.
      const credit = c.credit.trim() !== c.author.name.trim() ? c.credit : undefined;
      return (
        <Card>
          <h2 className="text-lg font-semibold text-zinc-900">{c.title}</h2>
          {c.url && (
            <a href={c.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-0.5 block truncate text-sm text-sky-700 hover:underline">
              ↗ {c.url}
            </a>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Pill>{AI_USE_LABELS[c.aiUse].replace(/^./, (ch) => ch.toUpperCase())}</Pill>
            {credit && <Pill>Credit: {credit}</Pill>}
          </div>
          <div className="mt-4 border-t border-zinc-100 pt-4">
            <SitePreview>
              <MarkdownContent source={c.summary} untrusted references={references} />
            </SitePreview>
          </div>
          {c.kind === "reference" && c.url && <Notice className="mt-4">Approving also adds this reference to the problem&apos;s reference list.</Notice>}
        </Card>
      );
    }

    case "revision": {
      const r = submission.row;
      const current = problems.get(r.problemId);
      if (!current) return <Notice tone="warning">The problem this edit belongs to no longer exists.</Notice>;
      const outdated = r.status === "pending" && r.baseVersion !== current.version;
      return (
        <div className="space-y-4">
          {outdated && <Notice tone="warning">The problem has changed since this edit was written. The diff compares against the current version; approving replaces title, statement and text with this edit.</Notice>}
          {r.status === "approved" && <Notice tone="warning">This edit has been applied. The diff compares it with the problem as it is now.</Notice>}
          <Card title="What changed">
            <p className="mb-5 rounded-lg bg-zinc-50 px-4 py-3 text-zinc-700 ring-1 ring-zinc-100 ring-inset">
              <span className="mb-0.5 block text-xs font-medium text-zinc-500">Summary of the change</span>
              {r.changeSummary}
            </p>
            <div className="space-y-5">
              {[
                { label: "Title", before: current.title, after: r.title },
                { label: "Statement", before: current.statement.trim(), after: r.statement },
                { label: "Body", before: current.body.trim(), after: r.body },
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
                <MarkdownContent source={r.statement} untrusted references={references} />
              </FramedBox>
              <MarkdownContent source={r.body} untrusted references={references} />
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
              <Fact label="Agenda">{p.agenda.map((a) => getAgendaItem(a)?.title ?? a).join(", ")}</Fact>
              <Fact label="Posed by">{formatNames(p.posedBy)}</Fact>
              <Fact label="Tags">{p.tags.length ? p.tags.join(", ") : <span className="text-zinc-400">none</span>}</Fact>
              <Fact label="AI use">{AI_USE_LABELS[p.aiUse].replace(/^./, (ch) => ch.toUpperCase())}</Fact>
            </dl>
          </Card>
          <Card title="Preview">
            <SitePreview>
              <FramedBox title={`New problem: ${p.title}`} className="mt-4">
                <MarkdownContent source={p.statement} untrusted references={p.references} />
              </FramedBox>
              <MarkdownContent source={p.body} untrusted references={p.references} />
              <ReferencePreview references={p.references} />
            </SitePreview>
          </Card>
        </div>
      );
    }

    case "post": {
      const p = submission.row;
      return (
        <div className="space-y-4">
          <Card title="Details">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Fact label="Authors">{formatNames(p.authors)}</Fact>
              <Fact label="Published">{p.publishedAt ? formatDate(p.publishedAt) : <span className="text-zinc-400">not yet</span>}</Fact>
            </dl>
          </Card>
          <Card title="Preview">
            <SitePreview>
              <h2 className="mt-2 mb-4 text-center text-[1.6rem]/tight font-bold">{p.title}</h2>
              <MarkdownContent source={p.body} untrusted references={p.references} />
              <ReferencePreview references={p.references} />
            </SitePreview>
          </Card>
        </div>
      );
    }
  }
}

function ReferencePreview({ references }: { references: Reference[] }) {
  if (!references.length) return null;
  return (
    <ol className="mt-6 list-decimal pl-6 text-[15px]">
      {references.map((ref, i) => (
        <li key={i} className="my-1">
          {ref.text} {ref.url && <a href={ref.url} target="_blank" rel="noopener noreferrer nofollow" className="text-brand">{ref.url}</a>}
        </li>
      ))}
    </ol>
  );
}
