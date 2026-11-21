import Link from "next/link";
import { AGENDA } from "@/lib/agenda";
import type { Problem } from "@/lib/data/problems";
import { plural } from "@/lib/format";
import { Apple, Basket, Person, Robot, ThoughtBubble, TinyTree } from "./drawings";

// The research agenda as a tree, after the companion paper's figure: three golden branches, one per long-term
// goal with a golden apple at its tip, and near-term problems as the red apples on the twigs. The small apples
// are a picture of the idea, not the actual problems (there will be too many); each branch links to its goal.

type Point = [number, number];
type Curve = [Point, Point, Point, Point];

const at = ([p0, p1, p2, p3]: Curve, t: number): Point => {
  const u = 1 - t;
  return [0, 1].map((i) => u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i]) as Point;
};

const tangent = ([p0, p1, p2, p3]: Curve, t: number): Point => {
  const u = 1 - t;
  const d = [0, 1].map((i) => 3 * u * u * (p1[i] - p0[i]) + 6 * u * t * (p2[i] - p1[i]) + 3 * t * t * (p3[i] - p2[i]));
  const n = Math.hypot(d[0], d[1]) || 1;
  return [d[0] / n, d[1] / n];
};

/** A branch as a filled outline that narrows from `from` to `to` units along the curve. */
function taper(c: Curve, from: number, to: number, steps = 24): string {
  const left: Point[] = [];
  const right: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const [x, y] = at(c, t);
    const [dx, dy] = tangent(c, t);
    const w = (from + (to - from) * t) / 2;
    left.push([x - dy * w, y + dx * w]);
    right.push([x + dy * w, y - dx * w]);
  }
  const pts = [...left, ...right.reverse()];
  return `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;
}

/** A twig growing out of a curve at `t`, to the `side` (1 or -1), bending upwards; its end, for an apple. */
function twig(c: Curve, t: number, side: 1 | -1, length: number): { curve: Curve; end: Point } {
  const start = at(c, t);
  const [dx, dy] = tangent(c, t);
  // Between the branch's own direction and its side, tilted up.
  const dir: Point = [dx * 0.55 - dy * side * 0.8, dy * 0.55 + dx * side * 0.8 - 0.35];
  const n = Math.hypot(dir[0], dir[1]);
  const [ux, uy] = [dir[0] / n, dir[1] / n];
  const end: Point = [start[0] + ux * length, start[1] + uy * length];
  return {
    curve: [start, [start[0] + ux * length * 0.4, start[1] + uy * length * 0.4 - 6], [end[0] - ux * length * 0.25, end[1] - uy * length * 0.25 - 4], end],
    end,
  };
}

const TRUNK = "M414 505C428 455 434 385 436 322L464 322C466 385 472 455 486 505Z";

type Twig = [t: number, side: 1 | -1, length: number];

/** `count` twigs spread along a branch, alternating sides, shorter towards its tip. */
function spread(count: number, first: 1 | -1, from = 0.2, to = 0.9, long = 62, short = 30): Twig[] {
  return Array.from({ length: count }, (_, i) => {
    const f = count > 1 ? i / (count - 1) : 0;
    return [from + (to - from) * f, (i % 2 ? -first : first) as 1 | -1, long + (short - long) * f];
  });
}

/** The goals' branches, left, middle, right, with where their twigs grow. */
const GOAL_BRANCHES: { curve: Curve; twigs: Twig[] }[] = [
  { curve: [[446, 332], [370, 300], [250, 270], [150, 150]], twigs: spread(8, 1) },
  { curve: [[450, 332], [425, 262], [470, 190], [450, 108]], twigs: spread(7, -1, 0.22, 0.88, 58, 30) },
  { curve: [[454, 332], [530, 300], [650, 270], [750, 150]], twigs: spread(8, -1) },
];

/** The lower, plain branches the near-term problems also grow on, curving up at their ends. */
const LOW_BRANCHES: { curve: Curve; twigs: Twig[] }[] = [
  { curve: [[442, 425], [350, 410], [210, 430], [90, 360]], twigs: spread(6, 1, 0.2, 0.92, 44, 28) },
  { curve: [[458, 425], [550, 410], [690, 430], [810, 360]], twigs: spread(6, -1, 0.2, 0.92, 44, 28) },
];

/** The title broken into lines of at most `max` characters. */
function lines(text: string, max = 20): string[] {
  const out: string[] = [];
  for (const word of text.split(" ")) {
    const last = out.at(-1);
    if (last && `${last} ${word}`.length <= max) out[out.length - 1] = `${last} ${word}`;
    else out.push(word);
  }
  return out;
}

/** A twig with an apple at its end; the longer ones fork once more, with a second apple. */
function Twigs({ curve, twigs }: { curve: Curve; twigs: Twig[] }) {
  return twigs.map(([t, side, length], i) => {
    const { curve: c, end } = twig(curve, t, side, length);
    const fork = length > 40 ? twig(c, 0.55, (i % 2 ? 1 : -1) as 1 | -1, length * 0.42) : undefined;
    return (
      <g key={`${t}-${side}`}>
        <path d={taper(c, 7, 2, 12)} className="fill-ink-muted" />
        {fork && <path d={taper(fork.curve, 3.5, 1.5, 8)} className="fill-ink-muted" />}
        <Apple x={end[0] - 12 * 0.8} y={end[1] - 3 * 0.8} s={0.8} />
        {fork && <Apple x={fork.end[0] - 12 * 0.7} y={fork.end[1] - 3 * 0.7} s={0.7} />}
      </g>
    );
  });
}

export function AgendaTree() {
  return (
    <svg viewBox="0 0 900 505" className="w-full" role="group" aria-label="The research agenda as a tree: three long-term goals and their near-term problems">
      <path d={TRUNK} className="fill-ink-muted" />
      {LOW_BRANCHES.map((b, i) => (
        <g key={i}>
          <path d={taper(b.curve, 18, 4)} className="fill-ink-muted" />
          <Twigs {...b} />
        </g>
      ))}
      {GOAL_BRANCHES.map((b, i) => {
        const goal = AGENDA[i];
        const tip = b.curve[3];
        const label = lines(goal.title);
        return (
          <a key={goal.id} href={`/agenda#${goal.id}`} className="group outline-none [&:focus-visible_.halo]:stroke-brand">
            <title>{`Goal ${goal.numeral}: ${goal.title}`}</title>
            <Twigs {...b} />
            <path d={taper(b.curve, 30, 6)} className="fill-gold stroke-gold-dark transition group-hover:brightness-110" strokeWidth={1.5} />
            <circle className="halo fill-none stroke-transparent" cx={tip[0]} cy={tip[1]} r={34} strokeWidth={2.5} />
            <g className="origin-center transition [transform-box:fill-box] group-hover:-translate-y-1">
              <Apple x={tip[0] - 26} y={tip[1] - 30} s={2.2} gold />
            </g>
            <text x={tip[0]} textAnchor="middle" className="font-serif">
              <tspan x={tip[0]} y={tip[1] - 46 - label.length * 24} fontSize={13} className="fill-ink-subtle font-sans font-bold tracking-[0.15em]">
                GOAL {goal.numeral}
              </tspan>
              {label.map((line, j) => (
                <tspan key={line} x={tip[0]} y={tip[1] - 40 - (label.length - 1 - j) * 24} fontSize={22} className="fill-gold-dark font-bold group-hover:underline">
                  {line}
                </tspan>
              ))}
            </text>
          </a>
        );
      })}
    </svg>
  );
}

