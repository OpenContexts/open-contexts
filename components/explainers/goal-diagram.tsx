import Link from "next/link";
import { AppleIcon } from "@/components/ui";
import { AGENDA } from "@/lib/agenda";
import { SITE } from "@/lib/site";
import { Apple } from "./drawings";

// The research agenda as a tree diagram, for the home page: the list at the root, its three long-term goals
// (golden apples) below, and from each a fan of near-term problems (red apples). The red apples stand for the
// idea, not for actual problems, of which there will be too many; each goal links to its part of the agenda page.

/** Where the small apples hang in a goal's fan, in the fan's own units (200 × 70). */
const FAN: [number, number][] = [
  [18, 44],
  [58, 54],
  [100, 58],
  [142, 54],
  [182, 44],
];

/** The fan of near-term problems under a goal: twigs from the goal's stem out to small apples. */
function Fan() {
  return (
    <svg viewBox="0 0 200 76" className="mx-auto w-44 max-w-full flex-none max-md:hidden" aria-hidden>
      {FAN.map(([x, y]) => (
        <path key={x} d={`M100 0C100 22 ${x} ${y - 26} ${x} ${y - 4}`} className="fill-none stroke-rule-strong" strokeWidth={1.5} />
      ))}
      {FAN.map(([x, y]) => (
        <Apple key={x} x={x - 9} y={y - 4} s={0.75} />
      ))}
    </svg>
  );
}

/**
 * On wide screens a tree from the top: the list, the line branching into the three goals, a fan under each. On
 * phones a spine down the left with a row per goal, its apple and name; the fans stay out of the narrow width.
 */
export function GoalDiagram() {
  return (
    <div>
      <p className="text-center max-md:text-left">
        <span className="inline-block rounded-full border border-rule-strong bg-surface px-4 py-1 font-sans text-sm font-bold">{SITE.name} I</span>
      </p>
      <div aria-hidden className="relative h-7 max-md:hidden">
        <span className="absolute top-0 left-1/2 h-3.5 w-px bg-rule-strong" />
        <span className="absolute top-3.5 right-[16.67%] left-[16.67%] h-px bg-rule-strong" />
      </div>
      <ol className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-3 md:gap-x-4 max-md:ml-5 max-md:border-l max-md:border-rule-strong">
        {AGENDA.map((goal) => (
          <li key={goal.id} className="relative flex flex-col items-center text-center max-md:flex-row max-md:gap-4 max-md:py-3 max-md:pl-5 max-md:text-left">
            <span aria-hidden className="absolute -top-3.5 left-1/2 h-3.5 w-px bg-rule-strong max-md:top-1/2 max-md:left-0 max-md:h-px max-md:w-4" />
            <Link href={`/agenda#${goal.id}`} className="group flex min-w-0 flex-1 flex-col items-center rounded-md px-2 pt-1 text-ink max-md:flex-row max-md:items-center max-md:gap-3 max-md:px-0">
              <AppleIcon variant="gold" className="size-11 flex-none transition group-hover:-translate-y-0.5 max-md:size-9" />
              <span className="flex flex-col max-md:min-w-0">
                <span className="mt-1 font-sans text-xs font-bold tracking-widest text-ink-subtle max-md:mt-0">GOAL {goal.numeral}</span>
                <span className="font-bold group-hover:text-brand max-md:text-[0.98rem]/snug">{goal.title}</span>
              </span>
            </Link>
            <span aria-hidden className="mt-2 h-3 w-px bg-rule-strong max-md:hidden" />
            <Fan />
          </li>
        ))}
      </ol>
    </div>
  );
}
