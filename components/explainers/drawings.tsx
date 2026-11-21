// Small line drawings for the figures, in SVG user units: apples, a researcher, an AI assistant, a basket of
// apples and a thought bubble. Each is placed with x, y (its top left) and a scale. Colours come from the design
// tokens, so they follow light and dark mode.
import type { ReactNode } from "react";

const APPLE_BODY = "M12 8.6C10.8 7.4 9.2 6.8 7.6 7 4.4 7.4 2.6 10.6 3.3 14.4 4 18.5 6.6 21.4 8.6 21.4c1 0 2-.6 3.4-.6s2.4.6 3.4.6c2 0 4.6-2.9 5.3-7 .7-3.8-1.1-7-4.3-7.4-1.6-.2-3.2.4-4.4 1.6z";

/** The site's apple (24 units square at scale 1), red for a problem or gold for a long-term goal. */
export function Apple({ x, y, s = 1, gold }: { x: number; y: number; s?: number; gold?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path className={gold ? "fill-[#e6b422]" : "fill-[#c00808]"} d={APPLE_BODY} />
      <path fill="none" stroke="#5a3a1a" strokeWidth={1.7} strokeLinecap="round" d="M12 8.6c0-1.8.6-3.4 1.8-4.6" />
      <path fill="#3f8f3f" d="M13 6.6c.4-2 2.2-3.1 4.4-2.8-.3 2.1-2 3.3-4.4 2.8z" />
    </g>
  );
}

/** A researcher with a tablet (about 48 × 72 units at scale 1). `flip` turns them to face left. */
export function Person({ x, y, s = 1, flip, thinking }: { x: number; y: number; s?: number; flip?: boolean; thinking?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})${flip ? " translate(-48 0)" : ""}`} className="stroke-ink" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 10c0-6 4-9 8-9s8 3 8 9c0 2-.5 3.5-1.2 4.6" className="fill-ink" />
      <circle cx={21} cy={11} r={6.5} className="fill-paper" />
      <path d="M9 44c0-14 3-22 12-22s12 8 12 22z" className="fill-surface" />
      <path d="M13 44l1 25M28 44l-1 25" className="fill-none" strokeWidth={4.5} />
      <path d="M10 70h7M24 70h7" className="fill-none" strokeWidth={3} />
      {thinking ? (
        // A hand at the chin.
        <path d="M30 28c3 3 3 7 0 9l-6-17" className="fill-none" />
      ) : (
        <>
          <path d="M30 28c4 3 6 7 7 9l-8 1" className="fill-none" />
          <rect x={33} y={26} width={10} height={14} rx={1.5} transform="rotate(18 38 33)" className="fill-paper" />
        </>
      )}
    </g>
  );
}

/** An AI assistant: a small robot on tracks (about 40 × 58 units). `holding`: a golden apple in its hands. */
export function Robot({ x, y, s = 1, holding }: { x: number; y: number; s?: number; holding?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="fill-none stroke-ink" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 2v6" />
        <circle cx={20} cy={2} r={2} className="fill-brand stroke-none" />
        <rect x={7} y={8} width={26} height={19} rx={7} className="fill-surface" />
        <circle cx={15} cy={17} r={2.6} className="fill-info stroke-none" />
        <circle cx={25} cy={17} r={2.6} className="fill-info stroke-none" />
        <rect x={10} y={30} width={20} height={17} rx={4} className="fill-paper" />
        <path d={holding ? "M10 36l-7 2M30 36l-4 4" : "M10 36l-6 6M30 36l6 6"} />
        <rect x={6} y={49} width={28} height={9} rx={4.5} className="fill-surface" />
        <circle cx={12} cy={53.5} r={1.6} className="fill-ink stroke-none" />
        <circle cx={20} cy={53.5} r={1.6} className="fill-ink stroke-none" />
        <circle cx={28} cy={53.5} r={1.6} className="fill-ink stroke-none" />
      </g>
      {holding && <Apple x={-12} y={26} s={0.75} gold />}
    </g>
  );
}

/** A wicker basket of red apples: the problems collected (about 46 × 34 units). */
export function Basket({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M6 2c4-6 30-6 34 0" className="fill-none stroke-gold-dark" strokeWidth={2} />
      <Apple x={6} y={-6} s={0.6} />
      <Apple x={17} y={-8} s={0.6} />
      <Apple x={27} y={-6} s={0.6} />
      <path d="M2 8h42l-5 24H7z" className="fill-gold-tint stroke-gold-dark" strokeWidth={2} strokeLinejoin="round" />
      <path d="M4 14h38M5 20h36M6 26h34M13 8l2 24M23 8v24M33 8l-2 24" className="fill-none stroke-gold-dark" strokeWidth={1} opacity={0.7} />
    </g>
  );
}

/** A thought bubble with something in it, the tail of small circles pointing down-left to the thinker. */
export function ThoughtBubble({ x, y, s = 1, children }: { x: number; y: number; s?: number; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={40} cy={30} rx={40} ry={30} className="fill-paper stroke-ink" strokeWidth={1.8} />
      <circle cx={14} cy={66} r={4.5} className="fill-paper stroke-ink" strokeWidth={1.6} />
      <circle cx={7} cy={76} r={2.5} className="fill-paper stroke-ink" strokeWidth={1.4} />
      {children}
    </g>
  );
}

/** A tiny tree for a thought bubble (fits in 50 × 40 units): a trunk, a few branches, apples. */
export function TinyTree({ x, y, gold }: { x: number; y: number; gold?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M25 40V18M25 26l-12-10M25 22l13-11M25 18l-3-12M13 16l-5 2M38 11l6 1" className="fill-none stroke-ink-muted" strokeWidth={2} strokeLinecap="round" />
      {[
        [6, 14],
        [12, 8],
        [20, 2],
        [32, 4],
        [42, 8],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3} className={gold ? "fill-gold" : "fill-brand-strong"} />
      ))}
    </g>
  );
}
