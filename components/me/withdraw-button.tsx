"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { withdrawContribution } from "@/lib/actions/submissions";

/**
 * "Withdraw…", which first asks, since withdrawing can't be undone. `accepted`: whether it is already on the
 * site, where it then stays, marked as withdrawn; one still waiting for review simply leaves the queue.
 */
export function WithdrawButton({ id, accepted }: { id: string; accepted: boolean }) {
  const [asking, setAsking] = useState(false);
  if (!asking)
    return (
      <button type="button" onClick={() => setAsking(true)} className="cursor-pointer text-sm text-ink-subtle hover:text-brand hover:underline">
        Withdraw…
      </button>
    );
  return (
    <form action={withdrawContribution} className="mt-3 rounded-md bg-surface px-4 py-3 text-sm ring-1 ring-rule-strong ring-inset">
      <input type="hidden" name="id" value={id} />
      <p className="text-ink">
        {accepted
          ? "Withdraw this result? It stays on the problem, with its credit, but is marked as withdrawn and no longer stands as a result. The moderators will see it and reconsider the problem's status if needed."
          : "Withdraw this submission? It leaves the moderators' queue and will not be published."}{" "}
        This can&apos;t be undone.
      </p>
      <p className="mt-2.5 flex gap-2">
        <Confirm />
        <button type="button" onClick={() => setAsking(false)} className="cursor-pointer rounded-sm border border-rule-strong bg-paper px-3 py-1 font-sans text-xs font-bold text-ink hover:bg-rule/60">
          Cancel
        </button>
      </p>
    </form>
  );
}

function Confirm() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="cursor-pointer rounded-sm border border-brand bg-brand px-3 py-1 font-sans text-xs font-bold text-white hover:bg-brand-strong disabled:opacity-60">
      {pending ? "Withdrawing…" : "Withdraw"}
    </button>
  );
}
