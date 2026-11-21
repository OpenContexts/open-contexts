// Small drawings for the figures, in SVG user units, placed with x, y (their top left) and a scale. The people and
// robots are the paper's own illustrations, as images in public/figures.

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
