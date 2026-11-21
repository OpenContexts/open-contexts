"use client";

import Link from "next/link";
import { type KeyboardEvent, type ReactNode, useState } from "react";
import { cn } from "@/lib/cn";

// Fig. 2 of the companion paper, "Workflow and status updates", redrawn for the site: problems enter the database
// (the dashed frame) as open, a claimed solution puts them under revision, digestion leads to solved, and disputes
// lead back. Every part says, when clicked, what happens there and where on the site it happens. On wide screens
// it is the drawing; on phones the same parts as a column of cards.

type PartId = "curation" | "open" | "candidate" | "under-revision" | "digestion" | "solved" | "disputes" | "report" | "website";

type Part = { title: string; text: string; links: { href: string; label: string }[] };

const PARTS: Record<PartId, Part> = {
  curation: {
    title: "Curation",
    text: "Researchers propose problems; the moderators admit those that meet the four curation criteria: clarity, relevance, significance and feasibility.",
    links: [
      { href: "/contribute#curation-criteria", label: "The criteria" },
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
    text: "A claimed solution, submitted here or reported to the moderators as a preprint, puts the problem under revision. Partial and unpolished material is welcome too.",
    links: [{ href: "/contribute", label: "How to contribute" }],
  },
  "under-revision": {
    title: "Under revision",
    text: "A solution has been claimed and is being checked. Contributions now verify, challenge, explain or independently re-derive it.",
    links: [{ href: "/problems?status=under-revision", label: "Problems under revision" }],
  },
  digestion: {
    title: "Digestion",
    text: "The community reads, checks and explains the claim, possibly with AI assistance, until humans understand it and it is clearly presented.",
    links: [{ href: "/guidelines#status", label: "The status rules" }],
  },
  solved: {
    title: "Solved",
    text: "Once a peer-reviewed publication settles it, or a human-backed account is verified by three independent researchers with no open dispute.",
    links: [
      { href: "/guidelines#solved", label: "When a problem is solved" },
      { href: "/problems?status=solved", label: "Solved problems" },
    ],
  },
  disputes: {
    title: "Disputes",
    text: "A seconded challenge sends a solved problem back under revision; a withdrawn claim or a flawed statement sends it back to open.",
    links: [{ href: "/guidelines#status", label: "The status rules" }],
  },
  report: {
    title: "Report",
    text: "Advances are collected in progress reports, which everyone who contributed is invited to co-author.",
    links: [{ href: "/progress", label: "Progress so far" }],
  },
  website: {
    title: "Website",
    text: "Everything happens in the open, here: comments and discussion, moderation, corrections, the governance rules and the blog.",
    links: [
      { href: "/guidelines", label: "Guidelines" },
      { href: "/blog", label: "Blog" },
    ],
  },
};

const STATUS_COLOR = { open: "fill-brand", "under-revision": "fill-info", solved: "fill-success" } as const;

export function WorkflowFigure() {
  const [selected, setSelected] = useState<PartId | null>(null);
  return (
    <div>
      <div className="max-sm:hidden">
        <Drawing selected={selected} onSelect={(id) => setSelected((s) => (s === id ? null : id))} />
        <Panel id={selected} />
      </div>
      <Column />
    </div>
  );
}

/** What the selected part means, under the drawing. */
function Panel({ id }: { id: PartId | null }) {
  const part = id && PARTS[id];
  return (
    <div aria-live="polite" className="mx-auto mt-2 min-h-[5.5rem] max-w-160 rounded border border-rule bg-surface px-4 py-3 text-[0.98rem]">
      {part ? (
        <>
          <p>
            <strong>{part.title}.</strong> {part.text}
          </p>
          <PartLinks part={part} />
        </>
      ) : (
        <p className="pt-4 text-center text-ink-subtle">Click any part of the figure to see what happens there.</p>
      )}
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
      aria-label={PARTS[id].title}
      aria-pressed={selected === id}
      onClick={() => onSelect(id)}
      onKeyDown={onKeyDown}
      className={cn("cursor-pointer outline-none transition-opacity [&:focus-visible_.ring]:stroke-brand [&:hover_.ring]:stroke-ink-subtle", selected && selected !== id && "opacity-45")}
    >
      {children}
    </g>
  );
}

/** A box with a label: gold for the steps of the process, red for a problem. */
function Box({ x, y, w, h, label, tone, size = 24 }: { x: number; y: number; w: number; h: number; label: string | [string, string]; tone: "gold" | "red"; size?: number }) {
  const lines = typeof label === "string" ? [label] : label;
  return (
    <>
      <rect className="ring fill-none stroke-transparent" x={x - 5} y={y - 5} width={w + 10} height={h + 10} rx={12} strokeWidth={2} />
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
    </>
  );
}

/** "↳ text" lines under or beside a box, as in the paper. */
function Notes({ x, y, lines, anchor = "start" }: { x: number; y: number; lines: string[]; anchor?: "start" | "middle" }) {
  return lines.map((line, i) => (
    <text key={line} x={x} y={y + i * 24} fontSize={17} textAnchor={anchor} className="fill-ink-muted font-serif">
      ↳ {line}
    </text>
  ));
}

function Apple({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(1.15)`}>
      <path className="fill-[#c00808]" d="M12 8.6C10.8 7.4 9.2 6.8 7.6 7 4.4 7.4 2.6 10.6 3.3 14.4 4 18.5 6.6 21.4 8.6 21.4c1 0 2-.6 3.4-.6s2.4.6 3.4.6c2 0 4.6-2.9 5.3-7 .7-3.8-1.1-7-4.3-7.4-1.6-.2-3.2.4-4.4 1.6z" />
      <path fill="none" stroke="#5a3a1a" strokeWidth={1.7} strokeLinecap="round" d="M12 8.6c0-1.8.6-3.4 1.8-4.6" />
      <path fill="#3f8f3f" d="M13 6.6c.4-2 2.2-3.1 4.4-2.8-.3 2.1-2 3.3-4.4 2.8z" />
    </g>
  );
}

/** A researcher with a tablet, drawn in a few lines. */
function Person({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="stroke-ink" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 10c0-6 4-9 8-9s8 3 8 9c0 2-.5 3.5-1.2 4.6" className="fill-ink" />
      <circle cx={21} cy={11} r={6.5} className="fill-paper" />
      <path d="M9 44c0-14 3-22 12-22s12 8 12 22z" className="fill-surface" />
      <path d="M13 44l1 25M28 44l-1 25" className="fill-none" strokeWidth={4.5} />
      <path d="M10 70h7M24 70h7" className="fill-none" strokeWidth={3} />
      <path d="M30 28c4 3 6 7 7 9l-8 1" className="fill-none" />
      <rect x={33} y={26} width={10} height={14} rx={1.5} transform="rotate(18 38 33)" className="fill-paper" />
    </g>
  );
}

/** An AI assistant: a small robot with an antenna. */
function Robot({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="fill-none stroke-ink" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 2v6" />
      <circle cx={20} cy={2} r={2} className="fill-brand stroke-none" />
      <rect x={7} y={8} width={26} height={19} rx={7} className="fill-surface" />
      <circle cx={15} cy={17} r={2.6} className="fill-info stroke-none" />
      <circle cx={25} cy={17} r={2.6} className="fill-info stroke-none" />
      <rect x={10} y={30} width={20} height={17} rx={4} className="fill-paper" />
      <path d="M10 36l-6 6M30 36l6 6" />
      <rect x={6} y={49} width={28} height={9} rx={4.5} className="fill-surface" />
      <circle cx={12} cy={53.5} r={1.6} className="fill-ink stroke-none" />
      <circle cx={20} cy={53.5} r={1.6} className="fill-ink stroke-none" />
      <circle cx={28} cy={53.5} r={1.6} className="fill-ink stroke-none" />
    </g>
  );
}

function Arrow({ d, dashed }: { d: string; dashed?: boolean }) {
  return <path d={d} className="fill-none stroke-ink" strokeWidth={dashed ? 2 : 3} strokeDasharray={dashed ? "4 5" : undefined} markerEnd={dashed ? "url(#wf-head-thin)" : "url(#wf-head)"} />;
}

/** A process arrow in the brown of the paper's drawing: from a gold box into the frame, or out of it. */
function Feed({ d }: { d: string }) {
  return <path d={d} className="fill-none stroke-gold-dark" strokeWidth={4} markerEnd="url(#wf-feed)" />;
}

function Drawing({ selected, onSelect }: { selected: PartId | null; onSelect: (id: PartId) => void }) {
  const hot = { selected, onSelect };
  const states = [
    { id: "open" as const, x: 75, label: "Open" },
    { id: "under-revision" as const, x: 355, label: "Under revision" },
    { id: "solved" as const, x: 635, label: "Solved" },
  ];
  return (
    <svg viewBox="0 0 1000 500" className="w-full" role="group" aria-label="Workflow and status updates">
      <defs>
        <marker id="wf-head" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={4.5} markerHeight={4.5} orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" className="fill-ink" />
        </marker>
        <marker id="wf-head-thin" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
          <path d="M0 1L9 5L0 9z" className="fill-ink" />
        </marker>
        <marker id="wf-feed" viewBox="0 0 10 10" refX={6} refY={5} markerWidth={3.6} markerHeight={3.6} orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" className="fill-gold-dark" />
        </marker>
      </defs>

      {/* The database: everything inside the dashed frame is on the site. */}
      <rect x={20} y={175} width={815} height={150} rx={18} className="fill-brand-tint stroke-brand" strokeWidth={3} strokeDasharray="10 9" opacity={0.9} />

      {/* Curation, into the frame at "open". */}
      <Hotspot id="curation" {...hot}>
        <Box x={75} y={72} w={170} h={50} label="Curation" tone="gold" size={27} />
      </Hotspot>
      <Feed d="M160 124V170" />

      {/* Digestion, from above into the step from under revision to solved; a person and an AI take part. */}
      <Person x={340} y={14} s={1.1} />
      <Notes x={420} y={36} lines={["High quality of presentation", "Human understanding"]} />
      <Hotspot id="digestion" {...hot}>
        <Box x={500} y={92} w={170} h={50} label="Digestion" tone="gold" size={27} />
      </Hotspot>
      <Robot x={683} y={84} s={1.05} />
      <Feed d="M585 144V170" />

      {/* The three states, with the moves forward and the disputes back. */}
      {states.map((s) => (
        <Hotspot key={s.id} id={s.id} {...hot}>
          <text x={s.x + 85} y={213} textAnchor="middle" fontSize={21} className={cn("font-mono font-bold", STATUS_COLOR[s.id])}>
            {s.label}
          </text>
          <Box x={s.x} y={232} w={170} h={56} label="Problem" tone="red" size={28} />
          <Apple x={s.x - 34} y={244} />
        </Hotspot>
      ))}
      <Arrow d="M256 260H314" />
      <Arrow d="M536 260H594" />
      <Hotspot id="disputes" {...hot}>
        <rect className="ring fill-none stroke-transparent" x={252} y={180} width={370} height={52} rx={10} strokeWidth={2} />
        <rect x={252} y={180} width={370} height={52} className="fill-transparent" />
        <Arrow d="M325 222C305 200 282 200 266 214" dashed />
        <Arrow d="M605 222C585 200 562 200 546 214" dashed />
        <text x={296} y={196} textAnchor="middle" fontSize={16} className="fill-ink-muted font-serif">
          Disputes
        </text>
        <text x={576} y={196} textAnchor="middle" fontSize={16} className="fill-ink-muted font-serif">
          Disputes
        </text>
      </Hotspot>

      {/* Candidate solutions, up into the step from open to under revision. */}
      <Person x={166} y={358} s={0.9} />
      <Hotspot id="candidate" {...hot}>
        <Box x={225} y={362} w={200} h={70} label={["Candidate", "solution"]} tone="gold" size={24} />
      </Hotspot>
      <Robot x={436} y={366} s={0.95} />
      <Feed d="M296 360V330" />
      <Notes x={240} y={460} lines={["Partial solutions", "Unpolished material"]} />

      {/* The report, out of the solved problems. */}
      <Hotspot id="report" {...hot}>
        <Box x={635} y={368} w={170} h={50} label="Report" tone="gold" size={27} />
      </Hotspot>
      <Feed d="M720 328V362" />
      <Notes x={642} y={446} lines={["Progress report", "Collecting solved problems"]} />

      {/* The website around it all. */}
      <Hotspot id="website" {...hot}>
        <rect className="ring fill-none stroke-transparent" x={848} y={150} width={148} height={200} rx={10} strokeWidth={2} />
        <rect x={848} y={150} width={148} height={200} className="fill-transparent" />
        <g transform="translate(856 168)" className="fill-none stroke-ink" strokeWidth={1.8}>
          <circle cx={11} cy={11} r={10} />
          <path d="M1 11h20M11 1c-4 4-4 16 0 20M11 1c4 4 4 16 0 20" />
        </g>
        <text x={884} y={186} fontSize={24} className="fill-ink font-serif">
          Website
        </text>
        <Notes x={860} y={222} lines={["Comments", "Moderation", "Corrections", "Governance", "Blog"]} />
      </Hotspot>
    </svg>
  );
}

/** On phones: the same parts, top to bottom, as a flow chart whose boxes open to say what they mean. */
function Column() {
  const order: PartId[] = ["curation", "open", "candidate", "under-revision", "digestion", "solved", "report"];
  const isState = (id: PartId) => id === "open" || id === "under-revision" || id === "solved";
  return (
    <div className="sm:hidden">
      <p className="mb-2 text-center text-sm text-ink-subtle">Tap a step to see what happens there.</p>
      <ol>
        {order.map((id, i) => (
          <li key={id}>
            <ColumnPart id={id} className={isState(id) ? "border-brand-dark bg-brand-tint" : "border-gold-dark bg-gold-tint"} />
            {i < order.length - 1 && (
              <p aria-hidden className="text-center leading-6 text-ink-subtle">
                ↓
              </p>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <ColumnPart id="disputes" className="border-dashed border-rule-strong" />
        <ColumnPart id="website" className="border-dashed border-rule-strong" />
      </div>
    </div>
  );
}

function ColumnPart({ id, className }: { id: PartId; className?: string }) {
  const part = PARTS[id];
  const color = { open: "text-brand", "under-revision": "text-info", solved: "text-success" }[id as string];
  return (
    <details className={cn("group rounded border-[1.5px] px-3.5 py-2 text-[0.95rem]/snug", className)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
        <strong className={cn(color && "font-mono", color)}>
          {id === "disputes" && "↺ "}
          {part.title}
        </strong>
        <span aria-hidden className="text-ink-subtle transition group-open:rotate-90">
          ›
        </span>
      </summary>
      <p className="mt-1 text-ink-muted">{part.text}</p>
      <PartLinks part={part} />
    </details>
  );
}