/** Under the tree: each goal with the number of its problems, linking to them. */
export function GoalCounts({ problems }: { problems: Problem[] }) {
  return (
    <ul className="mt-3 grid gap-2 text-center sm:grid-cols-3">
      {AGENDA.map((goal) => (
        <li key={goal.id}>
          <Link href={`/problems?agenda=${goal.id}`} className="text-sm text-brand hover:underline">
            {plural(problems.filter((p) => p.agenda.some((a) => a === goal.id)).length, "problem")} for goal {goal.numeral} →
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The tree among people who think about it and work on it, as on the paper's figure: for the agenda page. */
export function AgendaTreeWithPeople() {
  return (
    <div className="grid items-end md:grid-cols-[minmax(0,1fr)_minmax(0,4fr)_minmax(0,1fr)] md:gap-2">
      <svg viewBox="0 0 150 470" className="w-full max-md:hidden" aria-hidden>
        <ThoughtBubble x={40} y={10}>
          <TinyTree x={15} y={8} gold />
        </ThoughtBubble>
        <Person x={8} y={100} s={1.25} thinking />
        <Robot x={70} y={250} s={1.05} holding />
        <Person x={28} y={330} s={1.15} />
        <Basket x={88} y={430} s={1.05} />
      </svg>
      <AgendaTree />
      <svg viewBox="0 0 150 470" className="w-full max-md:hidden" aria-hidden>
        <ThoughtBubble x={20} y={40}>
          <TinyTree x={15} y={8} />
        </ThoughtBubble>
        <Person x={70} y={130} s={1.25} flip thinking />
        <Basket x={14} y={262} s={1.05} />
        <Robot x={92} y={300} s={0.95} />
        <Person x={22} y={340} s={1.15} flip />
      </svg>
    </div>
  );
}
