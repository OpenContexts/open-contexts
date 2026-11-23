"use client";

import { type ReactNode, useState } from "react";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";
import { FEATURES } from "./content";
import { Glyph } from "./tiles";

// What the database records (Box II of the companion paper): the six features as titles in rows of three. Pointing
// at one (hover, focus or tap) opens its row and shows its line of explanation; below them, how an entry on the site
// records it. On narrow screens every title shows its line.
// The examples are sketches, with variables for numbers, so they cannot pass for real entries.

/** A variable, set like one in a formula. */
const V = ({ children }: { children: string }) => <em className="font-serif">{children}</em>;

/** How an entry shows each feature, in the order of FEATURES. */
const EXAMPLES: ReactNode[] = [
  <>
    <strong>
      Problem <V>n</V>: the question, stated precisely
    </strong>{" "}
    <Tag tone="warning" strong>
      Under revision
    </Tag>{" "}
    <span className="text-ink-subtle">since 12 March</span>
  </>,
  <>
    <Tag tone="success">Partial result</Tag> A special case <span className="mx-1.5 text-ink-subtle">·</span>
    <Tag tone="danger" strong>
      Negative result
    </Tag>{" "}
    A route that does not work
  </>,
  <>
    <Tag tone="warning">Evidence</Tag> Rough numerics for small cases, still to be checked
  </>,
  <>
    <Tag tone="warning" strong>
      Claimed solution
    </Tag>{" "}
    A proof of the full statement{" "}
    <span className="ml-1 font-sans text-xs font-bold whitespace-nowrap">
      <span className="text-success">✓ 2 verifications</span> <span className="ml-1.5 text-brand">✕ 1 challenge</span>
    </span>
  </>,
  <>
    <span className="font-sans text-xs font-bold text-brand tabular-nums">
      {SITE.name} <V>n</V>.<V>k</V>
    </span>{" "}
    <span className="text-ink-muted">by A. Researcher and B. Researcher · partially AI-assisted</span>
  </>,
  <>
    <Tag tone="success">Advance</Tag> After publication: a simpler proof, and a corrected constant
  </>,
];

/** Titles per row on wide screens. */
const PER_ROW = 3;

export function FeatureExplorer() {
  // The feature pointed at last, the first to begin with: its row opens, its line shows, and its example below.
  const [active, setActive] = useState(0);
  const row = (i: number) => Math.floor(i / PER_ROW);
  return (
    <div>
      <ul className="grid gap-x-4 gap-y-2 md:grid-cols-3">
        {FEATURES.map((f, i) => {
          return (
            <li key={i}>
              <button
                type="button"
                aria-pressed={i === active}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className="flex w-full cursor-pointer gap-3 rounded-md px-2 py-2 text-left"
              >
                <Glyph className={cn("transition-colors", i === active && "border-gold-dark")}>{f.icon}</Glyph>
                <span className="min-w-0 pt-1.5 text-[0.98rem]/snug">
                  <strong className={cn("block transition-colors", i === active ? "text-gold-dark" : "text-ink")}>{f.title}</strong>
                  {/* On wide screens the row pointed into opens, always to three lines, and the others stay closed:
                      the grid keeps one height, whichever title is pointed at, so nothing below it moves. Within the
                      open row only the line pointed at shows. On narrow screens every line shows. */}
                  <span
                    className={cn(
                      "block pt-0.5 text-[0.93rem] text-ink-muted transition-opacity duration-200",
                      row(i) === row(active) ? "md:min-h-[calc(4.125em+0.125rem)]" : "md:hidden",
                      i !== active && "md:opacity-0",
                    )}
                  >
                    {f.text}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div aria-live="polite" className="mt-4 rounded-md border border-dashed border-rule-strong px-4 py-2.5 text-[0.95rem]/relaxed">
        <span className="mr-2 font-sans text-[0.68rem] font-bold tracking-[0.12em] text-ink-subtle uppercase">On an entry</span>
        {EXAMPLES[active]}
      </div>
    </div>
  );
}
