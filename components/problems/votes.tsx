"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, type ReactNode, use, useEffect, useState, useTransition } from "react";
import { castVote, type Vote, type VotesSnapshot } from "@/lib/actions/votes";
import { cn } from "@/lib/cn";
import type { Votes } from "@/lib/data/community";

type Store = VotesSnapshot & { set: (id: string, votes: Votes, mine: Vote) => void };

const VotesContext = createContext<Store | undefined>(undefined);

/**
 * Around the pages that show a problem's contributions. They are cached for everyone, with the scores as they
 * were; this loads the scores as they are now, and the visitor's own votes, for the VoteControls inside.
 */
export function VotesProvider({ problemId, children }: { problemId: string; children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<VotesSnapshot>();
  useEffect(() => {
    let current = true;
    fetch(`/api/votes?problem=${problemId}`)
      .then((r) => (r.ok ? (r.json() as Promise<VotesSnapshot>) : undefined))
      .then((s) => current && s && setSnapshot(s))
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [problemId]);

  const set = (id: string, votes: Votes, mine: Vote) =>
    setSnapshot((s) => {
      if (!s) return s;
      const others = Object.fromEntries(Object.entries(s.mine).filter(([key]) => key !== id));
      return { ...s, votes: { ...s.votes, [id]: votes }, mine: mine ? { ...others, [id]: mine } : others };
    });
  return <VotesContext value={snapshot && { ...snapshot, set }}>{children}</VotesContext>;
}

/** The votes with `mine` changed to `next`. */
function adjust(votes: Votes, mine: Vote, next: Vote): Votes {
  return { up: votes.up - (mine === 1 ? 1 : 0) + (next === 1 ? 1 : 0), down: votes.down - (mine === -1 ? 1 : 0) + (next === -1 ? 1 : 0) };
}

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");

/**
 * ▲ score ▼ for one contribution, as on Stack Overflow: the score is upvotes minus downvotes, with both on hover.
 * Clicking an arrow votes, clicking it again takes the vote back. `votes`: the cached totals, until the current
 * ones have loaded.
 */
export function VoteControl({ id, votes: cached, className }: { id: string; votes: Votes; className?: string }) {
  const store = use(VotesContext);
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const votes = store?.votes[id] ?? cached;
  const mine: Vote = store?.mine[id] ?? 0;
  const own = !!store?.own.includes(id);
  const score = votes.up - votes.down;

  function vote(direction: 1 | -1) {
    if (!store) return;
    if (!store.signedIn) return router.push(`/sign-in?next=${encodeURIComponent(pathname)}`);
    const next: Vote = mine === direction ? 0 : direction;
    const before = { votes, mine };
    setError(undefined);
    store.set(id, adjust(votes, mine, next), next);
    startTransition(async () => {
      const result = await castVote(id, next);
      if ("error" in result) {
        store.set(id, before.votes, before.mine);
        setError(result.error);
      } else store.set(id, result.votes, result.mine);
    });
  }

  const hint = own ? "You cannot vote on your own contribution" : undefined;
  const arrow = (direction: 1 | -1) => (
    <button
      type="button"
      onClick={() => vote(direction)}
      disabled={!store || own || pending}
      aria-pressed={mine === direction}
      aria-label={direction === 1 ? "Upvote: this is useful" : "Downvote: this is not useful"}
      title={hint ?? (direction === 1 ? "This is useful" : "This is not useful")}
      className={cn(
        "flex size-7 cursor-pointer items-center justify-center rounded-full text-[0.8rem] transition",
        // On their own contribution the arrows say no; while loading or saving they are just inactive.
        own ? "disabled:cursor-not-allowed" : "disabled:cursor-default",
        mine === direction ? "bg-brand-tint text-brand" : "text-ink-subtle enabled:hover:bg-surface enabled:hover:text-ink",
      )}
    >
      <span aria-hidden>{direction === 1 ? "▲" : "▼"}</span>
    </button>
  );

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      {arrow(1)}
      <span
        className={cn("font-sans text-[0.95rem] font-bold tabular-nums", mine ? "text-brand" : "text-ink")}
        title={`${votes.up} up, ${votes.down} down`}
        aria-label={`Score ${signed(score)}: ${votes.up} up, ${votes.down} down`}
      >
        {signed(score)}
      </span>
      {arrow(-1)}
      {error && (
        <p role="status" className="absolute top-full left-0 z-10 mt-1 w-48 rounded border border-rule-strong bg-paper px-2.5 py-1.5 text-xs text-ink shadow">
          {error}
        </p>
      )}
    </div>
  );
}
