"use client";

import Link from "next/link";
import { type KeyboardEvent, type ReactNode, useState } from "react";
import { cn } from "@/lib/cn";
import { Apple } from "./drawings";

// Fig. 2 of the companion paper, "Workflow and status updates", redrawn for the site: problems enter the database
// (the dashed frame) as open, a claimed solution puts them under revision, digestion leads to solved, and disputes
// lead back. Every box says, when clicked, what happens there and where on the site it happens. On wide screens it
// is the drawing; on phones the same drawing turned to run top to bottom.

type PartId = "curation" | "open" | "candidate" | "under-revision" | "digestion" | "solved" | "disputes" | "report";

type Part = { title: string; text: string; links: { href: string; label: string }[] };

const PARTS: Record<PartId, Part> = {
  curation: {
    title: "Curation",
    text: "Researchers propose problems; the moderators admit those that meet the four curation criteria: clarity, relevance, significance and feasibility.",
    links: [
      { href: "/contribute#propose", label: "The criteria" },
      { href: "/contribute/new-problem", label: "Propose a problem" },
    ],
  },
  open: {
    title: "Open",
    text: "Every problem enters the database as open. Anyone signed in can add partial or negative results, evidence, references, a reformulation, or a solution.",
    links: [{ href: "/problems?status=open", label: "Open problems" }],
  },
  candidate: {
    title: "Candidate solution",
    text: "A claimed solution, submitted here or reported to the moderators as a preprint, puts the problem under revision. Partial solutions and unpolished material are welcome too.",
    links: [{ href: "/contribute", label: "How to contribute" }],
  },
  "under-revision": {
    title: "Under revision",
    text: "A solution has been claimed and is being checked. Contributions now verify, challenge, explain or independently re-derive it.",
    links: [{ href: "/problems?status=under-revision", label: "Problems under revision" }],
  },
  digestion: {
    title: "Digestion",
    text: "The community reads, checks and explains the claim, possibly with AI assistance, aiming at human understanding and a high-quality presentation.",
    links: [{ href: "/about#status", label: "The status rules" }],
  },
  solved: {
    title: "Solved",
    text: "Once a peer-reviewed publication settles it, or a human-backed account is verified by three independent researchers with no open dispute.",
    links: [
      { href: "/about#solved", label: "When a problem is solved" },
      { href: "/problems?status=solved", label: "Solved problems" },
    ],
  },
  disputes: {
    title: "Disputes",
    text: "A seconded challenge sends a solved problem back under revision; a withdrawn claim or a flawed statement sends it back to open.",
    links: [{ href: "/about#status", label: "The status rules" }],
  },
  report: {
    title: "Report",
    text: "Advances are collected in progress reports, together with the solved problems; everyone who contributed is invited to co-author them.",
    links: [{ href: "/progress", label: "Progress so far" }],
  },
};

const STATUS_FILL = { open: "fill-brand", "under-revision": "fill-info", solved: "fill-success" } as const;

export function WorkflowFigure() {
  const [selected, setSelected] = useState<PartId | null>(null);
  const select = (id: PartId) => setSelected((s) => (s === id ? null : id));
  return (
    <div>
      <p className="mb-1 text-right font-sans text-xs text-ink-subtle max-sm:text-center">
        <span aria-hidden className="mr-1 inline-flex size-4 items-center justify-center rounded-full bg-ink font-bold text-paper">
          i
        </span>
        <span className="max-sm:hidden">Click</span>
        <span className="sm:hidden">Tap</span> a box to see what happens there
      </p>
      <Drawing selected={selected} onSelect={select} />
      <TallDrawing selected={selected} onSelect={select} />
      <div aria-live="polite">{selected && <Panel part={PARTS[selected]} onClose={() => setSelected(null)} />}</div>
    </div>
  );
}

/**
 * What the selected box means: under the drawing, or on phones, where the tall drawing would push it out of
 * sight, as a card at the foot of the screen.
 */
