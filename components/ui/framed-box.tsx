import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** The paper's boxed environment: a framed panel with a title tab centred on its top edge. */
export function FramedBox({
  title,
  titleAs: Title = "div",
  children,
  className,
}: {
  title: ReactNode;
  titleAs?: "div" | "h1" | "h2" | "h3";
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative mt-9 mb-5 rounded-[7px] border-[1.5px] px-5 pt-7 pb-4", "border-brand-dark bg-brand-tint", className)}>
      <Title
        className={cn(
          "absolute -top-4 left-1/2 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-1.5 truncate rounded-[5px] border-[1.5px] px-3.5 py-1 font-sans text-[0.92rem]/tight font-bold",
          "max-sm:static max-sm:mx-auto max-sm:-mt-10 max-sm:mb-3 max-sm:w-fit max-sm:translate-x-0 max-sm:whitespace-normal max-sm:text-center",
          "border-brand-dark bg-brand-strong text-white",
        )}
      >
        {title}
      </Title>
      {children}
    </section>
  );
}
