"use client";

import { type PointerEvent, type ReactNode, useState } from "react";

type Tip = { name: string; figures: string; x: number; y: number };

/**
 * Around the map of ContributorMap: a label by the pointer with the name and figures of the country under it, from
 * the path's data attributes; on touch screens, of the country tapped.
 */
export function MapHover({ children }: { children: ReactNode }) {
  const [tip, setTip] = useState<Tip | null>(null);
  const show = (e: PointerEvent<HTMLDivElement>) => {
    const path = (e.target as Element).closest("path[data-name]");
    if (!path) return setTip(null);
    const box = e.currentTarget.getBoundingClientRect();
    // Kept off the edges, so the label stays whole over the countries at the sides.
    const x = Math.min(Math.max(e.clientX - box.left, 90), box.width - 90);
    setTip({ name: path.getAttribute("data-name")!, figures: path.getAttribute("data-figures")!, x, y: e.clientY - box.top });
  };
  return (
    <div className="relative" onPointerMove={show} onPointerDown={show} onPointerLeave={(e) => e.pointerType === "mouse" && setTip(null)}>
      {children}
      {tip && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded border border-rule-strong bg-paper px-2.5 py-1.5 text-sm whitespace-nowrap shadow-md"
          style={{ left: tip.x, top: tip.y - 10 }}
        >
          <strong className="block">{tip.name}</strong>
          <span className="text-ink-muted">{tip.figures}</span>
        </div>
      )}
    </div>
  );
}