function Panel({ part, onClose }: { part: Part; onClose: () => void }) {
  return (
    <div className="relative mx-auto mt-2 max-w-160 rounded border border-rule-strong bg-surface py-3 pr-10 pl-4 text-[0.98rem] max-sm:fixed max-sm:inset-x-3 max-sm:bottom-3 max-sm:z-30 max-sm:mt-0 max-sm:shadow-xl">
      <p>
        <strong>{part.title}.</strong> {part.text}
      </p>
      <PartLinks part={part} />
      <button type="button" onClick={onClose} aria-label="Close" className="absolute top-2 right-2 flex size-7 cursor-pointer items-center justify-center rounded text-ink-subtle hover:bg-rule/60 hover:text-ink">
        ×
      </button>
    </div>
  );
}

function PartLinks({ part }: { part: Part }) {
  return (
    <p className="mt-1.5 flex flex-wrap gap-x-4 text-sm">
      {part.links.map((l) => (
        <Link key={l.href} href={l.href} className="text-brand hover:underline">
          {l.label} →
        </Link>
      ))}
    </p>
  );
}

/** One clickable part of the drawing: a button for the keyboard and screen readers too. */
function Hotspot({ id, selected, onSelect, children }: { id: PartId; selected: PartId | null; onSelect: (id: PartId) => void; children: ReactNode }) {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(id);
    }
  };
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${PARTS[id].title}: what happens there`}
      aria-pressed={selected === id}
      onClick={() => onSelect(id)}
      onKeyDown={onKeyDown}
      className={cn(
        "cursor-pointer outline-none transition-opacity [&:focus-visible_.ring]:stroke-brand [&:hover_.ring]:stroke-ink-subtle",
        selected === id && "[&_.ring]:stroke-ink",
        selected && selected !== id && "opacity-45",
      )}
    >
      {children}
    </g>
  );
}

/** The small "i" on a clickable box's corner. */
function Badge({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={10} className="fill-ink stroke-paper" strokeWidth={2} />
      <text x={x} y={y + 0.5} dominantBaseline="central" textAnchor="middle" fontSize={13} className="fill-paper font-sans font-bold">
        i
      </text>
    </g>
  );
}

/** A box with a label and its "i": gold for the steps of the process, red for a problem. */
function Box({ x, y, w, h, label, tone, size = 24 }: { x: number; y: number; w: number; h: number; label: string | [string, string]; tone: "gold" | "red"; size?: number }) {
  const lines = typeof label === "string" ? [label] : label;
  return (
    <>
      <rect className="ring fill-none stroke-transparent" x={x - 6} y={y - 6} width={w + 12} height={h + 12} rx={12} strokeWidth={2} />
      <rect x={x} y={y} width={w} height={h} rx={8} strokeWidth={2.5} className={tone === "gold" ? "fill-gold stroke-gold-dark" : "fill-brand-strong stroke-brand-dark"} />
      {lines.map((line, i) => (
        <text
          key={line}
          x={x + w / 2}
          y={y + h / 2 + (i - (lines.length - 1) / 2) * size * 1.05}
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={size}
          className={cn("font-serif", tone === "gold" ? "fill-[#111]" : "fill-white")}
        >
          {line}
        </text>
      ))}
      <Badge x={x + w - 2} y={y + 2} />
    </>
  );
}

/** The arrowheads, with ids of their own per drawing: a drawing that is hidden can't lend its markers to the other. */
function Markers({ ids }: { ids: string }) {
  return (
    <defs>
      <marker id={`${ids}-head`} viewBox="0 0 10 10" refX={8} refY={5} markerWidth={4.5} markerHeight={4.5} orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10z" className="fill-ink" />
      </marker>
      <marker id={`${ids}-head-thin`} viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
        <path d="M0 1L9 5L0 9z" className="fill-ink" />
      </marker>
      <marker id={`${ids}-feed`} viewBox="0 0 10 10" refX={6} refY={5} markerWidth={3.6} markerHeight={3.6} orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10z" className="fill-gold-dark" />
      </marker>
    </defs>
  );
}

function Arrow({ d, dashed, ids }: { d: string; dashed?: boolean; ids: string }) {
  return <path d={d} className="fill-none stroke-ink" strokeWidth={dashed ? 2 : 3} strokeDasharray={dashed ? "4 5" : undefined} markerEnd={`url(#${ids}-head${dashed ? "-thin" : ""})`} />;
}

