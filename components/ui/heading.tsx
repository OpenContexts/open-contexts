import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Small-caps-like centred page heading, as in the paper. */
export function PageTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h1 className={cn("mt-12 mb-8 text-center text-[1.05rem] tracking-wider uppercase", className)}>{children}</h1>;
}

export function SectionTitle({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h2 id={id} className={cn("mt-16 mb-5 text-center text-base", className)}>
      {children}
    </h2>
  );
}

/**
 * A part of a page that is not part of the text itself (references, contributions, discussion):
 * spaced capitals between two rules, so it does not read as one more lettered section.
 */
export function PartTitle({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <h2
      id={id}
      className={cn(
        "mt-16 mb-5 flex scroll-mt-6 items-center gap-4 text-[0.92rem] font-bold tracking-[0.14em] uppercase before:h-px before:flex-1 before:bg-rule-strong after:h-px after:flex-1 after:bg-rule-strong",
        className,
      )}
    >
      <span>{children}</span>
    </h2>
  );
}
