import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A section of an explainer page: a rule across the page, a centred title and at most a line of introduction,
 * then its one figure, table or set of tiles. The rule keeps neighbouring sections apart, whatever they hold.
 */
export function Section({ id, title, intro, children, className }: { id?: string; title: ReactNode; intro?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn("mt-14 scroll-mt-6 border-t border-rule-strong pt-9", className)}>
      <h2 className={cn("text-center text-[1.1rem]", intro ? "mb-2" : "mb-7")}>{title}</h2>
      {intro && <p className="mx-auto mb-7 max-w-140 text-center text-ink-muted">{intro}</p>}
      {children}
    </section>
  );
}

/** A heading inside a section, for its second figure or list. */
export function SubTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("mt-10 mb-4 text-center font-sans text-sm font-bold tracking-wide", className)}>{children}</h3>;
}