/** One of the paper's illustrations (public/figures), placed in the drawing's units; `w` and `h` keep its proportions. */
function Illustration({ name, x, y, w, h }: { name: string; x: number; y: number; w: number; h: number }) {
  return <image href={`/figures/${name}.webp`} x={x} y={y} width={w} height={h} aria-hidden />;
}

/** A process arrow in the brown of the paper's drawing: from a gold box into the frame, or out of it. */
function Feed({ d, ids }: { d: string; ids: string }) {
  return <path d={d} className="fill-none stroke-gold-dark" strokeWidth={4} markerEnd={`url(#${ids}-feed)`} />;
}

/** The ids of the wide drawing's markers, and of the tall one's. */
const W = "wf-wide";
const T = "wf-tall";

/** The figure as in the paper, for wide screens. */
function Drawing({ selected, onSelect }: { selected: PartId | null; onSelect: (id: PartId) => void }) {
  const hot = { selected, onSelect };
  const states = [
    { id: "open" as const, x: 75, label: "Open" },
    { id: "under-revision" as const, x: 355, label: "Under revision" },
    { id: "solved" as const, x: 635, label: "Solved" },
  ];
  return (
    <svg viewBox="0 40 850 410" className="w-full max-sm:hidden" role="group" aria-label="Workflow and status updates">
      <Markers ids={W} />

      {/* The database: everything inside the dashed frame is on the site. */}
      <rect x={20} y={175} width={815} height={150} rx={18} className="fill-brand-tint stroke-brand" strokeWidth={3} strokeDasharray="10 9" opacity={0.9} />

      {/* Curation, into the frame at "open". */}
      <Hotspot id="curation" {...hot}>
        <Box x={85} y={82} w={170} h={50} label="Curation" tone="gold" size={27} />
      </Hotspot>
      <Feed ids={W} d="M170 134V170" />

      {/* Digestion by people and AI, from above into the step from under revision to solved. */}
      <Illustration name="researcher-tablet" x={392} y={40} w={70} h={131} />
      <Hotspot id="digestion" {...hot}>
        <Box x={500} y={82} w={170} h={50} label="Digestion" tone="gold" size={27} />
      </Hotspot>
      <Illustration name="robot-magnifier" x={684} y={62} w={76} h={106} />
      <Feed ids={W} d="M585 134V170" />

      {/* The three states, with the moves forward and the disputes back. */}
      {states.map((s) => (
        <Hotspot key={s.id} id={s.id} {...hot}>
          <text x={s.x + 85} y={213} textAnchor="middle" fontSize={21} className={cn("font-mono font-bold", STATUS_FILL[s.id])}>
            {s.label}
          </text>
          <Box x={s.x} y={232} w={170} h={56} label="Problem" tone="red" size={28} />
          <Apple x={s.x - 34} y={244} s={1.15} />
        </Hotspot>
      ))}
      <Arrow ids={W} d="M256 260H314" />
      <Arrow ids={W} d="M536 260H594" />
      <Hotspot id="disputes" {...hot}>
        <rect className="ring fill-none stroke-transparent" x={252} y={180} width={370} height={52} rx={10} strokeWidth={2} />
        <rect x={252} y={180} width={370} height={52} className="fill-transparent" />
        <Arrow ids={W} d="M325 222C305 200 282 200 266 214" dashed />
        <Arrow ids={W} d="M605 222C585 200 562 200 546 214" dashed />
        {[296, 576].map((x) => (
          <text key={x} x={x} y={196} textAnchor="middle" fontSize={16} textDecoration="underline dotted" className="fill-ink-muted font-serif">
            Disputes
          </text>
        ))}
      </Hotspot>

      {/* Candidate solutions, by people and AI, up into the step from open to under revision. */}
      <Illustration name="researcher-pointing" x={150} y={334} w={68} h={106} />
      <Hotspot id="candidate" {...hot}>
        <Box x={225} y={362} w={200} h={70} label={["Candidate", "solution"]} tone="gold" size={24} />
      </Hotspot>
      <Illustration name="robot-apple" x={434} y={352} w={72} h={87} />
      <Feed ids={W} d="M296 360V330" />

      {/* The report, out of the solved problems. */}
      <Hotspot id="report" {...hot}>
        <Box x={635} y={368} w={170} h={50} label="Report" tone="gold" size={27} />
      </Hotspot>
      <Feed ids={W} d="M720 328V362" />
    </svg>
  );
}

