import Link from "next/link";
import { AGENDA } from "@/lib/agenda";
import type { Problem } from "@/lib/data/problems";
import { plural } from "@/lib/format";
import { Apple } from "./drawings";

// The research agenda as a weeping willow, after the companion paper's figure: a brown trunk, and three big
// branches, one per long-term goal, that arch up, droop and turn golden towards their tips, where the goal's
// golden apple hangs. Thin strands hang from them with the red apples of near-term problems. The small apples are
// a picture of the idea, not the actual problems (there will be too many); each branch links to its goal.

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

/** The highest point of a curve, where its label goes. */
function apex(c: Curve): Point {
  let top = at(c, 0);
  for (let i = 1; i <= 40; i++) {
    const p = at(c, i / 40);
    if (p[1] < top[1]) top = p;
  }
  return top;
}

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

/**
 * The three goals' branches: left, middle, right. The outer ones arch and droop, their strands swaying outwards
 * (`side`); the middle one rises to the crown, its strands hanging to both sides (`side` 0).
 */
const BRANCHES: { curve: Curve; side: 1 | -1 | 0; crown?: { curve: Curve; side: 1 | -1 }[] }[] = [
  { curve: [[444, 345], [405, 215], [255, 140], [135, 262]], side: -1 },
  {
    curve: [[450, 345], [452, 260], [446, 170], [450, 108]],
    side: 0,
    // Two short arcs below the crown, drooping left and right; the middle goal's strands hang from these.
    crown: [
      { curve: [[449, 168], [428, 132], [380, 130], [352, 196]], side: -1 },
      { curve: [[451, 168], [472, 132], [520, 130], [548, 196]], side: 1 },
    ],
  },
  { curve: [[456, 345], [495, 215], [645, 140], [765, 262]], side: 1 },
];

/** Where the strands hang from each branch, along it (t), and how far down they reach. */
const STRANDS = [0.26, 0.36, 0.46, 0.55, 0.64, 0.72, 0.8, 0.88];

/** A thin strand hanging from `start`, swaying a little to `side`; its end, for the apple. */
function strand(start: Point, length: number, sway: number): { d: string; end: Point } {
  const end: Point = [start[0] + sway, start[1] + length];
  const c: Curve = [start, [start[0] + sway * 0.6, start[1] + length * 0.15], [end[0] - sway * 0.15, end[1] - length * 0.4], end];
  return { d: taper(c, 3.2, 1.2, 12), end };
}

const BROWN = "light-dark(#6b4a2f, #a3805c)";

/** The tree, with each goal's branch a link to it on the agenda page. */
export function AgendaTree() {
  return (
    <svg viewBox="0 -55 900 615" className="w-full" role="group" aria-label="The research agenda as a tree: three long-term goals and their near-term problems">
      <defs>
        {BRANCHES.map((b, i) => (
          <linearGradient key={i} id={`willow-${i}`} gradientUnits="userSpaceOnUse" x1={b.curve[0][0]} y1={b.curve[0][1]} x2={b.curve[3][0]} y2={b.curve[3][1]}>
            <stop offset="0.15" style={{ stopColor: BROWN }} />
            <stop offset="0.95" style={{ stopColor: "var(--color-gold)" }} />
          </linearGradient>
        ))}
      </defs>
      <ellipse cx={450} cy={552} rx={150} ry={7} className="fill-rule" />
      <path d="M412 553C428 500 434 420 436 338L464 338C466 420 472 500 488 553Z" style={{ fill: BROWN }} />
      {BRANCHES.map((b, i) => {
        const goal = AGENDA[i];
        const tip = b.curve[3];
        // Labels over the outer branches sit a little outwards, clear of the crown.
        const top: Point = b.side ? [apex(b.curve)[0] + b.side * 45, apex(b.curve)[1]] : [tip[0], tip[1] - 40];
        const label = lines(goal.title);
        const paint = `url(#willow-${i})`;
        return (
          <a key={goal.id} href={`/agenda#${goal.id}`} className="group outline-none [&:focus-visible_.halo]:stroke-brand">
            <title>{`Goal ${goal.numeral}: ${goal.title}`}</title>
            {(b.crown ?? [{ curve: b.curve, side: b.side || 1 }]).map((arm, a) =>
              STRANDS.map((t, j) => {
                const start = at(arm.curve, b.crown ? 0.2 + t * 0.85 : t);
                // Strands reach down to about the same height, the outer ones a little less; two per point.
                const reach = Math.max(70, 470 - start[1]) * (j % 2 ? 0.55 : 0.75);
                // The crown's arcs are short: one strand per point there, two on the long branches.
                return (b.crown ? [0] : [0, 1]).map((k) => {
                  const { d, end } = strand(start, reach * (k ? 0.62 : 1), arm.side * (k ? -8 : 14 + j * 2));
                  return (
                    <g key={`${a}-${t}-${k}`}>
                      <path d={d} style={{ fill: paint }} />
                      <Apple x={end[0] - 12 * 0.72} y={end[1] - 3 * 0.72} s={0.72} />
                    </g>
                  );
                });
              }),
            )}
            {b.crown?.map((arm, a) => <path key={a} d={taper(arm.curve, 14, 5)} style={{ fill: paint }} />)}
            <path d={taper(b.curve, 34, 8)} style={{ fill: paint }} className="transition group-hover:brightness-110" />
            <circle className="halo fill-none stroke-transparent" cx={tip[0]} cy={tip[1] + (b.side ? 22 : -18)} r={34} strokeWidth={2.5} />
            <g className="transition group-hover:translate-y-1">
              <Apple x={tip[0] - 12 * 2.3} y={tip[1] - (b.side ? 3 : 20) * 2.3} s={2.3} gold />
            </g>
            <text textAnchor="middle" className="font-serif">
              <tspan x={top[0]} y={top[1] - 34 - label.length * 24} fontSize={13} className="fill-ink-subtle font-sans font-bold tracking-[0.15em]">
                GOAL {goal.numeral}
              </tspan>
              {label.map((line, j) => (
                <tspan key={line} x={top[0]} y={top[1] - 28 - (label.length - 1 - j) * 24} fontSize={22} className="fill-gold-dark font-bold group-hover:underline">
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

/**
 * The tree, with the researchers who think about it and work on it to its right, as in the paper's figure (their
 * illustrations are one image, public/figures/agenda-people.webp). For the agenda page; on phones only the tree.
 */
export function AgendaTreeWithPeople() {
  return (
    <div className="grid items-center gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <AgendaTree />
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed illustration, already sized and compressed */}
      <img src="/figures/agenda-people.webp" alt="" width={990} height={1055} loading="lazy" className="h-auto w-full max-md:hidden" />
    </div>
  );
}
