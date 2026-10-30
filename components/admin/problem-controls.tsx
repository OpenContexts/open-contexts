"use client";

import { useState, useTransition } from "react";
import { deleteProblem } from "@/app/admin/problems/actions";
import { AdminButton, AdminDialog, AdminInput, DialogActions, RowMenu } from "@/components/admin/ui";
import type { ProblemActivity } from "@/lib/data/moderation";
import { plural } from "@/lib/format";

type Target = { id: string; number: number; title: string; slug: string };

const downloadHref = (p: Target) => `/admin/problems/${p.id}/download`;

/** The "⋮" menu at the end of a row in the problem list. */
export function ProblemActions({ problem, activity }: { problem: Target; activity?: ProblemActivity }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <>
      <RowMenu
        label={`Actions for problem ${problem.number}`}
        items={[
          { label: "Edit", href: `/admin/problems/${problem.id}` },
          { label: "View on the site ↗", href: `/problems/${problem.slug}`, external: true },
          { label: "Download .md", href: downloadHref(problem), download: `${problem.slug}.md` },
          { label: "Delete…", onSelect: () => setDeleting(true), danger: true, separated: true },
        ]}
      />
      <DeleteProblemDialog problem={problem} activity={activity} open={deleting} onClose={() => setDeleting(false)} />
    </>
  );
}

/** For the editor page. */
export function DeleteProblemButton({ problem, activity }: { problem: Target; activity?: ProblemActivity }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <>
      <AdminButton variant="danger" onClick={() => setDeleting(true)}>
        Delete…
      </AdminButton>
      <DeleteProblemDialog problem={problem} activity={activity} open={deleting} onClose={() => setDeleting(false)} />
    </>
  );
}

function DeleteProblemDialog({ problem, activity, open, onClose }: { problem: Target; activity?: ProblemActivity; open: boolean; onClose: () => void }) {
  return (
    <AdminDialog open={open} onClose={onClose} title={`Delete Problem ${problem.number}?`}>
      <DeleteForm problem={problem} activity={activity} onCancel={onClose} />
    </AdminDialog>
  );
}

function DeleteForm({ problem, activity, onCancel }: { problem: Target; activity?: ProblemActivity; onCancel: () => void }) {
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const attached = activity && [
    activity.comments && plural(activity.comments, "comment"),
    activity.contributions && plural(activity.contributions, "contribution"),
    activity.edits && plural(activity.edits, "suggested edit"),
  ].filter(Boolean);

  return (
    <form
      action={() =>
        startTransition(async () => {
          const result = await deleteProblem(problem.id).catch(() => ({ error: "Something went wrong. Please try again." }));
          if (result?.error) setError(result.error);
        })
      }
    >
      <p className="mt-1.5 text-zinc-600">
        “{problem.title}” is removed from the site
        {attached?.length ? <>, together with its {attached.join(", ")}</> : null}. This cannot be undone.
      </p>
      <p className="mt-3 text-zinc-600">
        To keep a copy,{" "}
        <a href={downloadHref(problem)} download={`${problem.slug}.md`} className="text-zinc-900 underline decoration-zinc-300 underline-offset-2">
          download it as markdown
        </a>{" "}
        first.
      </p>
      <label htmlFor={`confirm-${problem.id}`} className="mt-4 mb-1 block text-xs text-zinc-500">
        Type <span className="font-medium text-zinc-900">{problem.number}</span> to confirm
      </label>
      <AdminInput id={`confirm-${problem.id}`} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" className="w-full" />
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      <DialogActions>
        <AdminButton onClick={onCancel}>Cancel</AdminButton>
        <AdminButton type="submit" variant="destructive" disabled={pending || confirm.trim() !== String(problem.number)}>
          {pending ? "Deleting…" : "Delete problem"}
        </AdminButton>
      </DialogActions>
    </form>
  );
}
