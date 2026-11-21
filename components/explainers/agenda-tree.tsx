import Link from "next/link";
import { AGENDA } from "@/lib/agenda";
import { Apple } from "./drawings";

// The research agenda as a weeping willow, after the companion paper's figure. As a willow's crown does, it builds
// up in tiers: every limb arches up and over, and each arch hangs a fringe of leafy strands below it, the lower
// arches' fringes in front of the higher ones. The trunk and most limbs are brown; the three top limbs turn from
// brown to gold, one per long-term goal, named above the crown. Red apples, the near-term problems, hang from some
// strands; they are a picture of the idea, not the actual problems (there will be too many). Each golden limb
// links to its goal on the agenda page.

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

const r = (v: number) => String(Math.round(v));

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
  return `M${[...left, ...right.reverse()].map(([x, y]) => `${r(x)} ${r(y)}`).join("L")}Z`;
}

const mirror = (c: Curve): Curve => c.map(([x, y]) => [900 - x, y]) as Curve;

/**
 * An arch growing out of a limb at `t`: up and outwards (away from the trunk, or to `side` near it), then down
 * at its end. `rise` sets how high it climbs, as a share of its length.
 */
function arch(c: Curve, t: number, side: 1 | -1, length: number, rise = 0.55): Curve {
  const [sx, sy] = at(c, t);
  const out = Math.abs(sx - 450) > 24 ? Math.sign(sx - 450) : side;
  return [
    [sx, sy],
    [sx + out * length * 0.25, sy - length * rise],
    [sx + out * length * 0.8, sy - length * rise * 0.95],
    [sx + out * length, sy - length * rise * 0.05],
  ];
}

/** A limb and the arches growing out of it: [t, side, length, rise]. */
type Limb = { curve: Curve; arches: [number, 1 | -1, number, number][]; width: number };

const both = (l: Limb): Limb[] => [l, { ...l, curve: mirror(l.curve) }];

/** The brown limbs, low and middle tier, left and right. */
const LOW: Limb[] = both({ curve: [[438, 360], [370, 318], [250, 280], [120, 300]], arches: [[0.4, -1, 92, 0.5], [0.68, 1, 80, 0.45], [0.9, -1, 60, 0.35]], width: 22 });
const MIDDLE: Limb[] = both({ curve: [[442, 342], [400, 262], [300, 205], [180, 210]], arches: [[0.38, 1, 90, 0.55], [0.64, -1, 84, 0.5], [0.88, 1, 64, 0.4]], width: 20 });

/** The three golden limbs, of the goals, left to right; the middle one arches over to the right, not straight up. */
const GOLDEN: Limb[] = [
  { curve: [[444, 338], [418, 246], [330, 150], [222, 150]], arches: [[0.5, -1, 86, 0.55], [0.78, 1, 70, 0.45]], width: 22 },
  { curve: [[450, 336], [446, 228], [452, 92], [572, 92]], arches: [[0.46, -1, 92, 0.5], [0.74, 1, 76, 0.4]], width: 22 },
  { curve: [[456, 338], [496, 262], [600, 200], [708, 214]], arches: [[0.5, 1, 84, 0.5], [0.8, -1, 66, 0.42]], width: 22 },
];

const BARK = "light-dark(#3f2a1b, #9a7655)";
const LEAF = "light-dark(#5e4330, #ad8a66)";

/** Brown turning gold: `golden` of the way (0 to 1). */
const goldenBrown = (golden: number) => `color-mix(in oklab, var(--color-gold) ${Math.round(Math.min(1, Math.max(0, golden)) * 100)}%, ${LEAF})`;

type Strand = { stem: string; leaves: string; apple?: Point; shade: number };

/**
 * The fringe of an arch: strands every `gap` units along it from `from` on, hanging to `fringe` units below the
 * arch's end, a little ragged. Each strand bends outwards as it falls, with narrow leaves in pairs along it. `shade` is its step from brown (0) to gold (4), from `gold(t)`; some strands bear an apple.
 */
function fringe(c: Curve, from: number, depth: number, seed: number, gold: (t: number) => number, gap = 15): Strand[] {
  const bottom = c[3][1] + depth;
  const out: Strand[] = [];
  let walked = gap;
  let last = at(c, from);
  for (let i = 0; i <= 80; i++) {
    const t = from + ((1 - from) * i) / 80;
    const p = at(c, t);
    walked += Math.hypot(p[0] - last[0], p[1] - last[1]);
    last = p;
    if (walked < gap) continue;
    walked = 0;
    const j = seed * 13 + out.length;
    const [x, y] = p;
    const length = Math.max(34, bottom - y + Math.sin(j * 2.1) * 14 + Math.sin(j * 0.7) * 10);
    const sway = (Math.sign(x - 450) || 1) * (3 + 4 * Math.abs(Math.sin(j * 1.3)));
    const s: Curve = [[x, y], [x + sway, y + 10], [x + sway * 1.2, y + length * 0.55], [x + sway * 0.8, y + length]];
    const leaves: string[] = [];
    // Each pair of leaves a V: from the twig up and out, as a willow's narrow leaves lie along a hanging twig.
    for (let d = 10; d < length; d += 8) {
      const [lx, ly] = at(s, d / length);
      const size = 3.4 + 1.2 * (d / length);
      leaves.push(`M${r(lx - size)} ${r(ly - size * 1.5)}L${r(lx)} ${r(ly)}L${r(lx + size)} ${r(ly - size * 1.5)}`);
    }
    out.push({
      stem: `M${r(x)} ${r(y)}C${s.slice(1).map(([px, py]) => `${r(px)} ${r(py)}`).join(" ")}`,
      leaves: leaves.join(""),
      apple: j % 6 === 1 ? at(s, 1) : j % 9 === 4 ? at(s, 0.7) : undefined,
      shade: Math.round(Math.min(1, Math.max(0, gold(t))) * 4),
    });
  }
  return out;
}

