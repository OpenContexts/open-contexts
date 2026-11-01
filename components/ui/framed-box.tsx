import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const TONES = {
  /** Problem statements. */
  brand: { box: "border-brand-dark bg-brand-tint", title: "border-brand-dark bg-brand-strong text-white" },
  /** Notes on a problem. */
  info: { box: "border-info-dark bg-info-tint", title: "border-info-dark bg-info-strong text-white" },
  /** Guidance, like the prototype's boxes. Dark text: white on gold is too faint to read. */
  gold: { box: "border-gold-dark bg-gold-tint", title: "border-gold-dark bg-gold text-[#111]" },
};

/** The paper's boxed environment: a framed panel with a title tab centred on its top edge. */
export function FramedBox({
  title,
  titleAs: Title = "div",
  tone = "brand",
  children,
  className,
  id,
}: {
  title: ReactNode;
  titleAs?: "div" | "h1" | "h2" | "h3";
  tone?: keyof typeof TONES;
  children: ReactNode;
  className?: string;
  /** For links to the box, e.g. /contribute#best-practices. */
  id?: string;
}) {
  return (
    <section id={id} className={cn("relative mt-9 mb-5 rounded-[7px] border-[1.5px] px-5 pt-7 pb-4", TONES[tone].box, className)}>
      <Title
        className={cn(
          "absolute -top-4 left-1/2 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-1.5 truncate rounded-[5px] border-[1.5px] px-3.5 py-1 font-sans text-[0.92rem]/tight font-bold",
          "max-sm:static max-sm:mx-auto max-sm:-mt-10 max-sm:mb-3 max-sm:w-fit max-sm:translate-x-0 max-sm:whitespace-normal max-sm:text-center",
          TONES[tone].title,
        )}
      >
        {title}
      </Title>
      {children}
    </section>
  );
}
