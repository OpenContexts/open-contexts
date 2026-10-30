import { decide } from "@/app/admin/actions";
import { AdminButton, AdminTextarea, Card } from "@/components/admin/ui";
import type { ModerationStatus, SubmissionType } from "@/lib/constants";

/** Approve / reject for pending items; reopen for decided ones. Plain form posts, no client JS needed. */
export function DecisionPanel({ type, id, status }: { type: SubmissionType; id: string; status: ModerationStatus }) {
  if (status === "approved" && (type === "revision" || type === "proposal")) {
    return (
      <Card title="Decision">
        <p className="text-zinc-600">
          This {type === "revision" ? "edit has been applied to the problem" : "proposal has been published as a problem"}. To change or remove it, edit the problem
          directly.
        </p>
      </Card>
    );
  }
  if (status !== "pending") {
    return (
      <Card title="Decision">
        <p className="mb-3 text-zinc-600">This submission has been {status}. Reopening puts it back into the queue{status === "approved" ? " and removes it from the site" : ""}.</p>
        <form action={decide}>
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="id" value={id} />
          <AdminButton type="submit" name="action" value="reopen" className="w-full">
            Reopen
          </AdminButton>
        </form>
      </Card>
    );
  }
  return (
    <Card title="Decision">
      <form action={decide} className="space-y-3">
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="id" value={id} />
        <div>
          <label htmlFor="note" className="mb-1 block text-xs text-zinc-500">
            Note to the author <span className="text-zinc-400">(optional, shown on their submissions page)</span>
          </label>
          <AdminTextarea id="note" name="note" rows={4} placeholder="e.g. Please add a reference for the second claim." />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <AdminButton type="submit" name="action" value="reject" variant="danger">
            Reject
          </AdminButton>
          <AdminButton type="submit" name="action" value="approve" variant="primary">
            Approve
          </AdminButton>
        </div>
      </form>
    </Card>
  );
}
