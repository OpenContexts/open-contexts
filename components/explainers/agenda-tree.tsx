import Link from "next/link";
import { AGENDA } from "@/lib/agenda";
import { Apple } from "./drawings";

// The research agenda as a weeping willow, after the companion paper's figure: a dark brown trunk whose limbs
// spread into a dome, with a curtain of leafy strands hanging from all of them. The three top limbs are golden,
// one per long-term goal, each with the goal's golden apple at its tip; red apples, the near-term problems, hang
// from some of the strands. They are a picture of the idea, not the actual problems (there will be too many).
// Each golden limb links to its goal on the agenda page.

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

/** A limb as a filled outline that narrows from `from` to `to` units along the curve. */
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
  return `M${[...left, ...right.reverse()].map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;
}

const mirror = (c: Curve): Curve => c.map(([x, y]) => [900 - x, y]) as Curve;
const n = (v: number) => String(Math.round(v));

/** The trunk's limbs: brown ones that spread into the dome, and the three golden ones of the goals, left to right. */
const BROWN_LIMBS: Curve[] = (
  [
    [[440, 382], [360, 362], [205, 330], [72, 372]],
    [[442, 374], [380, 322], [250, 252], [118, 252]],
    [[446, 368], [430, 304], [382, 246], [326, 220]],
  ] as Curve[]
).flatMap((c) => [c, mirror(c)]);

const GOLDEN_LIMBS: Curve[] = [
  [[444, 370], [420, 282], [320, 172], [200, 142]],
  [[450, 370], [452, 262], [440, 152], [450, 66]],
  mirror([[444, 370], [420, 282], [320, 172], [200, 142]]),
];

/**
 * A side branch growing out of a limb at `t`: it arches outwards, away from the trunk (to `side` for a limb that
 * rises straight up), and droops at its end, as a willow's branches do. `steep` sets how high it arches.
 */
function fork(c: Curve, t: number, side: 1 | -1, length: number, steep = 1): Curve {
  const [sx, sy] = at(c, t);
  const out = Math.abs(sx - 450) > 20 ? Math.sign(sx - 450) : side;
  return [
    [sx, sy],
    [sx + out * length * 0.3, sy - length * 0.5 * steep],
    [sx + out * length * 0.75, sy - length * 0.55 * steep],
    [sx + out * length, sy - length * 0.12 * steep],
  ];
}

/** A limb with its two side branches. */
const withForks = (c: Curve): Curve[] => [c, fork(c, 0.45, -1, 84, 0.9), fork(c, 0.7, 1, 64, 0.6)];

/** How far down the curtain reaches below a point: lower towards the sides, as a willow's crown. */
const bottomAt = (x: number, j: number) => 452 + 90 * Math.min(1, Math.abs(x - 450) / 340) ** 1.5 + Math.sin(j * 2.7) * 16;

type Strand = { stem: string; leaves: string; apple?: Point; t: number };

/**
 * The strands hanging from a branch, every `gap` units along it from `from` on: each a thin twig that bends
 * outwards and falls to the curtain's lower edge, with narrow leaves along it, alternating sides, pointing down
 * and out. `seed` varies them from branch to branch; some bear an apple.
 */
function strands(c: Curve, from: number, seed: number, gap = 24): Strand[] {
  const points: { p: Point; t: number }[] = [];
  let last = at(c, from);
  let walked = gap;
  for (let i = 0; i <= 60; i++) {
    const t = from + ((1 - from) * i) / 60;
    const p = at(c, t);
    walked += Math.hypot(p[0] - last[0], p[1] - last[1]);
    last = p;
    if (walked >= gap) {
      points.push({ p, t });
      walked = 0;
    }
  }
  return points.map(({ p: [x, y], t }, i) => {
    const j = seed * 7 + i;
    const length = Math.max(46, bottomAt(x, j) - y);
    const out = Math.sign(x - 450) || 1;
    const sway = out * (6 + 6 * Math.abs(Math.sin(j * 1.9)));
    const s: Curve = [[x, y], [x + sway * 0.8, y + 14], [x + sway, y + length * 0.5], [x + sway * 0.6, y + length]];
    const leaves: string[] = [];
    for (let d = 10, k = 0; d < length; d += 12, k++) {
      const [lx, ly] = at(s, d / length);
      const side = k % 2 ? 1 : -1;
      leaves.push(`M${n(lx)} ${n(ly)}l${n(side * 4.2)} ${n(6.2)}`);
    }
    return {
      stem: `M${n(x)} ${n(y)}C${s.slice(1).map(([px, py]) => `${n(px)} ${n(py)}`).join(" ")}`,
      leaves: leaves.join(""),
      apple: j % 5 === 2 ? at(s, 1) : j % 7 === 4 ? at(s, 0.66) : undefined,
      t,
    };
  });
}

const BARK = "light-dark(#3f2a1b, #9a7655)";
const LEAF = "light-dark(#5e4330, #ad8a66)";

/** Brown turning gold: the colour `golden` (0 to 1) of the way along. */
const goldenBrown = (golden: number) => `color-mix(in oklab, var(--color-gold) ${Math.round(Math.min(1, Math.max(0, golden)) * 100)}%, ${LEAF})`;

/**
 * A curtain of strands. Strands of the same colour share two paths, one for the twigs and one for the leaves,
 * so the thousands of leaves stay a handful of elements; `shade` gives each strand its step from brown (0) to
 * gold (4).
 */
function Curtain({ items, shade }: { items: Strand[]; shade: (s: Strand) => number }) {
  const groups = new Map<number, Strand[]>();
  for (const s of items) groups.set(shade(s), [...(groups.get(shade(s)) ?? []), s]);
  return [...groups].map(([step, group]) => (
    <g key={step} style={{ stroke: goldenBrown(step / 4) }} className="fill-none" strokeLinecap="round">
      <path d={group.map((s) => s.stem).join("")} strokeWidth={1.3} />
      <path d={group.map((s) => s.leaves).join("")} strokeWidth={2.4} />
    </g>
  ));
}

function Apples({ items }: { items: Strand[] }) {
  return items.flatMap((s, i) => (s.apple ? [<Apple key={i} x={s.apple[0] - 12 * 0.75} y={s.apple[1] - 3 * 0.75} s={0.75} />] : []));
}

/** Where each goal's name goes, on one line, and its numeral on phones, where the names would be too small. */
const LABELS: { x: number; y: number; numeral: Point }[] = [
  { x: 222, y: 96, numeral: [158, 120] },
  { x: 450, y: 22, numeral: [506, 44] },
  { x: 678, y: 96, numeral: [742, 120] },
];

/** The willow, each golden limb a link to its goal on the agenda page. */
export function AgendaTree() {
  const brown = BROWN_LIMBS.flatMap(withForks);
  const brownStrands = brown.flatMap((c, i) => strands(c, i % 3 ? 0.15 : 0.3, i));
  return (
    <svg viewBox="-20 -8 940 652" className="w-full" role="group" aria-label="The research agenda as a weeping willow: three long-term goals and their near-term problems">
      <ellipse cx={450} cy={636} rx={170} ry={7} className="fill-rule" />
      <Curtain items={brownStrands} shade={() => 0} />
      {brown.map((c, i) => (
        <path key={i} d={taper(c, i % 3 ? 7 : 22, i % 3 ? 2 : 4)} style={{ fill: BARK }} />
      ))}
      <path d="M396 636C424 588 430 470 432 362L468 362C470 470 476 588 506 636Z" style={{ fill: BARK }} />
      <Apples items={brownStrands} />
      {GOLDEN_LIMBS.map((limb, i) => {
        const goal = AGENDA[i];
        const label = LABELS[i];
        const branches = withForks(limb);
        const own = branches.flatMap((c, k) => strands(c, k ? 0.15 : 0.32, 20 + i * 3 + k));
        const tip = limb[3];
        const top = i === 1;
        return (
          <a key={goal.id} href={`/agenda#${goal.id}`} className="group outline-none [&:focus-visible_.halo]:stroke-brand">
            <title>{`Goal ${goal.numeral}: ${goal.title}`}</title>
            <Curtain items={own} shade={(s) => Math.round(Math.min(1, Math.max(0, (s.t - 0.2) / 0.7)) * 4)} />
            {branches.map((c, k) => (
              <path
                key={k}
                d={taper(c, k ? 7 : 24, k ? 2 : 6)}
                style={{ fill: k ? goldenBrown(0.85) : `color-mix(in oklab, var(--color-gold) 88%, ${BARK})` }}
                className="transition group-hover:brightness-110"
              />
            ))}
            <Apples items={own} />
            <circle className="halo fill-none stroke-transparent" cx={tip[0]} cy={tip[1] + (top ? -20 : 22)} r={36} strokeWidth={2.5} />
            <g className="transition group-hover:translate-y-1">
              <Apple x={tip[0] - 12 * 2.4} y={tip[1] - (top ? 20 : 3) * 2.4} s={2.4} gold />
            </g>
            <text x={label.x} y={label.y} textAnchor="middle" fontSize={21} className="fill-gold-dark font-serif font-bold group-hover:underline max-sm:hidden">
              {goal.numeral}. {goal.title}
            </text>
            <text x={label.numeral[0]} y={label.numeral[1]} textAnchor="middle" fontSize={42} className="fill-gold-dark font-serif font-bold sm:hidden">
              {goal.numeral}
            </text>
          </a>
        );
      })}
    </svg>
  );
}

/**
 * The willow, with the researchers who think about it and work on it to its right, as in the paper's figure
 * (their illustrations are one image, public/figures/agenda-people.webp). For the agenda page; on phones the
 * people give way to the goals' names under the tree.
 */
export function AgendaTreeWithPeople() {
  return (
    <div className="grid items-center gap-6 md:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
      <div>
        <AgendaTree />
        <ol className="mt-2 space-y-1 text-center sm:hidden">
          {AGENDA.map((goal) => (
            <li key={goal.id}>
              <Link href={`/agenda#${goal.id}`} className="font-bold text-gold-dark hover:underline">
                {goal.numeral}. {goal.title}
              </Link>
            </li>
          ))}
        </ol>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed illustration, already sized and compressed */}
      <img src="/figures/agenda-people.webp" alt="" width={990} height={1055} loading="lazy" className="h-auto w-full max-md:hidden" />
    </div>
  );
}