/** A limb's fringes: along the limb itself (past the trunk) and along each of its arches. */
function limbFringes(l: Limb, seed: number, depth: number, gold: (t: number, k: number) => number): Strand[] {
  const curves = [l.curve, ...l.arches.map(([t, side, length, rise]) => arch(l.curve, t, side, length, rise))];
  return curves.flatMap((c, k) => fringe(c, k ? 0.2 : 0.42, depth + (k ? 0 : 20), seed + k, (t) => gold(t, k)));
}

/** A curtain of strands: strands of one shade share two paths, twigs and leaves, so the leaves stay few elements. */
function Curtain({ items }: { items: Strand[] }) {
  const groups = new Map<number, Strand[]>();
  for (const s of items) groups.set(s.shade, [...(groups.get(s.shade) ?? []), s]);
  return [...groups].map(([shade, group]) => (
    <g key={shade} style={{ stroke: goldenBrown(shade / 4) }} className="fill-none" strokeLinecap="round">
      <path d={group.map((s) => s.stem).join("")} strokeWidth={1.2} />
      <path d={group.map((s) => s.leaves).join("")} strokeWidth={1.7} />
    </g>
  ));
}

function Apples({ items }: { items: Strand[] }) {
  return items.flatMap((s, i) => (s.apple ? [<Apple key={i} x={s.apple[0] - 12 * 0.72} y={s.apple[1] - 3 * 0.72} s={0.72} />] : []));
}

/** A limb and its arches as wood, brown or (`paint`) a gradient. */
function Wood({ limb, paint }: { limb: Limb; paint: string }) {
  return (
    <g style={{ fill: paint }}>
      <path d={taper(limb.curve, limb.width, 5)} />
      {limb.arches.map(([t, side, length, rise], k) => (
        <path key={k} d={taper(arch(limb.curve, t, side, length, rise), 7, 1.5)} />
      ))}
    </g>
  );
}

/** Each goal's name above the crown, on one line, joined to its limb by a dotted line as in the paper's figure. */
const LABELS: { x: number; y: number; anchor: "start" | "middle" | "end"; to: Point; numeral: Point }[] = [
  { x: 10, y: 52, anchor: "start", to: [290, 152], numeral: [266, 132] },
  { x: 450, y: 22, anchor: "middle", to: [480, 92], numeral: [470, 70] },
  { x: 890, y: 52, anchor: "end", to: [640, 214], numeral: [644, 186] },
];

/** The willow, each golden limb a link to its goal on the agenda page. */
export function AgendaTree() {
  const brown = (layer: Limb[], depth: number, seed: number) => layer.flatMap((l, i) => limbFringes(l, seed + i * 5, depth, () => 0));
  const low = brown(LOW, 165, 1);
  const middle = brown(MIDDLE, 135, 20);
  return (
    <svg viewBox="0 0 900 590" className="w-full" role="group" aria-label="The research agenda as a weeping willow: three long-term goals and their near-term problems">
      <defs>
        {GOLDEN.map((l, i) => (
          <linearGradient key={i} id={`willow-gold-${i}`} gradientUnits="userSpaceOnUse" x1={l.curve[0][0]} y1={l.curve[0][1]} x2={l.curve[3][0]} y2={l.curve[3][1]}>
            <stop offset="0.1" style={{ stopColor: BARK }} />
            <stop offset="0.85" style={{ stopColor: "var(--color-gold)" }} />
          </linearGradient>
        ))}
      </defs>

      {/* From the back to the front: the golden top tier, the middle tier, the trunk, the low tier. */}
      {GOLDEN.map((limb, i) => {
        const goal = AGENDA[i];
        const label = LABELS[i];
        // Along the limb, the strands turn golden towards its end; on its arches, which grow from its outer half, they are golden.
        const own = limbFringes(limb, 60 + i * 7, 100, (t, k) => (k ? 0.75 + t * 0.25 : (t - 0.35) / 0.55));
        return (
          <a key={goal.id} href={`/agenda#${goal.id}`} className="group outline-none [&:focus-visible_text]:underline">
            <title>{`Goal ${goal.numeral}: ${goal.title}`}</title>
            <Curtain items={own} />
            <g className="transition group-hover:brightness-110">
              <Wood limb={limb} paint={`url(#willow-gold-${i})`} />
            </g>
            <Apples items={own} />
            <path d={`M${label.x + (label.anchor === "start" ? 120 : label.anchor === "end" ? -90 : 0)} ${label.y + 8}L${label.to[0]} ${label.to[1] - 6}`} className="fill-none stroke-ink-subtle max-sm:hidden" strokeWidth={1.4} strokeDasharray="2 4" strokeLinecap="round" />
            <text x={label.x} y={label.y} textAnchor={label.anchor} fontSize={22} className="fill-gold-dark font-serif font-bold group-hover:underline max-sm:hidden">
              {goal.numeral}. {goal.title}
            </text>
            <text x={label.numeral[0]} y={label.numeral[1]} textAnchor="middle" fontSize={40} className="fill-gold-dark font-serif font-bold sm:hidden">
              {goal.numeral}
            </text>
          </a>
        );
      })}
      <Curtain items={middle} />
      {MIDDLE.map((l, i) => (
        <Wood key={i} limb={l} paint={BARK} />
      ))}
      <Apples items={middle} />
      <path d="M396 588C420 546 425 460 428 340L472 340C475 460 480 546 504 588Z" style={{ fill: BARK }} />
      <Curtain items={low} />
      {LOW.map((l, i) => (
        <Wood key={i} limb={l} paint={BARK} />
      ))}
      <Apples items={low} />
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
