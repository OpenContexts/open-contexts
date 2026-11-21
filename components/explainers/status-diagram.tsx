import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// How a problem moves between its three statuses (Guidelines IV): the moves, numbered on the arrows, and the
// rule behind each number under the drawing. Static, so the rules read as a reference without any clicking.

const STATES = [
  { label: "open", className: "border-brand text-brand bg-brand-tint" },
  { label: "under revision", className: "border-info text-info bg-info-tint" },
  { label: "solved", className: "border-success text-success bg-success-tint" },
];

/** The two moves between neighbouring states: forward on top, back (dashed) below. */
const MOVES: [{ n: number; label: string }, { n: number; label: string }][] = [
  [
    { n: 1, label: "solution claimed" },
    { n: 4, label: "claim withdrawn or statement flawed" },
  ],
  [
    { n: 2, label: "solution settled" },
    { n: 3, label: "challenge seconded" },
  ],
];

/** A drawn arrow: solid to the right for a move forward, dashed to the left for one back; downward and upward on phones. */
function MoveArrow({ back }: { back?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative my-1.5 block h-0 w-full border-t-[1.5px] max-sm:mx-auto max-sm:h-8 max-sm:w-0 max-sm:border-t-0 max-sm:border-l-[1.5px]",
        back ? "border-dashed border-ink-subtle" : "border-ink",
      )}
    >
      <span
        className={cn(
          "absolute border-transparent",
          back
            ? "-top-[5.5px] -left-px border-y-[5px] border-r-[8px] border-r-ink-subtle max-sm:top-auto max-sm:-left-[5.5px] max-sm:-top-px max-sm:border-x-[5px] max-sm:border-y-0 max-sm:border-r-transparent max-sm:border-b-[8px] max-sm:border-b-ink-subtle"
            : "-top-[5.5px] -right-px border-y-[5px] border-l-[8px] border-l-ink max-sm:top-auto max-sm:-bottom-px max-sm:-left-[5.5px] max-sm:right-auto max-sm:border-x-[5px] max-sm:border-y-0 max-sm:border-l-transparent max-sm:border-t-[8px] max-sm:border-t-ink",
        )}
      />
    </span>
  );
}

function Num({ n }: { n: number }) {
  return <span className="inline-flex size-5 flex-none items-center justify-center rounded-full bg-ink font-sans text-[0.7rem] font-bold text-paper">{n}</span>;
}

export function StatusDiagram({ rules }: { rules: { n: number; title: string; text: ReactNode }[] }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1 max-sm:flex-col">
        {STATES.map((s, i) => (
          <div key={s.label} className="contents">
            <span className={cn("rounded-md border-[1.5px] px-4 py-2 font-mono text-[1.05rem] font-bold whitespace-nowrap", s.className)}>{s.label}</span>
            {i < MOVES.length && (
              <div className="flex min-w-0 flex-col gap-1.5 px-1 font-sans text-xs text-ink-muted sm:w-44 max-sm:my-1 max-sm:flex-row max-sm:gap-6">
                <span className="flex flex-col items-center sm:items-stretch">
                  <span className="flex items-center justify-center gap-1.5 text-center">
                    <Num n={MOVES[i][0].n} />
                    {MOVES[i][0].label}
                  </span>
                  <MoveArrow />
                </span>
                <span className="flex flex-col items-center sm:flex-col-reverse sm:items-stretch">
                  <span className="flex items-center justify-center gap-1.5 text-center">
                    <Num n={MOVES[i][1].n} />
                    {MOVES[i][1].label}
                  </span>
                  <MoveArrow back />
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      <ol className="mt-6 space-y-3">
        {rules.map((r) => (
          <li key={r.n} className="flex gap-3">
            <span className="mt-0.5">
              <Num n={r.n} />
            </span>
            <div className="min-w-0 text-[0.98rem]">
              <strong>{r.title}.</strong> {r.text}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** When an unpublished solution counts: the three conditions, ticked off. */
export function SolvedChecklist({ id }: { id?: string }) {
  const conditions = [
    { title: "Understood by a human", text: "At least one contributor claims to fully understand the solution, whose account is in a preprint repository with a DOI, or here in the database." },
    { title: "Verified three times", text: "At least three researchers independent of its contributors, without a conflict of interest, have verified it." },
    { title: "Not disputed", text: "No dispute is open, or a moderator has marked it resolved on conclusive evidence." },
  ];
  return (
    <div id={id} className="scroll-mt-6 rounded-md border-[1.5px] border-success bg-success-tint px-5 py-4">
      <p className="mb-3 font-sans text-sm font-bold text-success">When is a problem solved?</p>
      <p className="mb-3 text-[0.98rem]">
        When a <strong>peer-reviewed publication</strong> settles it as stated, or, without one, when all three hold:
      </p>
      <ul className="grid gap-3 sm:grid-cols-3">
        {conditions.map((c) => (
          <li key={c.title} className="text-[0.95rem]/snug">
            <span className="flex items-center gap-1.5 font-bold">
              <span aria-hidden className="flex size-5 items-center justify-center rounded-full bg-success font-sans text-xs text-white dark:text-paper">
                ✓
              </span>
              {c.title}
            </span>
            <span className="mt-1 block text-ink-muted">{c.text}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-ink-muted">Entirely AI-generated claims, or claims nobody fully understands, keep a problem under revision. A machine-checked proof helps, but does not replace the human verifications.</p>
    </div>
  );
}