/**
 * The figure for phones: the same parts in the same style, turned to run top to bottom. The database (the dashed
 * frame) holds the three states one above the other; curation feeds it from the top, candidate solutions and
 * digestion from the sides, and the report leaves it at the bottom.
 */
function TallDrawing({ selected, onSelect }: { selected: PartId | null; onSelect: (id: PartId) => void }) {
  const hot = { selected, onSelect };
  const states = [
    { id: "open" as const, y: 150, label: "Open" },
    { id: "under-revision" as const, y: 350, label: "Under revision" },
    { id: "solved" as const, y: 550, label: "Solved" },
  ];
  return (
    <svg viewBox="0 0 400 764" className="w-full sm:hidden" role="group" aria-label="Workflow and status updates">
      <Markers ids={T} />
      <rect x={96} y={100} width={208} height={566} rx={16} className="fill-brand-tint stroke-brand" strokeWidth={3} strokeDasharray="10 9" opacity={0.9} />

      <Hotspot id="curation" {...hot}>
        <Box x={125} y={14} w={150} h={46} label="Curation" tone="gold" size={23} />
      </Hotspot>
      <Feed ids={T} d="M200 62V95" />

      {states.map((s) => (
        <Hotspot key={s.id} id={s.id} {...hot}>
          <text x={212} y={s.y - 14} textAnchor="middle" fontSize={19} className={cn("font-mono font-bold", STATUS_FILL[s.id])}>
            {s.label}
          </text>
          <Box x={134} y={s.y} w={156} h={50} label="Problem" tone="red" size={24} />
          <Apple x={103} y={s.y + 12} s={1.05} />
        </Hotspot>
      ))}
      <Arrow ids={T} d="M212 206V316" />
      <Arrow ids={T} d="M212 406V516" />
      <Hotspot id="disputes" {...hot}>
        <rect className="ring fill-none stroke-transparent" x={226} y={208} width={74} height={112} rx={10} strokeWidth={2} />
        <rect className="ring fill-none stroke-transparent" x={124} y={408} width={74} height={112} rx={10} strokeWidth={2} />
        <rect x={226} y={208} width={74} height={112} className="fill-transparent" />
        <rect x={124} y={408} width={74} height={112} className="fill-transparent" />
        <Arrow ids={T} d="M238 300C262 278 262 240 240 216" dashed />
        <Arrow ids={T} d="M186 500C162 478 162 440 184 416" dashed />
        <text x={278} y={262} textAnchor="middle" fontSize={14} textDecoration="underline dotted" transform="rotate(-90 278 262)" className="fill-ink-muted font-serif">
          Disputes
        </text>
        <text x={146} y={462} textAnchor="middle" fontSize={14} textDecoration="underline dotted" transform="rotate(-90 146 462)" className="fill-ink-muted font-serif">
          Disputes
        </text>
      </Hotspot>

      {/* Candidate solutions come in from the left, between open and under revision. */}
      <Illustration name="researcher-pointing" x={0} y={160} w={44} h={68} />
      <Illustration name="robot-apple" x={44} y={176} w={44} h={53} />
      <Hotspot id="candidate" {...hot}>
        <Box x={4} y={236} w={84} h={56} label={["Candidate", "solution"]} tone="gold" size={14} />
      </Hotspot>
      <Feed ids={T} d="M90 264H202" />

      {/* Digestion comes in from the right, between under revision and solved. */}
      <Illustration name="researcher-tablet" x={312} y={360} w={42} h={79} />
      <Illustration name="robot-magnifier" x={352} y={378} w={44} h={61} />
      <Hotspot id="digestion" {...hot}>
        <Box x={312} y={446} w={84} h={44} label="Digestion" tone="gold" size={15} />
      </Hotspot>
      <Feed ids={T} d="M310 468H222" />

      <Hotspot id="report" {...hot}>
        <Box x={137} y={706} w={150} h={46} label="Report" tone="gold" size={23} />
      </Hotspot>
      <Feed ids={T} d="M212 668V700" />
    </svg>
  );
}
