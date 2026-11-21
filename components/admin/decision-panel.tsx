import { decide } from "@/app/admin/actions";
import { AdminButton, AdminButtonLink, AdminTextarea, StatusPill } from "@/components/admin/ui";
import type { ModerationStatus, SubmissionType } from "@/lib/constants";

/** Approve / reject for pending items; reopen for decided ones. Plain form posts, no client JS needed. */
export function DecisionPanel({ type, id, status, problemId }: { type: SubmissionType; id: string; status: ModerationStatus; problemId?: string | null }) {
  const hidden = (
    <>
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="id" value={id} />
    </>
  );

  // Approved edits and proposals changed the problem itself; they are undone in the editor.
  if (status === "approved" && (type === "revision" || type === "proposal")) {
    return (
      <section aria-label="Decision" className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2.5 text-zinc-600">
          <StatusPill status={status} />
          {type === "revision" ? "Applied to the problem. Undo it in the editor." : "Added as an additional problem. Publish it in the editor."}
        </p>
        {problemId && (
          <AdminButtonLink href={`/admin/problems/${problemId}`} className="w-28">
            Editor
          </AdminButtonLink>
        )}
      </section>
    );
  }

  if (status !== "pending") {
    return (
      <form action={decide} aria-label="Decision" className="flex flex-wrap items-center justify-between gap-3">
        {hidden}
        <p className="flex items-center gap-2.5 text-zinc-600">
          <StatusPill status={status} />
          {status === "approved" ? "Shown on the site." : "Not shown on the site."}
        </p>
        <AdminButton type="submit" name="action" value="reopen" className="w-28">
          Reopen
        </AdminButton>
      </form>
    );
  }

  return (
    <form action={decide} aria-label="Decision" className="space-y-2">
      {hidden}
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="note" className="text-xs font-medium text-zinc-700">
          Note to the author <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <StatusPill status={status} />
      </div>
      <AdminTextarea id="note" name="note" rows={2} />
      <div className="flex justify-end gap-2 pt-1">
        <AdminButton type="submit" name="action" value="reject" variant="danger" className="w-28">
          Reject
        </AdminButton>
        <AdminButton type="submit" name="action" value="approve" variant="primary" className="w-28">
          Approve
        </AdminButton>
      </div>
    </form>
  );
}
