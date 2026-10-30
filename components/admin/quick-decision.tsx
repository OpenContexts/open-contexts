"use client";

import { useFormStatus } from "react-dom";
import { quickDecide } from "@/app/admin/actions";
import { AdminButton } from "@/components/admin/ui";
import type { SubmissionType } from "@/lib/constants";

function Buttons() {
  const { pending, data } = useFormStatus();
  const deciding = pending ? data?.get("action") : null;
  return (
    <>
      <AdminButton type="submit" name="action" value="reject" variant="danger" size="sm" disabled={pending}>
        {deciding === "reject" ? "Rejecting…" : "Reject"}
      </AdminButton>
      <AdminButton type="submit" name="action" value="approve" variant="primary" size="sm" disabled={pending}>
        {deciding === "approve" ? "Approving…" : "Approve"}
      </AdminButton>
    </>
  );
}

/** Approve or reject from the queue list, without a note. The list re-renders without the item. */
export function QuickDecision({ type, id }: { type: SubmissionType; id: string }) {
  return (
    <form action={quickDecide} className="flex flex-none gap-2">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="id" value={id} />
      <Buttons />
    </form>
  );
}
