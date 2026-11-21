import { AGENDA } from "@/lib/agenda";
import { Apple } from "./drawings";

// The research agenda as a weeping willow, after the companion paper's figure: a brown trunk, and three big
// branches, one per long-term goal, that arch up and turn golden towards their tips, where the goal's golden apple
// hangs. A curtain of thin leafy strands falls from them, some bearing the red apples of near-term problems. The
// small apples are a picture of the idea, not the actual problems (there will be too many); each branch links to
// its goal.

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

/** An outer branch: it arches up from the trunk and droops; its strands hang along all of it. */
type Arch = { curve: Curve; side: 1 | -1 };

/** The three goals' branches. The middle one rises to the crown, which droops to both sides in two short arches. */
const BRANCHES: { stem: Curve; arches: Arch[]; tip: Point; crown?: boolean }[] = [
  { stem: [[444, 335], [410, 205], [270, 122], [128, 208]], arches: [{ curve: [[444, 335], [410, 205], [270, 122], [128, 208]], side: -1 }], tip: [128, 208] },
  {
    stem: [[450, 335], [452, 250], [447, 170], [450, 106]],
    arches: [
      { curve: [[449, 152], [430, 112], [385, 106], [348, 168]], side: -1 },
      { curve: [[451, 152], [470, 112], [515, 106], [552, 168]], side: 1 },
    ],
    tip: [450, 106],
    crown: true,
  },
  { stem: [[456, 335], [490, 205], [630, 122], [772, 208]], arches: [{ curve: [[456, 335], [490, 205], [630, 122], [772, 208]], side: 1 }], tip: [772, 208] },
];

/** Where each goal's name goes, on one line: above the crown for the middle, beside it for the outer two. */
const LABELS: { x: number; y: number; anchor: "start" | "middle" | "end" }[] = [
  { x: 372, y: 96, anchor: "end" },
  { x: 450, y: 44, anchor: "middle" },
  { x: 528, y: 96, anchor: "start" },
];

type Strand = { d: string; leaves: { x: number; y: number; angle: number }[]; apples: Point[]; t: number };

/**
 * The strands hanging from an arch, like a willow's: many thin twigs that leave it, bend outwards and fall,
 * reaching down to about the same height, so that together they make the curtain of the crown. Small leaves
 * along them; an apple on some, at the end or partway down, so that not every strand bears one.
 */
function strands({ curve, side }: Arch, count: number, bottom: number, from: number): Strand[] {
  return Array.from({ length: count }, (_, j) => {
    const t = from + ((1 - from) * j) / (count - 1);
    const start = at(curve, t);
    // A little irregular, as twigs are: the length and sway vary from one to the next.
    const wave = Math.sin(j * 2.3) * 0.5 + Math.sin(j * 1.1) * 0.5;
    const length = Math.max(60, bottom - start[1] + wave * 26);
    const sway = side * (12 + 7 * Math.abs(Math.sin(j * 1.7)));
    const c: Curve = [start, [start[0] + sway * 0.9, start[1] + 18], [start[0] + sway, start[1] + length * 0.55], [start[0] + sway * 0.75, start[1] + length]];
    const leaves = [0.28, 0.44, 0.6, 0.76, 0.9].map((f, k) => {
      const [x, y] = at(c, f);
      return { x, y, angle: (k % 2 ? 1 : -1) * 38 };
    });
    const apples: Point[] = [];
    if (j % 3 === 0) apples.push(at(c, 1));
    else if (j % 5 === 2) apples.push(at(c, 0.62));
    return { d: taper(c, 2.6, 0.8, 14), leaves, apples, t };
  });
}

const BROWN = "light-dark(#6b4a2f, #a3805c)";

/** Brown turning gold: the colour `golden` (0 to 1) of the way along. */
const goldenBrown = (golden: number) => `color-mix(in oklab, var(--color-gold) ${Math.round(Math.min(1, Math.max(0, golden)) * 100)}%, ${BROWN})`;

/** The tree, with each goal's branch a link to it on the agenda page. */
export function AgendaTree() {
  return (
    <svg viewBox="-70 12 1040 545" className="w-full" role="group" aria-label="The research agenda as a tree: three long-term goals and their near-term problems">
      <defs>
        {BRANCHES.map((b, i) => (
          <linearGradient key={i} id={`willow-${i}`} gradientUnits="userSpaceOnUse" x1={b.stem[0][0]} y1={b.stem[0][1]} x2={b.stem[3][0]} y2={b.stem[3][1]}>
            <stop offset="0.12" style={{ stopColor: BROWN }} />
            <stop offset="0.9" style={{ stopColor: "var(--color-gold)" }} />
          </linearGradient>
        ))}
      </defs>
      <ellipse cx={450} cy={548} rx={160} ry={7} className="fill-rule" />
      <path d="M410 549C428 495 433 420 436 330L464 330C467 420 472 495 490 549Z" style={{ fill: BROWN }} />
      {BRANCHES.map((b, i) => {
        const goal = AGENDA[i];
        const label = LABELS[i];
        const paint = `url(#willow-${i})`;
        const hanging = b.arches.flatMap((arch) => (b.crown ? strands(arch, 9, 352, 0.15) : strands(arch, 17, 395, 0.16)));
        return (
          <a key={goal.id} href={`/agenda#${goal.id}`} className="group outline-none [&:focus-visible_.halo]:stroke-brand">
            <title>{`Goal ${goal.numeral}: ${goal.title}`}</title>
            {hanging.map((h, j) => {
              // The crown is golden throughout; along an outer branch, the strands turn golden towards its tip.
              const fill = goldenBrown(b.crown ? 0.9 : (h.t - 0.15) / 0.7);
              return (
                <g key={j}>
                  <path d={h.d} style={{ fill }} />
                  {h.leaves.map((l, k) => (
                    <ellipse key={k} cx={l.x} cy={l.y} rx={5} ry={1.7} transform={`rotate(${l.angle} ${l.x} ${l.y})`} style={{ fill }} />
                  ))}
                  {h.apples.map(([x, y], k) => (
                    <Apple key={k} x={x - 12 * 0.7} y={y - 3 * 0.7} s={0.7} />
                  ))}
                </g>
              );
            })}
            <path d={taper(b.stem, 34, b.crown ? 12 : 7)} style={{ fill: paint }} className="transition group-hover:brightness-110" />
            {b.crown && b.arches.map((arch, a) => <path key={a} d={taper(arch.curve, 13, 5)} style={{ fill: paint }} />)}
            <circle className="halo fill-none stroke-transparent" cx={b.tip[0]} cy={b.tip[1] + (b.crown ? -18 : 22)} r={34} strokeWidth={2.5} />
            <g className="transition group-hover:translate-y-1">
              <Apple x={b.tip[0] - 12 * 2.3} y={b.tip[1] - (b.crown ? 20 : 3) * 2.3} s={2.3} gold />
            </g>
            <text x={label.x} y={label.y} textAnchor={label.anchor} fontSize={24} className="fill-gold-dark font-serif font-bold group-hover:underline">
              {goal.numeral}. {goal.title}
            </text>
          </a>
        );
      })}
    </svg>
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
